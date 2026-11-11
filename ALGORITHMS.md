# DSA Hub – Algorithms and Pseudocode

This document describes the main workflows and algorithms implemented by the DSA Hub application. The pseudocode is a logical representation of the operations; implementation details may vary between the C++ backend and Express server.

## 1. Overall Application Workflow

**Input:** User request and optional authentication details.  
**Output:** Application response.

### Steps

1. Start the application.
2. Load the frontend.
3. Accept a user request.
4. Send the request to the backend server.
5. Validate the request.
6. Verify authentication when required.
7. Execute the requested operation.
8. Retrieve or update the required data.
9. Return the response to the frontend.
10. Display the result.

### Pseudocode

```text
START
Initialize Application
Display Frontend

WHILE Application Is Running
    Accept User Request
    Send Request To Backend

    IF Request Is Valid THEN
        Identify Requested Operation

        IF Authentication Is Required THEN
            Verify User Token
        END IF

        Execute Requested Operation
        Send Response To Frontend
        Display Result
    ELSE
        Display Error Message
    END IF
END WHILE

STOP
```

## 2. Hash Map Algorithm

The C++ backend uses a custom hash map with separate chaining. A key is converted into a bucket index using a DJB2-style hash function. Each bucket can contain a linked list to handle collisions.

### Hash Function

```cpp
unsigned long hashFunction(string key) {
    unsigned long hash = 5381;

    for (char c : key) {
        hash = ((hash << 5) + hash) + c;
    }

    return hash % TABLE_SIZE;
}
```

### Pseudocode

```text
START
Create Hash Table
INPUT key
hash = 5381

FOR EACH character IN key
    hash = hash * 33 + character
END FOR

index = hash MOD TABLE_SIZE
ACCESS hashTable[index]
SEARCH linked list in bucket

IF key EXISTS THEN
    RETURN corresponding record
ELSE
    INSERT new record
END IF

STOP
```

## 3. User Registration Algorithm

**Input:** Username and password.  
**Output:** Registration success or failure.

### Steps

1. Accept username and password.
2. Validate the input.
3. Search for the username in the user data structure.
4. If the username already exists, return an error.
5. Otherwise, create and insert a new user record.
6. Save the updated data using the backend persistence mechanism.
7. Return the result.

### Pseudocode

```text
START
INPUT username, password

IF username OR password IS INVALID THEN
    DISPLAY "Invalid Input"
ELSE
    SEARCH username IN USER DATA

    IF username EXISTS THEN
        DISPLAY "User Already Exists"
    ELSE
        CREATE New User Record
        INSERT Record
        SAVE Updated Data
        DISPLAY "Registration Successful"
    END IF
END IF

STOP
```

## 4. User Login Algorithm

**Input:** Username and password.  
**Output:** Authentication success or failure.

### Steps

1. Accept username and password.
2. Search for the username.
3. If the username does not exist, return an error.
4. Retrieve the user record.
5. Verify the supplied password.
6. If valid, generate an authentication token.
7. Otherwise, return an authentication error.

### Pseudocode

```text
START
INPUT username, password
SEARCH username IN USER DATA

IF username DOES NOT EXIST THEN
    DISPLAY "User Not Found"
ELSE
    RETRIEVE User Record

    IF password IS CORRECT THEN
        GENERATE Authentication Token
        DISPLAY "Login Successful"
    ELSE
        DISPLAY "Invalid Password"
    END IF
END IF

STOP
```

## 5. Learning Progress Update Algorithm

**Input:** Authenticated user and selected topic.  
**Output:** Updated learning progress.

### Steps

1. Receive a progress update request.
2. Verify the authentication token.
3. Identify the authenticated user.
4. Retrieve the user's progress.
5. Check the selected topic's current status.
6. Toggle its completion status.
7. Save the updated progress.
8. Return the updated result.

### Pseudocode

```text
START
RECEIVE Progress Request
VERIFY Authentication Token

IF Token Is Invalid THEN
    DISPLAY "Unauthorized"
ELSE
    IDENTIFY User
    RETRIEVE User Progress
    INPUT Selected Topic

    IF Topic Is Completed THEN
        MARK Topic As Incomplete
    ELSE
        MARK Topic As Completed
    END IF

    SAVE Updated Progress
    DISPLAY Updated Progress
END IF

STOP
```

## 6. Complexity Analysis

Let `n` be the number of records in the hash map and `k` be the length of a key.

| Operation | Average Time | Worst-Case Time |
|---|---:|---:|
| Hash function | O(k) | O(k) |
| Hash map search | O(1) | O(n) |
| Hash map insertion | O(1) | O(n) |
| Hash map retrieval | O(1) | O(n) |

Hash map operations are generally constant time on average when keys are distributed well. In the worst case, collisions may cause many records to occupy the same bucket, resulting in linear-time traversal.
