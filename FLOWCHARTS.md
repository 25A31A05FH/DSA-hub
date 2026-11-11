# DSA Hub – Flowcharts

The following diagrams use Mermaid syntax. GitHub automatically renders Mermaid diagrams when this Markdown file is viewed in the repository.

## 1. Overall System Flowchart

```mermaid
flowchart TD
    A([Start]) --> B[Load Frontend]
    B --> C[User Sends Request]
    C --> D[Send Request to Backend]
    D --> E[Validate Request]
    E --> F{Request Valid?}
    F -- No --> G[Return Error]
    F -- Yes --> H{Authentication Required?}
    H -- Yes --> I[Verify Token]
    I --> J{Token Valid?}
    J -- No --> G
    J -- Yes --> K[Execute Operation]
    H -- No --> K
    K --> L[Process Data]
    L --> M[Send Response]
    M --> N[Display Result]
    G --> N
    N --> O([Stop])
```

## 2. Hash Map Flowchart

```mermaid
flowchart TD
    A([Start]) --> B[Create Hash Table]
    B --> C[/Enter Key/]
    C --> D[Initialize Hash Value]
    D --> E[Process Each Character]
    E --> F[Calculate Hash Value]
    F --> G[Calculate Bucket Index]
    G --> H[Access Bucket]
    H --> I{Key Exists?}
    I -- Yes --> J[Retrieve Existing Record]
    I -- No --> K[Insert New Record]
    J --> L([Stop])
    K --> L
```

## 3. User Registration Flowchart

```mermaid
flowchart TD
    A([Start]) --> B[/Enter Username and Password/]
    B --> C{Input Valid?}
    C -- No --> D[Display Invalid Input]
    C -- Yes --> E[Search User in Hash Map]
    E --> F{User Exists?}
    F -- Yes --> G[Display User Already Exists]
    F -- No --> H[Create User Record]
    H --> I[Insert Record]
    I --> J[Save Data]
    J --> K[Display Registration Success]
    D --> L([Stop])
    G --> L
    K --> L
```

## 4. User Login Flowchart

```mermaid
flowchart TD
    A([Start]) --> B[/Enter Username and Password/]
    B --> C[Search Username]
    C --> D{User Found?}
    D -- No --> E[Display User Not Found]
    D -- Yes --> F[Retrieve User Record]
    F --> G{Password Correct?}
    G -- No --> H[Display Invalid Password]
    G -- Yes --> I[Generate Authentication Token]
    I --> J[Display Login Success]
    E --> K([Stop])
    H --> K
    J --> K
```

## 5. Learning Progress Update Flowchart

```mermaid
flowchart TD
    A([Start]) --> B[Receive Progress Request]
    B --> C[Verify Authentication Token]
    C --> D{Token Valid?}
    D -- No --> E[Return Unauthorized]
    D -- Yes --> F[Identify User]
    F --> G[Retrieve Progress]
    G --> H[Select Topic]
    H --> I{Topic Completed?}
    I -- Yes --> J[Mark Incomplete]
    I -- No --> K[Mark Completed]
    J --> L[Save Updated Progress]
    K --> L
    L --> M[Return Updated Progress]
    E --> N([Stop])
    M --> N
```

## 6. Backend Request Flowchart

```mermaid
flowchart TD
    A([Start]) --> B[User Interacts With Frontend]
    B --> C[Send API Request]
    C --> D[Express Server Receives Request]
    D --> E[Validate Request]
    E --> F{Request Valid?}
    F -- No --> G[Return Error Response]
    F -- Yes --> H{Authentication Required?}
    H -- Yes --> I[Verify Token]
    I --> J{Token Valid?}
    J -- No --> G
    J -- Yes --> K[Execute Backend Operation]
    H -- No --> K
    K --> L[Process Data]
    L --> M[Return API Response]
    M --> N[Frontend Displays Result]
    G --> N
    N --> O([Stop])
```
