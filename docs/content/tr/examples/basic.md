# Temel Örnekler

Bu sayfa, Mermaid diyagram tiplerinin Türkçe dokümantasyon içinde etkileşimli
kontrollerle nasıl render edildiğini gösterir. Her diyagram yakınlaştırılabilir,
sürüklenebilir, sıfırlanabilir, tam ekrana alınabilir, indirilebilir ve kaynak
kodu kopyalanabilir.

## Akış Diyagramı

```mermaid
flowchart LR
    A[Başlangıç] --> B(İşlem)
    B --> C{Karar}
    C -->|Evet| D[Sonuç 1]
    C -->|Hayır| E[Sonuç 2]
```

## Sıralama Diyagramı

```mermaid
sequenceDiagram
    participant User as Kullanıcı
    participant Frontend as Arayüz
    participant API
    participant Database as Veritabanı
    User->>Frontend: Veri iste
    Frontend->>API: İsteği gönder
    API->>Database: Sorgu çalıştır
    Database-->>API: Sonuçları döndür
    API-->>Frontend: Yanıt gönder
    Frontend-->>User: Diyagramı göster
```

## Durum Diyagramı

```mermaid
stateDiagram-v2
    [*] --> Beklemede
    Beklemede --> Hareketli
    Hareketli --> Beklemede
    Hareketli --> Hata
    Hata --> [*]
```

## Sınıf Diyagramı

```mermaid
classDiagram
    class MermaidRenderer {
        -instance: MermaidRenderer
        -config: MermaidConfig
        +getInstance(config): MermaidRenderer
        +setToolbar(toolbar): void
        +renderMermaidDiagrams(): void
    }
```

## Varlık İlişki Diyagramı

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

## Gantt Grafiği

```mermaid
gantt
    title Proje Zaman Çizelgesi
    dateFormat  YYYY-MM-DD
    section Planlama
    Gereksinimler :a1, 2024-01-01, 7d
    Tasarım       :a2, after a1, 5d
    section Geliştirme
    Kodlama       :a3, after a2, 10d
    Test          :a4, after a3, 5d
```

## Yolculuk Diyagramı

```mermaid
journey
    title Kullanıcı Kayıt Süreci
    section Siteyi Ziyaret
        Ana sayfaya gelme: 5: Kullanıcı
        Kayıt bağlantısını bulma: 3: Kullanıcı
    section Kayıt
        Formu doldurma: 3: Kullanıcı
        Gönderme: 4: Kullanıcı, Sistem
        E-postayı onaylama: 5: Kullanıcı
```
