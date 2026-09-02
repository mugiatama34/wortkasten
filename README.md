# Wortkasten — Almanca kelime kartları

Tek dosyalık, derleme gerektirmeyen bir kelime çalışma uygulaması.
GitHub Pages'te barındırılır, iPhone'da ana ekrana eklenip uygulama gibi kullanılır.

## Dosyalar

| Dosya | Ne işe yarar |
|---|---|
| `index.html` | Uygulamanın tamamı — HTML, CSS, JS |
| `kelimeler.json` | Kelime listesi (asıl kaynak) |
| `manifest.json` | Ana ekran adı, ikon, tam ekran ayarı |
| `sw.js` | Çevrimdışı çalışma |
| `icon-*.png` | Ana ekran ikonları |

## Kurulum

1. Bu klasörü repoya koy (örn. `kelime/` alt dizini).
2. Repo ayarlarından Pages'i aç.
3. `https://<kullanıcı>.github.io/kelime/` adresini **Safari'de** aç.
4. Paylaş → Ana Ekrana Ekle.

Ana ekrandan açmak önemli: Safari sekmesinde tutulan veriler 7 gün
kullanılmazsa silinebiliyor, ana ekran uygulamasında ise daha kalıcı saklanıyor.

`file://` ile açarsan kelime listesi yüklenmez — tarayıcı yerel dosyadan
`fetch` yapmaya izin vermiyor. Bilgisayarda denemek için klasörde
`python3 -m http.server` çalıştırıp `localhost:8000` adresini kullan.

## Kelime ekleme — iki yol

**Uygulama içinden:** Menü → Kelime ekle. Hemen çalışmaya başlar, ama
sadece o cihazda durur. Menü → Yedekle ve aktar → "Eklenen kelimeleri
kopyala" ile `kelimeler.json` dosyasına taşıyabilirsin.

**Doğrudan `kelimeler.json` içine:** Telefondan GitHub web arayüzüyle de
düzenlenebilir. Kaydettiğin an yayına girer.

## Kelime formatı

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

- `id` benzersiz olmalı — ilerleme bu kimliğe bağlı. Bir kelimenin id'sini
  değiştirirsen o kelimenin geçmişi sıfırlanır.
- `tur`: `isim` · `fiil` · `sifat` · `diger`
- `artikel` ve `cogul` sadece isimlerde. Çoğulu olmayan kelimede `"—"` yaz.
- `formlar` sadece fiillerde: `"geht, ging, ist gegangen"`
- `cumle` isteğe bağlı. Yazarsan boşluk doldurma kartı da üretilir.
  Boşluğa dönüşecek kelimeyi `{{ }}` içine al — cümledeki çekimli hâliyle.

## Kart üretimi

Her kelime 2 kart üretir, örnek cümle varsa 3:

1. **Almanca → Türkçe** — tanıma
2. **Türkçe → Almanca** — üretim; isimlerde artikel de sorulur
3. **Cümledeki boşluk** — bağlam içinde kullanım

## Tekrar algoritması

İki katman:

**Öğrenme adımları** — yeni kart için sabit merdiven: 1 dk → 10 dk → 1 saat.
"Tekrar" dersen merdivenin başına döner.

**SM-2** — merdiveni bitiren kart mezun olur, aralık kolaylık faktörüyle
(başlangıç 2,5) çarpılarak büyür. Tipik seyir: 1 gün → 3 gün → 8 gün →
20 gün → 1,7 ay.

Kolaylık faktörü "Zor" ile 0,15 düşer, "Kolay" ile 0,15 artar; 1,3 ile 3,0
arasında tutulur. Mezun bir kartta "Tekrar" dersen aralık %60 kısalır ve kart
öğrenme merdivenine geri döner — sıfırdan başlamaz.

Tüm bu mantık `planla()` fonksiyonunda. Birkaç ay veri biriktikten sonra
FSRS'e geçmek istersen sadece bu fonksiyonu değiştirmen yeterli.

## Yedekleme

Tarayıcı depolaması kalıcı değil. Menü → Yedekle ve aktar → "Yedek dosyası
indir" hem eklediğin kelimeleri hem tekrar geçmişini tek JSON'a yazar.
Ayda bir al.

## Klavye kısayolları (masaüstü)

- `Boşluk` / `Enter` — cevabı göster
- `1` `2` `3` `4` — Tekrar / Zor / İyi / Kolay

## Ayarlar

Günlük yeni kelime sınırı varsayılan 10. Her kelime 2–3 kart demek, ve
bugün eklediğin kelimeler önümüzdeki haftalarda tekrar yükü olarak geri
gelir. Sınırı yükseltmeden önce Menü → İstatistik'ten mevcut yüke bak.
