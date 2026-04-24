# Temel Örnekler

Bu sayfa, Türkçe locale altında Mermaid araç çubuğunun ve temel diyagram etkileşimlerinin beklendiği gibi çalıştığını doğrulamak için hazırlanmıştır.

- Yakınlaştırma, sıfırlama, kopyalama ve indirme düğmeleri Türkçe başlıklarla görünmelidir.
- Tema veya locale değiştiğinde araç çubuğu yeniden mount edilmeden güncellenmelidir.

## Akış Diyagramı

```mermaid
flowchart LR
    A[Başla] --> B(İşlem)
    B --> C{Karar}
    C -->|Evet| D[Sonuç 1]
    C -->|Hayır| E[Sonuç 2]
```

## Sıralama Diyagramı

```mermaid
sequenceDiagram
    participant Kullanıcı
    participant Arayüz
    participant API
    Kullanıcı->>Arayüz: Diyagramı aç
    Arayüz->>API: Veriyi iste
    API-->>Arayüz: Sonucu dön
    Arayüz-->>Kullanıcı: Diyagramı göster
```
