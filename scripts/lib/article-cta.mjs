const copy = {
  records: {
    path: '/funkce/domovni-kniha-online',
    cs: ['Evidence hostů bez zbytečného přepisování', 'Hosté doplní údaje přes online check-in. U pobytu je zkontrolujete a připravíte domovní knihu i PDF pro tisk.', 'Prohlédnout domovní knihu'],
    en: ['Guest records with less retyping', 'Guests enter their details through online check-in. Review them with the stay and prepare the guest register and a printable PDF.', 'Explore the guest register'],
    vi: ['Quản lý hồ sơ khách, giảm nhập lại dữ liệu', 'Khách điền thông tin qua check-in online. Kiểm tra dữ liệu theo kỳ lưu trú và tạo sổ khách cùng PDF để in.', 'Xem tính năng sổ khách']
  },
  imports: {
    path: '/funkce/import-rezervaci-z-emailu',
    cs: ['Méně ručního zakládání rezervací', 'Podívejte se, jak na sebe navazuje import termínů přes iCal, doplnění údajů z podporovaných e-mailů a práce s pobytem.', 'Prohlédnout import rezervací'],
    en: ['Spend less time entering reservations', 'See how iCal dates, details from supported reservation emails and stay management work together.', 'Explore reservation imports'],
    vi: ['Giảm thời gian nhập đặt phòng', 'Xem cách kết hợp ngày từ iCal, thông tin từ email đặt phòng được hỗ trợ và quản lý kỳ lưu trú.', 'Xem tính năng nhập đặt phòng']
  },
  messages: {
    path: '/funkce/automaticke-zpravy-hostum',
    cs: ['Nepište stejnou zprávu ke každému pobytu', 'Připravte šablonu a zvolte, kdy má odejít. Údaje konkrétní rezervace se doplní do zprávy.', 'Prohlédnout automatické zprávy'],
    en: ['Stop writing the same message for every stay', 'Prepare a template and choose when it should be sent. Reservation details fill in the message.', 'Explore automated messages'],
    vi: ['Không cần viết lại tin nhắn cho từng kỳ', 'Chuẩn bị mẫu và chọn thời điểm gửi. Thông tin của đặt phòng được điền vào tin nhắn.', 'Xem tin nhắn tự động']
  },
  sharing: {
    path: '/funkce/sdileny-kalendar',
    cs: ['Dejte týmu přehled, ne celý účet', 'Sdílejte webový kalendář odkazem a určete viditelné údaje. Pro sebe můžete použít odběr do kalendářové aplikace.', 'Prohlédnout sdílení kalendáře'],
    en: ['Give your team a view, not your whole account', 'Share a web calendar by link and choose which details are visible. Subscribe in your own calendar app when you need a personal view.', 'Explore calendar sharing'],
    vi: ['Cho nhóm xem lịch, không phải toàn bộ tài khoản', 'Chia sẻ lịch web bằng liên kết và chọn thông tin được hiển thị. Bạn có thể đăng ký lịch trong ứng dụng cá nhân.', 'Xem chia sẻ lịch']
  },
  general: {
    path: '/funkce',
    cs: ['Propojte rezervace s každodenním provozem', 'Podívejte se, jak v Superhostem navazují rezervace, online check-in, evidence hostů a další provozní kroky.', 'Prohlédnout funkce Superhostem'],
    en: ['Connect reservations with day-to-day operations', 'See how Superhostem connects reservations, online check-in, guest records and the next steps in your workflow.', 'Explore Superhostem features'],
    vi: ['Kết nối đặt phòng với vận hành hằng ngày', 'Xem cách Superhostem kết nối đặt phòng, check-in online, hồ sơ khách và các bước vận hành tiếp theo.', 'Xem tính năng Superhostem']
  }
};

const groups = {
  records: ['proc-vest-evidenci-hostu-a-pobytu', 'jak-vest-evidenci-hostu-a-pobytu-v-superhostem'],
  imports: ['co-je-ical', 'jak-funguje-napojeni-pres-ical', 'jak-funguje-email-forwarding', 'co-delat-kdyz-nefunguje-email-forwarding', 'co-delat-kdyz-chybi-rezervace', 'jak-pridat-rucni-rezervaci'],
  messages: ['jak-funguji-automatizace-v-superhostem', 'jak-nastavit-automaticke-emaily'],
  sharing: ['jak-sdilet-webovy-kalendar-odkazem', 'kalendar-airbnb-v-telefonu', 'co-delat-kdyz-se-kalendar-nenacita']
};
const labels = { cs: 'Superhostem v praxi', en: 'Superhostem in practice', vi: 'Superhostem trong thực tế' };
const escape = text => text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');

export function renderArticleCta(slug, locale) {
  const group = Object.keys(groups).find(key => groups[key].includes(slug)) || 'general';
  const [title, description, button] = copy[group][locale];
  return `<aside class="kb-product-cta" data-product-cta="${group}" aria-labelledby="kb-product-cta-title">
  <p class="kb-product-cta-kicker">${labels[locale]}</p>
  <h2 id="kb-product-cta-title">${escape(title)}</h2>
  <p class="kb-product-cta-description">${escape(description)}</p>
  <a class="kb-product-cta-button" href="https://www.superhostem.cz${copy[group].path}">${escape(button)}<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></a>
</aside>`;
}

export function updateArticleCta(html, slug, locale) {
  html = html.replace(/\s*<aside class="kb-product-cta"[\s\S]*?<\/aside>/g, '');
  const cta = renderArticleCta(slug, locale);
  // Readers of the legal reference should see the practical route before the long explanation.
  const marker = slug === 'proc-vest-evidenci-hostu-a-pobytu'
    ? /\s*(<div class="kb-article-divider">)/
    : /\s*(<section class="kb-article-related")/;
  if (!marker.test(html)) throw new Error(`Missing CTA insertion point: ${locale}/${slug}`);
  return html.replace(marker, (_, opening) => `\n${cta}\n${opening}`);
}
