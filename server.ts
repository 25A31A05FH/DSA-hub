import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { execFile, execSync } from 'child_process';
import dotenv from 'dotenv';
import { topics } from './src/data/topics.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const BINARY_NAME = isWindows ? 'dsahub_backend.exe' : 'dsahub_backend';
const CPP_BINARY_PATH = path.resolve(__dirname, 'backend_cpp', BINARY_NAME);
const CPP_SOURCE_PATH = path.resolve(__dirname, 'backend_cpp', 'dsahub_backend.cpp');
const DB_STORAGE_PATH = process.env.DSAHUB_DB_PATH || path.resolve(__dirname, 'backend_cpp', 'dsahub_users.txt');

// Ensure native C++ binary is compiled and has execute permissions
function ensureCppBinary(): boolean {
  try {
    if (!fs.existsSync(CPP_BINARY_PATH)) {
      console.log(`[C++ Engine] Compiling native binary from ${CPP_SOURCE_PATH}...`);
      const compiler = process.env.CXX || 'g++';
      execSync(`${compiler} -O2 -std=c++17 "${CPP_SOURCE_PATH}" -o "${CPP_BINARY_PATH}"`, {
        stdio: 'pipe',
      });
    }
    if (!isWindows && fs.existsSync(CPP_BINARY_PATH)) {
      try {
        const stat = fs.statSync(CPP_BINARY_PATH);
        if ((stat.mode & 0o111) === 0) {
          fs.chmodSync(CPP_BINARY_PATH, 0o755);
        }
      } catch {
        // ignore
      }
    }
    return fs.existsSync(CPP_BINARY_PATH);
  } catch (err: any) {
    console.warn('[C++ Engine] Binary check note:', err?.message || err);
    return fs.existsSync(CPP_BINARY_PATH);
  }
}

// Initial check on boot
ensureCppBinary();

// Helper to execute commands on the native C++ Data Structures Engine
function runCppEngine(args: string[]): Promise<any> {
  return new Promise((resolve) => {
    ensureCppBinary();
    const env = { ...process.env, DSAHUB_DB_PATH: DB_STORAGE_PATH };
    execFile(CPP_BINARY_PATH, args, { env, timeout: 6000 }, (err, stdout) => {
      if (err) {
        if (!isWindows && (err.message.includes('EACCES') || err.message.includes('permission'))) {
          try {
            fs.chmodSync(CPP_BINARY_PATH, 0o755);
            execFile(CPP_BINARY_PATH, args, { env, timeout: 6000 }, (retryErr, retryStdout) => {
              if (retryErr || !retryStdout) {
                resolve(null);
                return;
              }
              try {
                resolve(JSON.parse(retryStdout.trim()));
              } catch {
                resolve(null);
              }
            });
            return;
          } catch {
            resolve(null);
            return;
          }
        }
        resolve(null);
        return;
      }
      if (!stdout || !stdout.trim()) {
        resolve(null);
        return;
      }
      try {
        const json = JSON.parse(stdout.trim());
        resolve(json);
      } catch {
        resolve(null);
      }
    });
  });
}

// In-memory fallback (only used if native C++ engine is unreachable)
const fallbackUsers = new Map<string, any>();

const JWT_SECRET = process.env.JWT_SECRET || 'dsahub_secret_key_2026';

function createToken(user: { id: string; name: string; email: string }): string {
  const payload = JSON.stringify({
    id: user.id,
    name: user.name,
    email: user.email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });
  const b64Payload = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(b64Payload).digest('base64url');
  return `${b64Payload}.${signature}`;
}

function verifyToken(token: string): { id: string; name: string; email: string } | null {
  try {
    const [b64Payload, signature] = token.split('.');
    if (!b64Payload || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(b64Payload).digest('base64url');
    if (signature !== expectedSig) return null;
    const data = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf-8'));
    if (data.exp && data.exp < Date.now()) return null;
    return { id: data.id, name: data.name, email: data.email };
  } catch {
    return null;
  }
}

function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  const token = header.slice(7);
  const user = verifyToken(token);
  if (!user) {
    res.status(401).json({ message: 'Invalid or expired token' });
    return;
  }
  (req as any).user = user;
  next();
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // Health and C++ Engine Status
  app.get('/api/health', async (_req: Request, res: Response) => {
    const cppRes = await runCppEngine(['status']);
    res.json({
      status: 'ok',
      app: 'DSA Hub API',
      version: '2.0.0',
      backend_engine: cppRes || { status: 'ok', engine: 'TypeScript Fallback Engine' },
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/cpp/status', async (_req: Request, res: Response) => {
    const cppRes = await runCppEngine(['status']);
    res.json(cppRes || { status: 'fallback', message: 'Running on in-memory data structures' });
  });

  app.get('/api/topics', (_req: Request, res: Response) => {
    res.json(topics);
  });

  // Auth Routes (Powered by C++ Custom Chained HashMap)
  app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
      res.status(400).json({ message: 'Name, valid email, and password of at least 6 characters required' });
      return;
    }
    const cleanEmail = email.toLowerCase().trim();

    // 1. Try C++ Native Data Structures Engine
    const cppRes = await runCppEngine(['register', name.trim(), cleanEmail, password]);
    if (cppRes && cppRes.status === 'success') {
      const token = createToken(cppRes.user);
      res.status(201).json({
        token,
        user: cppRes.user,
        completedTopics: cppRes.completedTopics,
        backendEngine: 'C++ Chained HashMap',
      });
      return;
    }

    if (cppRes && cppRes.error) {
      res.status(400).json({ message: cppRes.error });
      return;
    }

    // Fallback if C++ binary fails
    if (fallbackUsers.has(cleanEmail)) {
      res.status(400).json({ message: 'Account already exists with this email' });
      return;
    }

    const newUser = {
      id: 'student_' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      password,
      completedTopics: [],
    };
    fallbackUsers.set(cleanEmail, newUser);
    const token = createToken(newUser);
    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email },
      completedTopics: newUser.completedTopics,
      backendEngine: 'TypeScript In-Memory Map',
    });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password required' });
      return;
    }
    const cleanEmail = email.toLowerCase().trim();

    // 1. Try C++ Native Data Structures Engine
    const cppRes = await runCppEngine(['login', cleanEmail, password]);
    if (cppRes && cppRes.status === 'success') {
      const token = createToken(cppRes.user);
      res.json({
        token,
        user: cppRes.user,
        completedTopics: cppRes.completedTopics,
        backendEngine: 'C++ Chained HashMap',
      });
      return;
    }

    if (cppRes && cppRes.error) {
      res.status(401).json({ message: cppRes.error });
      return;
    }

    // Fallback
    const user = fallbackUsers.get(cleanEmail);
    if (!user || user.password !== password) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = createToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
      completedTopics: user.completedTopics,
      backendEngine: 'TypeScript In-Memory Map',
    });
  });

  app.get('/api/auth/me', authMiddleware, (req: Request, res: Response) => {
    res.json({ user: (req as any).user });
  });

  // Progress Routes (Powered by C++ Engine)
  app.get('/api/progress', authMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const cppRes = await runCppEngine(['get_progress', user.email]);
    if (cppRes && cppRes.completedTopics) {
      res.json(cppRes.completedTopics);
      return;
    }

    const fallback = fallbackUsers.get(user.email);
    res.json(fallback ? fallback.completedTopics : []);
  });

  app.post('/api/progress', authMiddleware, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const { topicId } = req.body;
    if (!topicId) {
      res.status(400).json({ message: 'topicId is required' });
      return;
    }

    const cppRes = await runCppEngine(['save_progress', user.email, topicId]);
    if (cppRes && cppRes.completedTopics) {
      res.json({
        message: 'Progress recorded in C++ Data Structures Engine',
        topicId,
        completedTopics: cppRes.completedTopics,
      });
      return;
    }

    const fallback = fallbackUsers.get(user.email);
    if (fallback && !fallback.completedTopics.includes(topicId)) {
      fallback.completedTopics.push(topicId);
    }
    res.json({ message: 'Progress saved', topicId, completedTopics: fallback?.completedTopics || [topicId] });
  });

  // Vite Middleware / Static Files
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DSA Hub server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
