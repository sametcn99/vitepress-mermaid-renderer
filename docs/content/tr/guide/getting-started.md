---
sidebarDepth: 2
---

# VitePress Mermaid Renderer ile Başlangıç

VitePress Mermaid Renderer, statik Mermaid diyagramlarını duyarlı, tema uyumlu
ve erişilebilir etkileşimli diyagramlara dönüştürür. İngilizce, Türkçe ve Çince
VitePress siteleri için locale uyumlu araç çubuğu metinleri sağlar.

## Bu eklenti neden önemli?

- **Etkileşimli görselleştirme** karmaşık diyagramları masaüstü ve mobilde
  okunabilir tutar. Renderer yakınlaştırma, sürükleme, sıfırlama, kopyalama,
  indirme ve tam ekran kontrolleri ekler.
- **Dokümantasyon odaklı iş akışı** Markdown yazmaya devam etmenizi sağlar.
  VitePress, her Mermaid kod bloğunu yapılandırılmış araç çubuğuyla güçlendirir.
- **Locale uyumlu arayüz** araç çubuğu başlıklarının, erişilebilir etiketlerin
  ve kopyalama başarı metninin `useData().localeIndex` değerini izlemesini
  sağlar.
- **SEO dostu çıktı** dokümantasyonu statik üretirken etkileşimli katmanı
  tarayıcıda hydration sonrasında çalıştırır.

## Rehberde neler var?

| Konu                     | Açıklama                                                                                                                |
| :----------------------- | :---------------------------------------------------------------------------------------------------------------------- |
| Kurulum ve Ayarlar       | `vitepress-mermaid-renderer` paketini kurun, `.vitepress/theme` içine bağlayın ve yerel render davranışını doğrulayın.  |
| Yapılandırma             | Mermaid seçeneklerini `createMermaidRenderer()` ile geçin ve VitePress durumu değiştiğinde tema ayarlarını güncelleyin. |
| Araç Çubuğu Özelleştirme | Mod bazlı düğmeleri, indirme formatını, tam ekran davranışını, konumu ve yerelleştirilmiş metinleri yönetin.            |
| Yapılandırma Tipleri     | Locale özel metinler için kullanılan `i18n` yapısını ve araç çubuğu seçeneklerini inceleyin.                            |
| Sorun Giderme            | Hydration, eski cache, route geçişi, yerelleştirme ve erişilebilirlik sorunlarını tanılayın.                            |

## Renderer nasıl çalışır?

1. VitePress, Mermaid kod bloklarını build sırasında statik Markdown olarak
   üretir.
2. Tema, istemci tarafında hydration başladıktan sonra `createMermaidRenderer()`
   çağırır.
3. Renderer Mermaid bloklarını bulur, Vue tabanlı diyagram bileşenlerini mount
   eder ve araç çubuğunu ekler.
4. Tema veya locale değişiklikleri gibi runtime güncellemeleri, mount edilmiş
   diyagramlara update eventleri gönderir.

Bu akış Markdown yazımını sade tutarken her desteklenen dilde okuyucuya
etkileşimli bir diyagram yüzeyi sunar.
