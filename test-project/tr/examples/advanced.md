# Gelişmiş Mermaid Örnekleri

Bu sayfa, daha büyük ve gerçek dünyaya yakın Mermaid diyagramları üzerinde toolbar davranışını gözlemlemek için hazırlanmıştır.

## Alt Grafikler İçeren Gelişmiş Akış Diyagramı

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
```

## Notlar ve Aktivasyonlarla Sıralama Diyagramı

```mermaid
sequenceDiagram
    participant Kullanıcı
    participant İstemci
    participant YükDengeleyici
    participant ServisA
    participant Veritabanı

    Kullanıcı->>+İstemci: Giriş isteği
    İstemci->>+YükDengeleyici: POST /auth
    YükDengeleyici->>+ServisA: İsteği yönlendir
    ServisA->>+Veritabanı: Kimlik bilgilerini doğrula
    Veritabanı-->>-ServisA: Kullanıcı bulundu
    ServisA-->>-YükDengeleyici: JWT token
    YükDengeleyici-->>-İstemci: Başarılı yanıt
    İstemci-->>-Kullanıcı: Giriş başarılı
```

## Git Akışı

```mermaid
gitGraph
    commit id: "başlangıç"
    branch develop
    commit id: "özellik-başladı"
    branch feature/i18n-toolbar
    commit id: "tooltip-çevirileri"
    commit id: "locale-watcher"
    checkout develop
    merge feature/i18n-toolbar
    branch release/v1.1.22
    commit id: "sürüm-notları"
    checkout main
    merge release/v1.1.22 tag: "v1.1.22"
```
