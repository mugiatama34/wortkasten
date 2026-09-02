# Wortkasten

Almanca kelime çalışma uygulaması. Türkçe konuşan bir kullanıcı için,
iPhone'da ana ekrana eklenip her sabah 5 dakika kullanılmak üzere yazıldı.

## Mimarî kısıtlar — bunları değiştirme

Bu kısıtlar bilinçli. Değiştirmek gerektiğini düşünüyorsan önce sor.

- **Derleme adımı yok.** npm, yarn, bundler, transpiler yok. `package.json`
  oluşturma.
- **Dış bağımlılık yok.** CDN'den kütüphane çekme, npm paketi ekleme.
  Framework yok — React, Vue, Svelte değil, sade JS.
- **Uygulamanın tamamı `index.html` içinde.** HTML, CSS ve JS aynı dosyada.
  Ayrı `.css` veya `.js` dosyasına bölme. Tek istisna `sw.js`, o ayrı
  olmak zorunda.
- **Sunucu yok.** Statik dosyalar GitHub Pages'ten servis ediliyor.
  Backend, API çağrısı, hesap sistemi yok.
- **Veri cihazda kalır.** `localStorage`. Bulut senkronu yok.

Sebep: kullanıcı çoğunlukla telefondan ve GitHub'ın web arayüzünden
çalışıyor. Derleme adımı eklersen projeyi kendi cihazından bakım
yapamaz hale getirmiş olursun.

## Dosyalar

| Dosya | İçerik |
|---|---|
| `index.html` | Uygulamanın tamamı |
| `kelimeler.json` | Kelime listesi — asıl veri kaynağı |
| `sw.js` | Service worker, çevrimdışı çalışma |
| `manifest.json` | PWA tanımı |
| `icon-*.png` | Ana ekran ikonları |

## Veri modeli

`kelimeler.json` içindeki her kayıt:

```json
{
  "id": "w025",
  "tur": "isim",
  "de": "Werkzeug",
  "artikel": "das",
  "cogul": "Werkzeuge",
  "tr": "alet, takım",
  "cumle": "Das {{Werkzeug}} liegt auf dem Tisch.",
  "cumle_tr": "Alet masanın üstünde duruyor.",
  "etiket": ["teknik"]
}
```

- `tur`: `isim` · `fiil` · `sifat` · `diger`
- `artikel`, `cogul` sadece isimlerde; `formlar` sadece fiillerde
- `cumle` isteğe bağlı; `{{ }}` içindeki kelime boşluğa dönüşür

**`id` alanları asla değiştirilmez.** Tekrar geçmişi `localStorage`'da
`<id>:de-tr` gibi anahtarlarla tutuluyor. Bir `id` değişirse o kelimenin
tüm öğrenme geçmişi sıfırlanır. Aynı sebeple kart yön adları
(`de-tr`, `tr-de`, `cumle`) da sabit.

## Kod düzeni

`index.html` içindeki `<script>` bloğu şu sırayla bölümlenmiş:

1. Sabitler ve depolama anahtarları
2. Depolama yardımcıları
3. Kart üretimi — kelime başına 2 veya 3 kart
4. `planla()` — tekrar algoritması
5. Kuyruk kurma
6. Görünüm çizimi
7. Paneller (menü, kelime ekleme, istatistik, yedek, ayarlar)
8. `baslat()`

Yeni kod eklerken bu sıraya uy. Değişken ve fonksiyon adları Türkçe,
İngilizceye çevirme.

## Tekrar algoritması

`planla(durum, puan, simdi)` fonksiyonu tek giriş noktası. Öğrenme
merdiveni (1 dk → 10 dk → 1 saat) ve mezuniyet sonrası SM-2 mantığı
burada. Zamanlama davranışını değiştirmen gerekiyorsa sadece bu
fonksiyona dokun — çağıran taraflar saf kalsın.

Kolaylık faktörü 1,3 ile 3,0 arasında sınırlı. Kısa aralıklarda
yuvarlama yüzünden aralığın büyümeyip takılması daha önce yaşanmış bir
hataydı; "Zor" dalında `Math.max(aralik + 1, ...)` bunun için var,
kaldırma.

## Değişiklik sonrası kontrol listesi

1. `index.html` veya `sw.js` değiştiyse `sw.js` içindeki `SURUM`
   sabitini artır (`wortkasten-v1` → `wortkasten-v2`). Yoksa
   kullanıcının telefonu eski sürümü cache'ten servis etmeye devam eder.
2. Yerel test: klasörde `python3 -m http.server`, sonra `localhost:8000`.
   `file://` ile açma — `kelimeler.json` yüklenmez.
3. Yeni bir alan eklediysen `README.md` içindeki veri modeli tablosunu
   ve bu dosyayı da güncelle.

## Kapsam dışı bırakılanlar

Bunlar unutulduğu için değil, bilinçli olarak yok. Talep gelmeden ekleme:

- Sesli okuma / telaffuz
- Cihazlar arası senkron
- Yapay zekâ ile otomatik kart üretimi
- Hesap sistemi

## Dil

Kullanıcı arayüzü Türkçe. Yeni metin yazarken mevcut ton korunsun:
sade, kısa, emir kipi yerine düz anlatım. Almanca kelimeler ve örnek
cümleler doğal ve güncel Almanca olmalı.
