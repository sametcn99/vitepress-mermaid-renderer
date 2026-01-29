# Basic Examples

This page demonstrates various types of Mermaid diagrams with interactive controls. Each diagram can be:

- 🔍 Zoomed in/out
- 🖱️ Panned by dragging
- 🔄 Reset to original view
- 🖥️ Viewed in fullscreen
- 📋 Code can be copied with one click

## Flowchart

```mermaid
flowchart LR
    A[Start] --> B(Process)
    B --> C{Decision}
    C -->|Yes| D[Result 1]
    C -->|No| E[Result 2]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant Frontend
    participant API
    participant Database
    Frontend->>API: Request Data
    API->>Database: Query
    Database-->>API: Results
    API-->>Frontend: Response
```

## State Diagram

```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```

## Class Diagram

```mermaid
classDiagram
    class MermaidRenderer {
        -instance: MermaidRenderer
        -config: MermaidConfig
        +getInstance(config): MermaidRenderer
        +setConfig(config): void
        +renderMermaidDiagrams(): void
    }
```

## Entity Relationship

```mermaid
erDiagram
    USER ||--o{ POST : creates
    USER {
        string id
        string name
        string email
    }
    POST {
        string id
        string title
        string content
    }
```

## Gantt Chart

```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Planning
    Requirements  :a1, 2024-01-01, 7d
    Design       :a2, after a1, 5d
    section Development
    Coding       :a3, after a2, 10d
    Testing      :a4, after a3, 5d
```

## Journey Diagram

```mermaid
journey
    title User Sign Up Process
    section Visit Website
        Land on Homepage: 5: User
        Find Sign Up: 3: User
    section Registration
        Fill Form: 3: User
        Submit: 4: User, System
        Confirm Email: 5: User
```
