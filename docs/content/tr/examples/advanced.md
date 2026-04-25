# Gelişmiş Mermaid Örnekleri

Bu sayfa daha büyük ve gerçek dünyaya yakın Mermaid diyagramları üzerinde araç
çubuğu davranışını gösterir. Geniş diyagramlarda tam ekran, reset ve indirme
kontrolleri özellikle faydalıdır.

## Alt Grafikler İçeren Akış Diyagramı

```mermaid
flowchart TB
    subgraph Backend["Arka Uç Servisleri"]
        direction TB
        API[API Geçidi] --> Auth[Kimlik Doğrulama]
        API --> Cache[Redis Önbelleği]
        API --> DB[(Veritabanı)]
        Cache --> DB
    end

    subgraph Frontend["Ön Uç Uygulaması"]
        direction TB
        UI[Kullanıcı Arayüzü] --> State[Durum Yönetimi]
        State --> APIClient[API İstemcisi]
        APIClient --> Retry[Yeniden Deneme Mantığı]
    end

    Frontend ---> Backend

    style Frontend fill:#f9f,stroke:#333,stroke-width:2px
    style Backend fill:#bbf,stroke:#333,stroke-width:2px
```

## Aktivasyon ve Notlar İçeren Sıralama Diyagramı

```mermaid
sequenceDiagram
    participant User as Kullanıcı
    participant Client as İstemci
    participant LoadBalancer as YükDengeleyici
    participant ServiceA as ServisA
    participant ServiceB as ServisB
    participant Database as Veritabanı

    rect rgb(200, 220, 255)
    note right of User: Kimlik doğrulama akışı
    User->>+Client: Giriş isteği
    Client->>+LoadBalancer: POST /auth
    LoadBalancer->>+ServiceA: İsteği yönlendir
    ServiceA->>+Database: Bilgileri doğrula
    Database-->>-ServiceA: Kullanıcı bulundu
    ServiceA-->>-LoadBalancer: JWT token
    LoadBalancer-->>-Client: Başarılı yanıt
    Client-->>-User: Giriş başarılı
    end

    rect rgb(255, 220, 220)
    note right of User: Veri isteği akışı
    User->>+Client: Veri al
    Client->>+LoadBalancer: GET /data
    LoadBalancer->>+ServiceB: İsteği yönlendir
    ServiceB->>+Database: Veriyi sorgula
    Database-->>-ServiceB: Sonuçları döndür
    ServiceB-->>-LoadBalancer: Yanıtı biçimlendir
    LoadBalancer-->>-Client: Veriyi gönder
    Client-->>-User: Veriyi göster
    end
```

## Gelişmiş Git Grafiği

```mermaid
gitGraph
    commit id: "başlangıç"
    branch develop
    commit id: "özellik-1-başladı"
    branch feature/user-auth
    commit id: "auth-temel"
    commit id: "auth-sosyal"
    checkout develop
    merge feature/user-auth
    branch feature/api
    commit id: "api-kurulum"
    commit id: "endpointler"
    checkout develop
    merge feature/api
    branch hotfix/security
    commit id: "güvenlik-düzeltme"
    checkout main
    merge hotfix/security
    checkout develop
    merge main
    branch release/stable
    commit id: "sürüm-güncelleme"
    checkout main
    merge release/stable tag: "stable-release"
```

## Gelişmiş Durum Makinesi

```mermaid
stateDiagram-v2
    [*] --> Idle
    state "Ödeme Süreci" as Payment {
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

## Gelişmiş ER Diyagramı

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

## C4 Diyagramı

```mermaid
C4Context
    title İnternet Bankacılığı Sistemi için Sistem Bağlam Diyagramı
    Enterprise_Boundary(b0, "BankingCorp") {
        Person(customer, "Bireysel Bankacılık Müşterisi", "Bankada kişisel hesabı olan müşteri")
        System(banking_system, "İnternet Bankacılığı Sistemi", "Müşterilerin hesap bilgilerini görüntülemesini ve ödeme yapmasını sağlar")

        System_Ext(mail_system, "E-posta sistemi", "Şirket içi Microsoft Exchange e-posta sistemi")
        System_Ext(mainframe, "Ana Bankacılık Sistemi", "Müşteri, hesap ve işlem bilgilerini saklar")
    }

    System_Ext(banking_app, "Bankacılık Uygulaması", "Mobil cihaz üzerinden sınırlı bankacılık işlevleri sağlar")

    Rel(customer, banking_system, "Kullanır", "HTTPS")
    Rel(customer, banking_app, "Kullanır", "HTTPS")
    Rel(banking_system, mail_system, "E-posta gönderir", "SMTP")
    Rel(banking_system, mainframe, "Kullanır", "XML/HTTPS")
    Rel(banking_app, banking_system, "Kullanır", "JSON/HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```
