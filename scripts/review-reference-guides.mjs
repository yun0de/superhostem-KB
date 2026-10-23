import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.join(root, 'knowledge base/html');
const notes = {
  'co-je-ical': [
    ['Import nebo export?', 'Pro načtení termínů do Superhostem použijte <a href="./jak-funguje-napojeni-pres-ical.html">napojení iCal</a>. Pro zobrazení rezervací v osobním kalendáři použijte <a href="./kalendar-airbnb-v-telefonu.html">odběr v kalendářové aplikaci</a>. Tyto dva směry nejsou stejná operace.'],
    ['Import or export?', 'Use <a href="./jak-funguje-napojeni-pres-ical.html">iCal connection</a> to load dates into Superhostem. Use <a href="./kalendar-airbnb-v-telefonu.html">calendar app subscriptions</a> to display Superhostem stays in a personal calendar. These are different directions.'],
    ['Nhập hay xuất?', 'Dùng <a href="./jak-funguje-napojeni-pres-ical.html">kết nối iCal</a> để nhập ngày vào Superhostem. Dùng <a href="./kalendar-airbnb-v-telefonu.html">đăng ký lịch trong ứng dụng</a> để xem kỳ lưu trú trong lịch cá nhân. Đây là hai hướng khác nhau.']
  ],
  'jak-funguje-napojeni-pres-ical': [
    ['Kontrola po importu', 'Porovnejte konkrétní termín se zdrojovým portálem a správnou nemovitostí. Další podporované zdroje vybírejte podle aktuální nabídky aplikace. Při problému použijte <a href="./co-delat-kdyz-chybi-rezervace.html">diagnostiku chybějící rezervace</a>; nevytvářejte bez kontroly duplicitní pobyt.'],
    ['Check after importing', 'Compare a specific date range with the source platform and correct property. Choose other supported sources from the current app options. For problems, use <a href="./co-delat-kdyz-chybi-rezervace.html">missing reservation checks</a> before creating a duplicate stay.'],
    ['Kiểm tra sau nhập', 'So sánh một khoảng ngày với nền tảng nguồn và đúng chỗ ở. Chọn nguồn khác được hỗ trợ theo lựa chọn hiện tại của ứng dụng. Nếu lỗi, xem <a href="./co-delat-kdyz-chybi-rezervace.html">kiểm tra thiếu đặt phòng</a> trước khi tạo kỳ trùng.']
  ],
  'jaky-je-rozdil-mezi-rezervaci-a-blokaci-terminu': [
    ['Před vytvořením druhého pobytu', 'Zkontrolujte zdroj události, nemovitost, termín a existující detail rezervace. Zrcadlený termín z druhé platformy nemusí znamenat dalšího hosta. Chybějící cenu nebo údaje nejprve doplňte ke správnému pobytu.'],
    ['Before creating another stay', 'Check the event source, property, dates and existing reservation detail. A mirrored date range from another platform does not necessarily mean another guest. Add missing price or details to the correct stay first.'],
    ['Trước khi tạo kỳ thứ hai', 'Kiểm tra nguồn sự kiện, chỗ ở, ngày và chi tiết đặt phòng hiện có. Ngày phản chiếu từ nền tảng khác không nhất thiết là khách khác. Bổ sung giá hoặc thông tin vào đúng kỳ trước.']
  ],
  'jak-se-zaregistrovat-do-ubyportu': [
    ['Máte přístupy? Ověřte skutečné hlášení', 'Existující platné přístupy webových služeb při přechodu z jiného systému použijte dál. Nevytvářejte zbytečně druhou registraci. Po nastavení postupujte podle <a href="./jak-odeslat-hosty-do-ubyportu.html">odeslání hostů a kontroly výsledku</a>. Aktuální formulář a způsoby podání ověřte přímo na <a href="https://ubyport.pcr.cz/UbyPort/Home/" target="_blank" rel="noreferrer">portálu Ubyport</a>.'],
    ['Have credentials? Check an actual report', 'Reuse valid web-services credentials when moving from another system; avoid unnecessary duplicate registration. Continue with <a href="./jak-odeslat-hosty-do-ubyportu.html">guest submission and result checks</a>. Verify the current form and filing options directly on the <a href="https://ubyport.pcr.cz/UbyPort/Home/" target="_blank" rel="noreferrer">Ubyport portal</a>.'],
    ['Đã có tài khoản? Kiểm tra báo cáo thực tế', 'Dùng tiếp tài khoản dịch vụ web còn hợp lệ khi chuyển hệ thống, tránh đăng ký trùng. Tiếp tục <a href="./jak-odeslat-hosty-do-ubyportu.html">gửi khách và kiểm tra kết quả</a>. Kiểm tra biểu mẫu và cách nộp hiện tại tại <a href="https://ubyport.pcr.cz/UbyPort/Home/" target="_blank" rel="noreferrer">cổng Ubyport</a>.']
  ],
  'proc-vest-evidenci-hostu-a-pobytu': [
    ['Kde připravit provozní evidenci', 'Pro sběr údajů a PDF přehled pokračujte <a href="./jak-vest-evidenci-hostu-a-pobytu-v-superhostem.html">praktickým postupem evidence</a>. Pravidla místního poplatku a jeho evidence ověřte také v <a href="https://portal.gov.cz/sluzby-vs/poplatek-z-pobytu-S1005" target="_blank" rel="noreferrer">oficiálních informacích gov.cz</a>.'],
    ['Prepare operational records', 'For collection and PDF records, use the <a href="./jak-vest-evidenci-hostu-a-pobytu-v-superhostem.html">practical recordkeeping guide</a>. Also verify local-fee record rules in the <a href="https://portal.gov.cz/sluzby-vs/poplatek-z-pobytu-S1005" target="_blank" rel="noreferrer">official gov.cz information</a>.'],
    ['Chuẩn bị hồ sơ vận hành', 'Để thu thập dữ liệu và tạo PDF, dùng <a href="./jak-vest-evidenci-hostu-a-pobytu-v-superhostem.html">hướng dẫn hồ sơ thực tế</a>. Kiểm tra quy định hồ sơ phí địa phương tại <a href="https://portal.gov.cz/sluzby-vs/poplatek-z-pobytu-S1005" target="_blank" rel="noreferrer">thông tin chính thức gov.cz</a>.']
  ],
  'zakladni-legislativni-povinnosti-hostitele-v-cr': [
    ['Oddělte registraci, evidenci a odeslání', 'Registrace zařízení v Ubyportu není totéž co hlášení jednotlivých hostů. U obce je ohlášení, příprava podkladů a odvod poplatku také samostatný krok. Po nastavení ověřte jeden skutečný pobyt podle <a href="./jak-poslat-online-check-in.html">návodu check-inu</a> a <a href="./jak-odeslat-hosty-do-ubyportu.html">kontroly Ubyportu</a>.'],
    ['Separate registration, records and reporting', 'Registering a property in Ubyport does not submit individual guests. Municipality notification, preparing documents and remitting fees are also separate steps. After setup, verify a real stay with the <a href="./jak-poslat-online-check-in.html">check-in guide</a> and <a href="./jak-odeslat-hosty-do-ubyportu.html">Ubyport result checks</a>.'],
    ['Tách đăng ký, hồ sơ và báo cáo', 'Đăng ký cơ sở Ubyport không gửi từng khách. Thông báo địa phương, chuẩn bị hồ sơ và nộp phí cũng là các bước riêng. Sau thiết lập, kiểm tra một kỳ thật theo <a href="./jak-poslat-online-check-in.html">hướng dẫn check-in</a> và <a href="./jak-odeslat-hosty-do-ubyportu.html">kết quả Ubyport</a>.']
  ]
};

for (const [slug, versions] of Object.entries(notes)) {
  ['', 'en', 'vn'].forEach((locale, i) => {
    const file = path.join(base, locale, slug + '.html');
    let html = fs.readFileSync(file, 'utf8');
    const [title, text] = versions[i];
    const note = `<section id="reviewed-workflow"><h2>${title}</h2><p>${text}</p></section>`;
    if (html.includes('id="reviewed-workflow"')) {
      html = html.replace(/<section id="reviewed-workflow">[\s\S]*?<\/section>/, note);
    } else {
      const marker = /\s*<\/div>\s*<section class="kb-article-related"/;
      if (!marker.test(html)) throw new Error(`Missing prose boundary: ${file}`);
      html = html.replace(marker, match => `\n${note}\n${match}`);
    }
    if (slug === 'jak-funguje-napojeni-pres-ical') {
      html = html.replace('Zkopírujte celý odkaz končící na <b>.ics</b>.', 'Zkopírujte celý exportní odkaz včetně případných parametrů za otazníkem.');
      html = html.replace('Copy the full link ending in <b>.ics</b>.', 'Copy the complete export URL, including any query parameters.');
      html = html.replace('Sao chép toàn bộ liên kết kết thúc bằng <b>.ics</b>.', 'Sao chép toàn bộ URL xuất, gồm cả tham số sau dấu hỏi nếu có.');
    }
    fs.writeFileSync(file, html);
  });
}
console.log(`Updated ${Object.keys(notes).length * 3} reference pages.`);
