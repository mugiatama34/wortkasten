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
  Backend, hesap sistemi yok. API çağrıları (Anthropic, GitHub) doğrudan
  tarayıcıdan yapılır, aradan geçen kendi sunucumuz yok.
- **Veri cihazda kalır.** `localStorage`. İlerleme (`ILERLEME`, tekrar
  geçmişi) hiçbir zaman cihaz dışına çıkmaz, cihazlar arası senkronu
  yok. Tek istisna: GitHub token girilmişse yeni eklenen kelimeler
  (sadece kelime verisi, ilerleme değil) repodaki `kelimeler.json`
  dosyasına yazılır — bkz. "GitHub kelime senkronu".

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

1. `index.html` veya `sw.js` değiştiyse `sw.js` içindeki `SURUM` sabitini
   **ve** `index.html` başındaki `SURUM` sabitini birlikte, aynı değere
   artır (`wortkasten-v1` → `wortkasten-v2`). İkisi eşleşmezse Ayarlar
   ekranındaki sürüm yazısı yanlış değer gösterir. Sürümü artırmazsan
   kullanıcının telefonu eski sürümü cache'ten servis etmeye devam eder.
2. Yerel test: klasörde `python3 -m http.server`, sonra `localhost:8000`.
   `file://` ile açma — `kelimeler.json` yüklenmez.
3. Yeni bir alan eklediysen `README.md` içindeki veri modeli tablosunu
   ve bu dosyayı da güncelle.

## Yapay zekâ entegrasyonu

Kelime ekleme panelindeki "Cümle öner" düğmesi, girilen Almanca kelime,
tür ve Türkçe karşılığını Anthropic'in Messages API'sine gönderip örnek
cümle ve çevirisini önerir. Kullanıcı öneriyi kaydetmeden önce
düzenleyebilir — otomatik kaydetme yok.

- **Model adı** `index.html` başındaki `AI_MODEL` sabitinde tanımlı.
  Değiştirmek için sadece o sabiti güncelle.
- **API çağrısı doğrudan tarayıcıdan** `https://api.anthropic.com/v1/messages`
  adresine `fetch` ile yapılır. SDK veya kütüphane yok. İstek
  `anthropic-dangerous-direct-browser-access: true` başlığını taşımak
  zorunda, yoksa CORS hatası alınır.
- **Anahtar yönetimi:** Ayarlar panelindeki anahtar `localStorage`'da
  ayrı bir anahtarda (`wortkasten:apiAnahtar`) tutulur. `kelimeler.json`
  dosyasına ya da repodaki başka bir dosyaya asla yazılmaz, yedek
  dışa aktarımına (Menü > Yedekle ve aktar) da dahil edilmez. API
  anahtarı girilmemişse "Cümle öner" düğmesi arayüzde görünmez.
- `sw.js`, `api.anthropic.com` isteklerini önbelleğe almadan doğrudan
  ağa geçirir — bu istekleri cache mantığına dahil etme.

Bu, tamamen otomatik kart üretiminden farklı: model sadece tek bir
alan çifti (`cumle`, `cumle_tr`) için öneri üretir, kullanıcı onaylayıp
kaydetmeden hiçbir şey kalıcı olmaz.

### Fotoğraftan kelime çıkarma

Menüdeki "Fotoğraftan ekle" girişi, kamera ya da galeriden seçilen bir
sayfa fotoğrafındaki Almanca kelimeleri görsel destekleyen bir modelle
çıkarır ve onay ekranında listeler. Bu da "Cümle öner" gibi öneri
niteliğinde — kullanıcı onaylayıp "Seçilenleri ekle"ye basmadan hiçbir
kelime kaydedilmez.

- **Görüntü hazırlama:** Gönderilmeden önce canvas ile küçültülür — uzun
  kenar en fazla 1500px, JPEG kalite 0,8. Bu adım hem isteği hem
  maliyeti küçük tutar, telefon fotoğrafları boyut sınırına takılmasın
  diye eklendi.
- **Model adı** `index.html` başındaki `AI_GORSEL_MODEL` sabitinde,
  varsayılan `claude-sonnet-5`. `AI_MODEL` (cümle önerisi için) ayrı
  kalır — görsel anlama gerektirmeyen istekler için daha ucuz/hızlı
  modeli kullanmaya devam eder.
- **İstek formatı:** tek mesajda önce `image` bloğu (`source.type`
  `"base64"`, `media_type` `"image/jpeg"`), sonra `text` bloğu. Model
  mevcut kelime listesindeki Almanca temel biçimleri de istem içinde
  görür ve bunları tekrar çıkarmaması söylenir.
- **Yanıt** sadece bir JSON dizisi olmalı; ayrıştırma mevcut
  `jsonAyikla` mantığının dizi hali (`diziAyikla`) ile ilk `[` ile son
  `]` arasını alır, ham metni hata mesajına ekler — cümle önerisiyle
  aynı dayanıklılık yaklaşımı.
- **Onay ekranı:** her aday kelime düzenlenebilir alanlarla (tür,
  artikel, Almanca, çoğul/formlar, Türkçe, cümle, cümle çevirisi) ve
  bir onay kutusuyla gösterilir — OCR ve model tahmini hata yapabilir.
  Mevcut listede zaten olan kelimeler (artikelsiz, küçük harfe
  indirgenerek karşılaştırılır) işaretlenir ve varsayılan olarak
  işaretsiz gelir. "Seçilenleri ekle" işaretli kelimeleri mevcut kelime
  ekleme akışına sokar — GitHub senkronu dahil.
- Modelin ürettiği `seviye` alanı (CEFR tahmini) sadece onay ekranında
  gösterilir, A1/A2 kelimelerin ayıklanmasına yardımcı olur; kaydedilen
  kelime nesnesine dahil edilmez, veri modelinde yeni bir alan değildir.
- `sw.js`, görsel çıkarma isteklerini de aynı `api.anthropic.com`
  isteği olarak cache'lemeden ağa geçirir — ayrı bir kural gerekmez.

## GitHub kelime senkronu

Ayarlar panelindeki GitHub token girilmişse, kelime ekleme panelinden
kaydedilen her yeni kelime arka planda GitHub Contents API üzerinden
repodaki `kelimeler.json` dosyasına da yazılır. Bu, ilerleme/tekrar
verisini değil, sadece yeni eklenen kelimeleri kapsar — "Veri cihazda
kalır" kısıtına bu yönüyle istisnadır, kullanıcının açık isteğiyle
eklendi.

- **Repo sahibi/adı** `index.html` başındaki `GITHUB_SAHIP` ve
  `GITHUB_REPO` sabitlerinde tanımlı.
- **Akış:** kelime önce `localStorage`'a (`OZEL`) kaydedilir ve
  arayüzde hemen görünür. Token varsa aynı kelime `BEKLEYEN`
  listesine de eklenir ve `senkronEt()` arka planda tetiklenir —
  kullanıcı beklemez. `senkronEt()`, Contents API'den güncel `sha`'yı
  okuyup kelimeyi ekler ve `PUT` ile geri yazar; 409 çakışmasında
  `sha`'yı bir kez daha okuyup tekrar dener. Başarılı olursa kelime
  `BEKLEYEN`'den çıkar (`OZEL`'de kalır — manuel yedekleme için).
  Başarısız olursa kelime `BEKLEYEN`'de kalır ve bir sonraki kelime
  eklendiğinde birlikte tekrar denenir.
- **Base64/UTF-8:** `btoa`/`atob` Almanca/Türkçe karakterlerde
  (ä ö ü ß ğ ş ı) doğrudan çalışmaz. `utf8ToBase64()` /
  `base64ToUtf8()` yardımcıları `TextEncoder`/`TextDecoder` ile bunu
  çözer — bu ikisini bypass edip doğrudan `btoa`/`atob` kullanma.
- **Token yönetimi:** Ayarlar panelindeki token `localStorage`'da ayrı
  bir anahtarda (`wortkasten:ghToken`) tutulur. API anahtarı gibi
  repoya ya da yedek dışa aktarımına asla dahil edilmez. Token
  girilmemişse bu akış hiç çalışmaz, mevcut manuel kopyalama yöntemi
  (Menü > Yedekle ve aktar) geçerli kalır.
- `sw.js`, `api.github.com` isteklerini de `api.anthropic.com` gibi
  önbelleğe almadan doğrudan ağa geçirir.

## Kapsam dışı bırakılanlar

Bunlar unutulduğu için değil, bilinçli olarak yok. Talep gelmeden ekleme:

- Sesli okuma / telaffuz
- İlerleme/tekrar geçmişinin cihazlar arası senkronu (kelime verisinin
  GitHub'a yazılması hariç — bkz. "GitHub kelime senkronu")
- Yapay zekâ ile tamamen otomatik kart üretimi (kelime, artikel, çoğul
  gibi tüm alanların modelden gelmesi) — cümle önerisi kapsam dışı değil
- Hesap sistemi

## Dil

Kullanıcı arayüzü Türkçe. Yeni metin yazarken mevcut ton korunsun:
sade, kısa, emir kipi yerine düz anlatım. Almanca kelimeler ve örnek
cümleler doğal ve güncel Almanca olmalı.
