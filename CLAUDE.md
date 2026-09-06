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
  "grup": "Ünite 3",
  "cumle": "Das {{Werkzeug}} liegt auf dem Tisch.",
  "cumle_tr": "Alet masanın üstünde duruyor.",
  "etiket": ["teknik"]
}
```

- `tur`: `isim` · `fiil` · `sifat` · `diger`
- `artikel`, `cogul` sadece isimlerde; `formlar` sadece fiillerde
- `cumle` isteğe bağlı; `{{ }}` içindeki kelime boşluğa dönüşür
- `grup` isteğe bağlı, ünite/grup adı. Yoksa alan hiç yazılmaz — bkz.
  "Kelime grupları"

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

**Artikel renk bandı kalıcı bir özelliktir.** Türkçe → Almanca kartının
cevap yüzünde isimler `der` mavi, `die` kırmızı, `das` yeşil renkli
bir bantla (`.artikel-bant` + `.a-der`/`.a-die`/`.a-das`, `arkaTrDe()`
içinde üretiliyor) gösterilir. Bu, uygulamanın en önemli öğretme
aracı — artikeli kelimeyle birlikte görsel olarak ezberletiyor. Görünüm
çizimini (`kartCiz`, `arkaTrDe`, ilgili CSS) değiştirirken bu bandın
aynı sınıflarla üretilmeye devam ettiğini doğrula.

**Cümle kartında yazarak cevap modu.** Ayarlar'daki `AYAR.cumleYazarak`
(varsayılan kapalı) açıkken, sadece `cumle` yönündeki kartlarda boşluk
yerine bir metin girişi çıkar (`yaziGirisCiz()`); Almanca → Türkçe ve
Türkçe → Almanca kartlarını etkilemez. Gönderilen cevap
`karsilastirmaBicimi()` ile normalize edilip (küçük harf, `ä→ae`
`ö→oe` `ü→ue` `ß→ss`) kütüphanesiz `levenshtein()` fonksiyonuyla
karşılaştırılır — mesafe 0 tam doğru (dört puanlama düğmesi de çıkar),
mesafe 1 "neredeyse doğru" (otomatik "Zor"), fazlası "yanlış" (otomatik
"Tekrar"). Sonuç `yaziliSonuc` değişkeninde tutulur, `ciz()` yeni kartta
sıfırlar. Otomatik puanlanan durumlarda puanlama düğmeleri yerine tek bir
"Devam" düğmesi çıkar — bu ikisini karıştırma.

## Tekrar algoritması

`planla(durum, puan, simdi)` fonksiyonu tek giriş noktası. Öğrenme
merdiveni (1 dk → 10 dk → 1 saat) ve mezuniyet sonrası SM-2 mantığı
burada. Zamanlama davranışını değiştirmen gerekiyorsa sadece bu
fonksiyona dokun — çağıran taraflar saf kalsın.

Kolaylık faktörü 1,3 ile 3,0 arasında sınırlı. Kısa aralıklarda
yuvarlama yüzünden aralığın büyümeyip takılması daha önce yaşanmış bir
hataydı; "Zor" dalında `Math.max(aralik + 1, ...)` bunun için var,
kaldırma.

## Kelime grupları (üniteler)

Kelime kaydındaki isteğe bağlı `grup` alanı serbest metin — ünite adı gibi
düşün. Grubu olmayan kelimeler arayüzde "Grupsuz" görünür, ama JSON'a boş
`grup` alanı yazılmaz; alan ya vardır ya da hiç yoktur (`formdanKelimeOku()`
ve `fotoEkleBtn` akışı bunu böyle üretir).

**Grup adı önerileri.** Kelime ekleme formunda ve fotoğraftan ekleme
akışında `grup` alanı bir `<datalist>`'e bağlı; `grupOnerileriDoldur()`
mevcut kelimelerdeki tüm grup adlarını toplayıp öneri listesine koyar. Yeni
bir ad da serbestçe yazılabilir.

**Fotoğraftan eklerken tek grup soru.** Fotoğraf seçildikten hemen sonra,
işlemeye başlamadan önce (`fotoDosya` `onchange`) grup adı sorulur —
`fotoGrupSor` bloğu görünür olur, dosya `fotoSeciliDosya`'da bekler. "Devam"
(`fotoGrupDevam` → `fotoIslemeBasla()`) tıklanınca girilen ad
`fotoPartiGrubu`'na yazılır ve o andan itibaren asıl API isteği başlar. O
partide çıkan, kullanıcının onayladığı tüm kelimelere aynı `fotoPartiGrubu`
uygulanır — onay ekranında kelime başına ayrı bir grup alanı yok, bilinçli
olarak: amaç bir sayfayı tek ünite olarak eklemek.

**Kelime listesi ekranı.** Arama kutusunun yanındaki `lGrupFiltre`
açılır menüsü her grubu (ve "Grupsuz"u) içerdiği kelime sayısıyla listeler
(`lGrupFiltreDoldur()`), seçim `listeCiz()`'i filtreler. Kalıcı değil,
panel her açıldığında yeniden kurulur.

**Çalışma ekranı — "Gruba göre çalış".** `GRUP_FILTRESI` değişkeni
çalışma kuyruğunu daraltan tek durum: `null` tüm kelimeler, `''` sadece
grubu olmayanlar, aksi halde bir grup adı. **Bilinçli olarak
`localStorage`'a yazılmaz** — uygulama her açıldığında `null`'a döner,
grup çalışması kalıcı bir mod değil geçici bir odaklanmadır (bkz. görev
tanımı). `kuyrukKur()` içinde `kartlar()` sonucu `kartGrupUyumluMu()` ile
filtrelenir; bu filtre **sadece hangi kartların uygun olduğunu belirler,
zamanlamayı değiştirmez** — `planla()`'nın ürettiği `sonraki` zaman damgası
aynen kullanılır, vakti gelmemiş kartlar öne çekilmez. `enYakinTarih()` ve
`bosEkran()` de aynı filtreyle çalışıp "bu grupta vakti gelmiş kart yok,
sıradaki tekrar: ..." mesajını üretir.

Tek istisna, günlük yeni kelime kotası (`AYAR.yeniLimit`, `K_YENISECIM`):
bu kota grup filtresi aktifken hiç uygulanmaz, o gruptaki tüm yeni
kelimeler doğrudan kuyruğa girer. Bunun iki nedeni var: kota günün
başında rastgele seçildiği için grup filtresiyle birlikte hesaplanırsa
günün geri kalanında kalıcı olarak o gruba daralmış olurdu; ayrıca fotoğraf
ile az önce eklenen bir ünitenin kelimeleri günün kotası zaten
doldurulmuşsa hiç görünmezdi — "gruba göre çalış" tam olarak bunu önlemek
için var. Bu, `planla()`'nın ürettiği aralık/zamanlama mantığına dokunmaz,
sadece hangi yeni kartların günün kotasından muaf tutulacağına dair.

## Oyunlar

Menüdeki "Oyunlar" girişi, iki API gerektirmeyen mini oyun sunar: **Artikel
Turu** (isimlerin artikelini der/die/das düğmeleriyle tahmin etme) ve
**Cümle Dizme** (kayıtlı örnek cümlelerin kelimelerini doğru sıraya dizme).
Kod, "Paneller" bölümünde `OYUNLAR` tanımıyla başlar.

**Bilinçli olarak `ILERLEME`'ye hiç dokunmaz.** Oyunlar bir ölçme katmanı,
öğrenme motoru ayrı kalır — `planla()` hiç çağrılmaz, `wortkasten:ilerleme`
hiç yazılmaz. Bir oyunda yanlış yapmak o kelimenin tekrar zamanlamasını
değiştirmez.

**Kapsam seçimi kendi değişkeninde.** Oyun seçilince "Tüm kelimeler" ya da
bir grup sorulur; grup listesi `grupSayilari()`'nden, "gruba göre çalış"
ile aynı kaynaktan gelir. Seçim `GRUP_FILTRESI`'ni **değiştirmez** —
`OYUN_SECILI` ve kapsam parametresi sadece o oyun oturumu için kullanılır,
kalıcı değildir, çalışma kuyrusunu etkilemez.

**Yetersiz kelime kontrolü.** Her oyun tanımında `minKelime` ve
`uygunKelimeler()` (kapsamdaki hangi kelimelerin bu oyuna uygun olduğunu
belirleyen filtre) var. Seçilen kapsamda yeterli uygun kelime yoksa oyun
başlamaz, `gerekMetni` ile kaç kelime gerektiği açıkça söylenir.

- **Artikel Turu**: kapsamdaki `tur === 'isim'` ve artikeli olan kelimeler
  arasından en az 5 gerekir. Tur uzunluğu `min(20, uygun kelime sayısı)`.
  Doğru cevapta o artikelin `.artikel-bant` bandıyla (çalışma kartlarındaki
  aynı görsel dil) kısa bir geri bildirim, yanlışta doğru cevap aynı bantla
  gösterilip daha uzun bir duraklama olur — bu duraklamalar `oyunZamanlayici`
  ile yönetilir, panel `data-kapat` ile kapatılırken bu zamanlayıcı iptal
  edilir (aksi halde kapanmış panelin gizli DOM'una yazmaya devam eder).
  Süre `Date.now()` farkıyla tutulur, sonuçta gösterilir.
- **Cümle Dizme**: kapsamdaki `cumle` alanı `{{` içeren kelimelerden en az
  5 gerekir, 5 cümle oynatılır. `cumleTokenlari()` `{{ }}` işaretlemesini
  kaldırıp cümleyi boşluktan böler — noktalama işaretleri böylece kendinden
  önceki kelimeye yapışık kalır, ayrı bir parça olmaz. Karıştırılan sıranın
  orijinalle aynı çıkmaması için `do...while` ile tekrar karıştırılır. Yanlış
  cevapta doğru cümle tam haliyle gösterilir; kullanıcının o pozisyona
  koyduğu kelimeyle eşleşmeyen kelimeler `.oyun-fark` sınıfıyla vurgulanır
  (pozisyon bazlı karşılaştırma — `dogruSira[i] !== verilenTokenler[i]`).
  Kelimenin `cumle_tr` alanı varsa altında ayrıca gösterilir.

**Sonuç ekranı.** Her iki oyun da aynı `oyunSonucCiz()` fonksiyonunu
kullanır: doğru sayısı, (Artikel Turu'nda) süre, ve yanlış yapılan
kelimelerin tıklanabilir listesi. Bir satıra basmak `formuDoldur()` ile
düzenleme ekranını açar — normal kelime düzenleme akışının aynısı, GitHub
senkronu dahil.

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
