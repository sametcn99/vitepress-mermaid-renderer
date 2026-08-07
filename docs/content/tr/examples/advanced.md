# Advanced Mermaid Examples

This page demonstrates more advanced Mermaid diagrams with advanced features and
real-world use cases.

## Advanced Flowchart with Subgraphs

```mermaid
flowchart TB
    subgraph Backend["Backend Services"]
        direction TB
        API[API Gateway] --> Auth[Authentication]
        API --> Cache[Redis Cache]
        API --> DB[(Database)]
        Cache --> DB
    end

    subgraph Frontend["Frontend Application"]
        direction TB
        UI[User Interface] --> State[State Management]
        State --> APIClient[API Client]
        APIClient --> Retry[Retry Logic]
    end

    Frontend ---> Backend

    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#bbf,stroke:#333,stroke-width:2px
```

## Advanced Sequence Diagram with Activation and Notes

```mermaid
sequenceDiagram
    participant User
    participant Client
    participant LoadBalancer
    participant ServiceA
    participant ServiceB
    participant Database

    rect rgb(200, 220, 255)
    note right of User: Authentication Flow
    User->>+Client: Login Request
    Client->>+LoadBalancer: POST /auth
    LoadBalancer->>+ServiceA: Route Request
    ServiceA->>+Database: Validate Credentials
    Database-->>-ServiceA: User Found
    ServiceA-->>-LoadBalancer: JWT Token
    LoadBalancer-->>-Client: Success Response
    Client-->>-User: Login Success
    end

    rect rgb(255, 220, 220)
    note right of User: Data Request Flow
    User->>+Client: Get Data
    Client->>+LoadBalancer: GET /data
    LoadBalancer->>+ServiceB: Route Request
    ServiceB->>+Database: Query Data
    Database-->>-ServiceB: Return Results
    ServiceB-->>-LoadBalancer: Format Response
    LoadBalancer-->>-Client: Send Data
    Client-->>-User: Display Data
    end
```

## Advanced Git Graph

```mermaid
gitGraph
    commit id: "init"
    branch develop
    commit id: "feature-1-start"
    branch feature/user-auth
    commit id: "auth-basic"
    commit id: "auth-social"
    checkout develop
    merge feature/user-auth
    branch feature/api
    commit id: "api-setup"
    commit id: "endpoints"
    checkout develop
    merge feature/api
    branch hotfix/security
    commit id: "fix-vulnerability"
    checkout main
    merge hotfix/security
    checkout develop
    merge main
    branch release/v1.0
    commit id: "version-bump"
    checkout main
    merge release/v1.0 tag: "v1.0.0"
```

## Advanced State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle
    state "Payment Process" as Payment {
        [*] --> Initializing
        Initializing --> Processing: submit
        Processing --> ValidatingPayment: process
        ValidatingPayment --> ProcessingPayment: valid
        ValidatingPayment --> Failed: invalid
        ProcessingPayment --> Success: confirmed
        ProcessingPayment --> Failed: timeout
        Failed --> [*]: exit
        Success --> [*]: complete
    }

    Idle --> Payment: start_payment
    Payment --> Idle: done

    state Failed {
        [*] --> RetryCount
        RetryCount --> Retrying: count < 3
        RetryCount --> FinalFailure: count >= 3
        Retrying --> [*]: retry
        FinalFailure --> [*]
    }
```

## Advanced ER Diagram with Relationships

```mermaid
erDiagram
    USER ||--o{ ORDER : places
    USER {
        string id PK
        string username
        string email
        string password_hash
        timestamp created_at
        boolean is_active
    }
    ORDER ||--|{ ORDER_ITEM : contains
    ORDER {
        string id PK
        string user_id FK
        decimal total_amount
        string status
        timestamp order_date
        string shipping_address
    }
    PRODUCT ||--o{ ORDER_ITEM : included_in
    PRODUCT {
        string id PK
        string name
        string description
        decimal price
        int stock_count
        string category
    }
    ORDER_ITEM {
        string id PK
        string order_id FK
        string product_id FK
        int quantity
        decimal unit_price
    }
    CATEGORY ||--o{ PRODUCT : categorizes
    CATEGORY {
        string id PK
        string name
        string description
        string parent_id FK
    }
```

## Advanced C4 Diagram

```mermaid
C4Context
    title System Context diagram for Internet Banking System
    Enterprise_Boundary(b0, "BankingCorp") {
        Person(customer, "Personal Banking Customer", "A customer of the bank with personal bank accounts")
        System(banking_system, "Internet Banking System", "Allows customers to view information about their bank accounts and make payments")

        System_Ext(mail_system, "E-mail system", "The internal Microsoft Exchange e-mail system")
        System_Ext(mainframe, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")
    }

    System_Ext(banking_app, "Banking App", "Provides a limited subset of the Internet banking functionality to customers via their mobile device")

    Rel(customer, banking_system, "Uses", "HTTPS")
    Rel(customer, banking_app, "Uses", "HTTPS")
    Rel(banking_system, mail_system, "Sends e-mails", "SMTP")
    Rel(banking_system, mainframe, "Uses", "XML/HTTPS")
    Rel(banking_app, banking_system, "Uses", "JSON/HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Swimlane Diagram

```mermaid
swimlane-beta LR
    subgraph Customer
        request[Open request]
        update[Receive update]
    end

    subgraph Support
        triage[Triage request]
        answer[Send answer]
    end

    request --> triage --> answer --> update
```

## Class Diagram

```mermaid
classDiagram
    class Account {
        +String id
        +Decimal balance
        +deposit(amount)
    }
    class Customer {
        +String name
    }
    Customer "1" --> "*" Account : owns
```

## User Journey

```mermaid
journey
    title Checkout journey
    section Browse
      Find a product: 5: Customer
      Add to cart: 4: Customer
    section Purchase
      Enter payment details: 3: Customer
      Receive confirmation: 5: Customer
```

## Gantt Chart

```mermaid
gantt
    title Release plan
    dateFormat YYYY-MM-DD
    section Development
    Design        :done, design, 2026-03-01, 3d
    Implement     :active, implement, after design, 5d
    section Release
    Verify        :verify, after implement, 2d
    Deploy        :milestone, deploy, after verify, 0d
```

## Pie Chart

```mermaid
pie showData
    title Traffic by device
    "Desktop" : 55
    "Mobile" : 35
    "Tablet" : 10
```

## Quadrant Chart

```mermaid
quadrantChart
    title Feature prioritization
    x-axis Low effort --> High effort
    y-axis Low impact --> High impact
    quadrant-1 Invest
    quadrant-2 Quick wins
    quadrant-3 Avoid
    quadrant-4 Consider
    Improve search: [0.25, 0.8]
    Redesign dashboard: [0.8, 0.7]
    Update copy: [0.2, 0.3]
```

## Requirement Diagram

```mermaid
requirementDiagram
    requirement user_login {
        id: 1
        text: the login requirement
        risk: high
        verifymethod: test
    }

    element authentication_service {
        type: simulation
    }

    authentication_service - satisfies -> user_login
```

## Mindmap

```mermaid
mindmap
    root((Release))
        Planning
            Scope
            Schedule
        Delivery
            Build
            Test
        Operations
            Monitor
```

## Timeline

```mermaid
timeline
    title Product milestones
    2024 : Research
         : Prototype
    2025 : Public beta
         : General availability
    2026 : Expansion
```

## ZenUML Sequence Diagram

```mermaid
zenuml
    title Order processing
    Customer->Service: Place order
    Service->Inventory: Reserve items
    Inventory->Service: Items reserved
    Service->Customer: Confirm order
```

## Sankey Diagram

```mermaid
sankey-beta
Visitors,Documentation,700
Visitors,Examples,300
Documentation,Installation,420
Documentation,Configuration,280
Examples,Advanced examples,180
Examples,Basic examples,120
```

## XY Chart

```mermaid
xychart
    title "Monthly signups"
    x-axis [Jan, Feb, Mar, Apr]
    y-axis "Users" 0 --> 100
    bar [35, 52, 76, 90]
    line [30, 50, 72, 85]
```

## Block Diagram

```mermaid
block
    columns 3
    Browser space API
    space:3
    Cache space Database
    Browser --> API
    API --> Cache
    API --> Database
```

## Packet Diagram

```mermaid
packet
    title UDP Packet
    +16: "Source Port"
    +16: "Destination Port"
    +16: "Length"
    +16: "Checksum"
    +32: "Payload"
```

## Kanban Board

```mermaid
kanban
    backlog[Backlog]
        research[Research requirements]
    progress[In progress]
        implement[Implement renderer]@{ assigned: "Developer", priority: "High" }
    done[Done]
        tests[Add browser tests]
```

## Architecture Diagram

```mermaid
architecture-beta
    group platform(cloud)[Platform]

    service web(server)[Web app] in platform
    service api(server)[API] in platform
    service data(database)[Database] in platform

    web:R --> L:api
    api:B --> T:data
```

## Radar Chart

```mermaid
radar-beta
    title Engineering metrics
    axis quality["Quality"], delivery["Delivery"], reliability["Reliability"]
    curve current["Current"]{80, 70, 75}
    curve target["Target"]{90, 85, 90}
    max 100
```

## Event Modeling Diagram

```mermaid
eventmodeling

    tf 01 ui CheckoutUI
    tf 02 cmd SubmitOrder
    tf 03 evt OrderSubmitted
```

## Treemap

```mermaid
treemap-beta
    "Documentation"
        "Guides": 45
        "Examples": 30
    "Source"
        "Components": 35
        "Composables": 20
```

## Venn Diagram

```mermaid
venn-beta
    title "Team skills"
    set frontend[Frontend]
    set backend[Backend]
    union frontend,backend[Full stack]
```

## Ishikawa Diagram

```mermaid
ishikawa-beta
    Slow page load
    Network
        High latency
        Large payloads
    Application
        Expensive queries
        Uncached responses
    Browser
        Blocking scripts
```

## Wardley Map

```mermaid
wardley-beta
    title Delivery platform

    anchor User [0.9, 0.9]
    component WebApp [0.75, 0.6]
    component API [0.6, 0.7]
    component Cloud [0.3, 0.9]

    User -> WebApp
    WebApp -> API
    API -> Cloud
```

## Cynefin Framework

```mermaid
cynefin-beta
    title Delivery decisions

    complex
        "Explore a new product"
    complicated
        "Tune a database"
    clear
        "Apply a routine update"
    chaotic
        "Restore an unavailable service"
    confusion
        "Classify an incident"

    complex --> complicated : "Pattern identified"
    clear --> chaotic : "Complacency"
```

## TreeView Diagram

```mermaid
treeView-beta
    vitepress-mermaid-renderer/
        src/
            MermaidDiagram.vue
            index.ts
        tests/
            e2e/
        package.json
```
