# DSA Hub – API Reference and Complexity Analysis

## 1. Backend API Endpoints

The Express backend exposes the following routes:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check server health |
| GET | `/api/cpp/status` | Check C++ backend status |
| GET | `/api/topics` | Retrieve available topics |
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate a user |
| GET | `/api/auth/me` | Retrieve authenticated user details |
| GET | `/api/progress` | Retrieve user progress |
| POST | `/api/progress` | Update user progress |

Protected endpoints use bearer-token authentication.

## 2. Complexity Analysis

Let:
- `n` = Number of records in the hash map.
- `k` = Length of the key.

| Operation | Average Time Complexity | Worst-Case Time Complexity |
|---|---:|---:|
| Hash function | O(k) | O(k) |
| Hash map search | O(1) | O(n) |
| Hash map insertion | O(1) | O(n) |
| Hash map retrieval | O(1) | O(n) |

Hash map operations generally take O(1) average time when keys are distributed well. With many collisions in one bucket, separate chaining may require O(n) traversal.

## 3. Advantages

- Centralized learning resources.
- Modular frontend and backend architecture.
- Practical implementation of a custom hash map.
- User authentication and progress management.
- Integration of TypeScript and C++.

## 4. Future Enhancements

- Interactive algorithm visualizations.
- Coding exercises with automatic evaluation.
- Topic-based quizzes.
- Improved progress analytics.
- Stronger password security and authentication configuration.
- Scalable persistent data storage.
