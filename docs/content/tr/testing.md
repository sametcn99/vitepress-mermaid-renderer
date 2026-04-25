# Test Rehberi

Bu proje, VitePress Mermaid Renderer eklentisi için regresyon güvenliği sağlayan
katmanlı testler içerir.

## Komutlar

| Komut                   | Açıklama                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| `bun run test`          | Vitest unit ve component testlerini headless çalıştırır.          |
| `bun run test:watch`    | Yerel geliştirme için Vitest’i watch modunda çalıştırır.          |
| `bun run test:coverage` | V8 coverage raporuyla Vitest çalıştırır.                          |
| `bun run test:e2e`      | Test projesini build eder ve Playwright smoke suite’i çalıştırır. |
| `bun run lint`          | Workspace genelinde ESLint çalıştırır.                            |
| `bun run build`         | Yayınlanabilir bundle ve `.d.ts` çıktıları üretir.                |

## Kaynak ve test eşlemesi

- `src/toolbar.ts` → `tests/toolbar.test.ts`
- `src/styleManager.ts` → `tests/styleManager.test.ts`
- `src/MermaidRenderer.ts` → `tests/MermaidRenderer.test.ts`
- `src/composables/useMermaidRenderer.ts` →
  `tests/composables/useMermaidRenderer.test.ts`
- `src/composables/useMermaidNavigation.ts` →
  `tests/composables/useMermaidNavigation.test.ts`
- `src/MermaidDiagram.vue` → `tests/components/MermaidDiagram.test.ts`
- `src/components/MermaidControls.vue` →
  `tests/components/MermaidControls.test.ts`
- `src/components/MermaidError.vue` → `tests/components/MermaidError.test.ts`

Entegre VitePress davranışı için uçtan uca testler `tests/e2e` altında bulunur.
Locale navigation ve toolbar testleri, Türkçe route’larda çevirilerin
uygulandığını doğrular.

## Regresyon protokolü

1. Hata önce bir unit test ile yeniden üretilmelidir.
2. Düzeltme ilgili source dosyasında yapılmalıdır.
3. Hedef testten sonra `bun run test` çalıştırılmalıdır.
4. Etkilenen modül için coverage çıktısı kontrol edilmelidir.
5. Playwright smoke suite ile VitePress entegrasyonu doğrulanmalıdır.
6. Değişiklik merge edilebilir hale gelmeden önce lint ve build başarılı
   olmalıdır.

## Yeni test notları

- Gerçek renderer’ı yüklememek için `mermaid` paketini `vi.hoisted` ve `vi.mock`
  ile mocklayın.
- Singleton modüller için `vi.resetModules()` sonrası dynamic import kullanın.
- Composable iç durumlarını göstermek için `@vue/test-utils` `mount` ve host
  wrapper bileşenleri kullanın.
- Playwright specs içinde toolbar selector’larını `.desktop-controls` ile
  sınırlandırarak strict-mode çakışmalarından kaçının.
