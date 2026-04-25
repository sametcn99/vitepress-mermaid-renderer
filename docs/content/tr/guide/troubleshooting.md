---
sidebarDepth: 2
---

# Sorun Giderme ve En İyi Uygulamalar

Sağlam bir kurulumda bile VitePress dokümantasyon siteleri production ortamında
Mermaid render sorunları yaşayabilir. Bu kontrol listesi renderer, çok dilli
dokümanlar ve toolbar i18n üzerine odaklanır.

## 1. Kurulum veya güncelleme sorunları

Paket kurulumu ya da yeni sürüme geçiş sonrası beklenmeyen hatalar görürseniz
VitePress cache ve build artifact’lerini temizleyin. `.vitepress/cache` ve
`dist` klasörlerini silip geliştirme sunucusunu yeniden başlatmak çoğu stale
dependency sorununu çözer.

## 2. Diyagramlar görünmüyor

- Mermaid kod bloklarının `mermaid` dil etiketiyle işaretlendiğini doğrulayın.
  Yazım hataları algılamayı engeller.
- Deploy öncesi `bun run docs:dev` çalıştırın ve hydration hataları için konsolu
  kontrol edin.
- Renderer kurulumunu server-only config dosyalarına değil, istemci tarafındaki
  VitePress tema dosyasına yerleştirin.

## 3. Araç çubuğu düğmeleri eksik

- `setToolbar()` yapılandırmasını kontrol edin. Renderer derin merge yapar;
  hatalı nested nesneler tüm breakpoint’lerde düğme kaybına neden olabilir.
- Diyagram başına sade bir toolbar gerekiyorsa `mermaidRenderer.setToolbar()`
  çağrısını ilk render öncesinde yapın.
- Mobil toolbar dar ekranlarda sadeleşir. `positions` ile kontrolleri
  breakpoint’ler arasında aynı köşeye sabitleyin.

## 4. Koyu mod yanlış render ediliyor

- `useData().isDark` değerini izlediğinizden emin olun. Bu hook olmadan Mermaid
  ilk yüklemedeki temada kalır.
- Watcher içinde
  `createMermaidRenderer({ theme: isDark.value ? "dark" : "forest" })` çağırın.

## 5. Toolbar metni yerelleşmiyor

- VitePress locale anahtarlarınızın `i18n.locales` içindeki anahtarlarla
  eşleştiğini doğrulayın. Bu docs sitesinde desteklenen anahtarlar `root`, `tr`
  ve `zh`.
- `useData()` içindeki `localeIndex.value` değerini
  `setToolbar({ i18n: { localeIndex } })` içine geçin.
- Kopyalama başarı mesajını çevirmek için `copyCodeCopied` anahtarını ekleyin.
- Client-side locale geçişlerinde mount edilmiş diyagramları güncellemek için
  `localeIndex` değerini watch edip `setToolbar()` çağrısını tekrarlayın.

## 6. Build sırasında SVG bozuluyor

Mermaid dependency’leri değiştiğinde `vitepress build` öncesi `.vitepress/cache`
klasörünü temizleyin. Eski cache girdileri renderer’ın önceki sürümünü
tutabilir.

## 7. Erişilebilirlik kontrolleri

- Ekran okuyucular diyagram bağlamı için `showLanguageLabel` değerinden
  yararlanabilir. Kapalı kullanıyorsanız çevrede açıklayıcı metin sağlayın.
- Kritik bilgi taşıyan diyagramlar için çevre metinde eşdeğer açıklama sunun.
- Yerelleştirilmiş toolbar metinlerinin sadece görsel tooltip değil, anlamlı
  `aria-label` değeri olarak da çalıştığını doğrulayın.

## 8. En iyi uygulamalar

- Kurulum örneklerini ve kullanım detaylarını dokümante ettiğiniz paket
  davranışıyla uyumlu tutun.
- Deploy öncesi `/`, `/tr/` ve `/zh/` sayfalarını test edin.
- Eklenti güncellendiğinde cache temizliği, docs build ve smoke testleri
  birlikte çalıştırın.

Bu listeyi takip ederek etkileşimli Mermaid diyagramlarını dayanıklı,
performanslı ve arama motorlarıyla uyumlu tutabilirsiniz.
