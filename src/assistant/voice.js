/**
 * What the guide says while it works.
 *
 * A bare spinner makes people wonder whether anything is happening. A person
 * showing you around would talk while they do it — "hold on, let me open
 * that" — so the wait bubble speaks, and its line follows what the guide is
 * actually doing right now. None of it is technical: no "loading", no
 * "scrolling", no "fetching".
 *
 * Lines exist for Vietnamese (casual mình/bạn, formal em/anh-chị) and English.
 * Any other language falls back to English here; the model's own lines (its
 * `say` and `note` fields) are written in the visitor's language regardless.
 */

const pick = (list, seed = Math.random()) => list[Math.floor(seed * list.length) % list.length];

const LINES = {
  'vi-casual': {
    ack: ['Đợi mình chút nhé…', 'Để mình xem nào…', 'Ok, mình xem liền…', 'Chờ mình xíu nha…'],
    thinking: [
      'Mình đang tìm đúng chỗ cho bạn…',
      'Sắp có rồi, đợi mình chút…',
      'Để mình gom lại cho gọn…',
      'Mình đang xem kỹ phần này…',
    ],
    long: ['Phần này hơi nhiều, mình tóm lại cho bạn nhé…', 'Gần xong rồi, đợi mình thêm chút…'],
    read: ['Để mình đọc lại phần đó cho chắc…', 'Mình xem lại chi tiết chút nhé…'],
    navigate: (t) => [`Mình đưa bạn tới ${t} nhé…`, `Đợi mình kéo xuống ${t}…`],
    show_system: (t) => [`Để mình mở ${t} cho bạn xem…`, `Mình mở ${t} nhé…`],
    open_experience: (t) => [`Để mình mở phần ${t}…`, `Mình mở kinh nghiệm ở ${t} cho bạn…`],
    point_at: () => ['Nhìn chỗ này nè…', 'Mình chỉ cho bạn chỗ này…'],
    play_demo: (t) => [`Mình bật demo ${t} cho bạn xem…`, `Đợi mình mở video ${t}…`],
    copy_contact: () => ['Để mình copy cho bạn…'],
    press: (t) => [`Mình bấm vào ${t} cho bạn nè…`, `Để mình mở ${t} nhé…`],
    move_chat: () => ['Để mình kéo hộp chat sang chỗ thoáng hơn cho bạn dễ nhìn…'],
    fill_contact: () => ['Để mình qua form liên hệ hướng dẫn và điền phụ bạn nhé…'],
    search_site: () => ['Để mình tìm trên toàn bộ hồ sơ…'],
    run_workflow: () => ['Để mình dẫn bạn đi một mạch luôn…'],
    render_view: () => ['Đợi mình xếp lại cho dễ nhìn…'],
    execute_code: () => ['Đang chạy tính toán riêng cho bạn…'],
    create_tool: (t) => [`Đang tạo công cụ ${t || 'mới'} cho bạn…`],
    run_custom_tool: (t) => [`Đang chạy công cụ ${t || 'này'}…`],
    // after an action the guide may act again or answer — promise neither
    after: ['Đó, bạn xem nhé…', 'Bạn nhìn thử chỗ đó nha…', 'Rồi, đợi mình chút…'],
    done: {
      navigate: (t) => `Đã đưa bạn tới ${t}`,
      show_system: (t) => `Đã mở ${t}`,
      open_experience: (t) => `Đã mở phần ${t}`,
      point_at: (t) => `Chỉ bạn xem ${t}`,
      play_demo: (t) => `Đang phát demo ${t}`,
      copy_contact: () => 'Đã copy cho bạn',
      press: (t) => `Đã bấm ${t}`,
      move_chat: () => 'Đã kéo hộp chat qua chỗ thoáng hơn',
      fill_contact: () => 'Đã hỗ trợ điền và giải thích ở form liên hệ',
      run_workflow: () => 'Đã đi xong các bước',
      render_view: () => 'Đã dựng bảng tổng hợp',
      execute_code: () => 'Đã chạy xong trong sandbox',
      create_tool: (t) => `Đã tạo công cụ ${t || 'mới'}`,
      run_custom_tool: (t) => `Đã chạy ${t || 'công cụ'}`,
    },
  },
  'vi-formal': {
    ack: ['Anh/chị đợi em chút ạ…', 'Để em xem ạ…', 'Dạ, em xem ngay ạ…'],
    thinking: ['Em đang tìm đúng phần cho anh/chị ạ…', 'Sắp xong rồi ạ, anh/chị đợi em chút…', 'Em đang xem kỹ phần này ạ…'],
    long: ['Phần này hơi nhiều, em tóm gọn lại ạ…', 'Gần xong rồi ạ…'],
    read: ['Để em xem lại chi tiết cho chắc ạ…'],
    navigate: (t) => [`Em đưa anh/chị tới ${t} ạ…`],
    show_system: (t) => [`Để em mở ${t} cho anh/chị xem ạ…`],
    open_experience: (t) => [`Để em mở phần ${t} ạ…`],
    point_at: () => ['Anh/chị xem chỗ này ạ…'],
    play_demo: (t) => [`Em bật demo ${t} cho anh/chị xem ạ…`],
    copy_contact: () => ['Để em copy giúp anh/chị ạ…'],
    press: (t) => [`Em bấm vào ${t} giúp anh/chị ạ…`],
    move_chat: () => ['Để em kéo hộp chat sang bên cho anh/chị dễ nhìn ạ…'],
    fill_contact: () => ['Để em dẫn anh/chị tới form liên hệ, hướng dẫn và điền nháp giúp ạ…'],
    search_site: () => ['Để em tìm lại toàn bộ hồ sơ ạ…'],
    run_workflow: () => ['Để em dẫn anh/chị xem liền mạch ạ…'],
    render_view: () => ['Để em xếp bảng tóm tắt cho dễ xem ạ…'],
    execute_code: () => ['Em đang chạy tính toán riêng cho anh/chị ạ…'],
    create_tool: (t) => [`Em đang tạo công cụ ${t || 'mới'} giúp anh/chị ạ…`],
    run_custom_tool: (t) => [`Em đang chạy công cụ ${t || 'này'} ạ…`],
    after: ['Dạ, anh/chị xem chỗ đó ạ…', 'Anh/chị đợi em chút ạ…'],
    done: {
      navigate: (t) => `Đã đưa anh/chị tới ${t}`,
      show_system: (t) => `Đã mở ${t}`,
      open_experience: (t) => `Đã mở phần ${t}`,
      point_at: (t) => `Chỉ anh/chị xem ${t}`,
      play_demo: (t) => `Đang phát demo ${t}`,
      copy_contact: () => 'Đã copy giúp anh/chị',
      press: (t) => `Đã bấm ${t}`,
      move_chat: () => 'Đã kéo hộp chat sang chỗ thoáng hơn',
      fill_contact: () => 'Đã hỗ trợ điền và giải thích ở form liên hệ',
      run_workflow: () => 'Đã thực hiện xong các bước',
      render_view: () => 'Đã dựng bảng tổng hợp',
      execute_code: () => 'Đã chạy xong trong sandbox',
      create_tool: (t) => `Đã tạo công cụ ${t || 'mới'}`,
      run_custom_tool: (t) => `Đã chạy ${t || 'công cụ'}`,
    },
  },
  en: {
    ack: ['One sec…', 'Let me check…', 'Give me a moment…', 'On it…'],
    thinking: ['Finding the right spot for you…', 'Almost there…', 'Pulling it together…', 'Taking a closer look…'],
    long: ['There is a lot here — keeping it short for you…', 'Nearly done, bear with me…'],
    read: ['Let me double-check the details…', 'Reading that part properly…'],
    navigate: (t) => [`Taking you to ${t}…`, `Heading down to ${t}…`],
    show_system: (t) => [`Let me open ${t} for you…`, `Opening ${t}…`],
    open_experience: (t) => [`Let me open the ${t} role…`],
    point_at: () => ['Look here…', 'Let me point this out…'],
    play_demo: (t) => [`Starting the ${t} demo…`],
    copy_contact: () => ['Copying that for you…'],
    press: (t) => [`Clicking ${t} for you…`, `Opening ${t}…`],
    move_chat: () => ['Moving the chat box out of your way…'],
    fill_contact: () => ['Guiding you through the contact form…'],
    search_site: () => ['Searching across the full CV and portfolio…'],
    run_workflow: () => ['Walking through those steps…'],
    render_view: () => ['Putting together a clean view…'],
    execute_code: () => ['Running that in the isolated sandbox…'],
    create_tool: (t) => [`Building ${t || 'a custom tool'} for you…`],
    run_custom_tool: (t) => [`Running ${t || 'the custom tool'}…`],
    after: ['There you go…', 'Have a look at that…', 'One more moment…'],
    done: {
      navigate: (t) => `Took you to ${t}`,
      show_system: (t) => `Opened ${t}`,
      open_experience: (t) => `Opened ${t}`,
      point_at: (t) => `Pointed out ${t}`,
      play_demo: (t) => `Playing the ${t} demo`,
      copy_contact: () => 'Copied for you',
      press: (t) => `Pressed ${t}`,
      move_chat: () => 'Moved chat aside',
      fill_contact: () => 'Guided contact form',
      run_workflow: () => 'Completed workflow',
      render_view: () => 'Rendered structured view',
      execute_code: () => 'Executed in sandbox',
      create_tool: (t) => `Created tool ${t || ''}`.trim(),
      run_custom_tool: (t) => `Ran ${t || 'custom tool'}`,
    },
  },
};

const PLACES_VI = {
  top: 'đầu trang',
  about: 'phần giới thiệu',
  work: 'các dự án',
  experience: 'kinh nghiệm',
  capabilities: 'kỹ năng',
  education: 'học vấn',
  contact: 'phần liên hệ',
};
// Landmarks by the words a person would use, so a step never reads "system-points".
Object.assign(PLACES_VI, {
  hero: 'phần mở đầu',
  stats: 'mấy con số chính',
  profile: 'phần giới thiệu',
  'work-tabs': 'danh sách dự án',
  'system-summary': 'phần mô tả',
  'system-points': 'mấy điểm chính',
  'system-stack': 'công nghệ dùng',
  'system-media': 'ảnh chụp màn hình',
  'system-demo': 'video demo',
  'system-shots': 'ảnh chụp màn hình',
  'experience-list': 'các công việc',
  'open-role': 'công việc này',
  method: 'cách Khang triển khai',
  degree: 'bằng cấp',
  credentials: 'thành tích',
  'contact-form': 'biểu mẫu liên hệ',
  'contact-name': 'ô họ tên',
  'contact-email-input': 'ô email',
  'contact-topic': 'chủ đề liên hệ',
  'contact-company': 'công ty hoặc dự án',
  'contact-message': 'nội dung trao đổi',
  'contact-submit': 'nút gửi',
  'contact-email': 'email',
  'contact-phone': 'số điện thoại',
  'contact-linkedin': 'LinkedIn',
  'contact-github': 'GitHub',
  'odoo-listing': 'trang Odoo Apps Store',
});

const PLACES_EN = {
  top: 'the top',
  about: 'the profile',
  work: 'the projects',
  experience: 'experience',
  capabilities: 'the skills',
  education: 'education',
  contact: 'contact',
};

/** Which line set fits this visitor. */
export function voiceFor(style) {
  if (style?.lang === 'vi') return style.register === 'formal' ? 'vi-formal' : 'vi-casual';
  return 'en';
}

/** A human name for what a call is about. */
function subject(voice, name, args, names) {
  if (args?.system) return names.system(args.system);
  if (args?.company) return names.company(args.company);
  if (args?.name) return args.name;
  if (args?.purpose) return args.purpose;
  const place = args?.to || args?.target;
  if (!place) return '';
  const table = voice === 'en' ? PLACES_EN : PLACES_VI;
  return table[place] || names.landmark(place);
}

/** Line for the wait bubble when a turn starts. */
export const ackLine = (voice) => pick(LINES[voice].ack);

/** Line for the wait bubble after `ms` of silence. */
export function thinkingLine(voice, ms) {
  return pick(ms > 9000 ? LINES[voice].long : LINES[voice].thinking);
}

/** Line for the wait bubble as a call starts. */
export function actionLine(voice, name, args, names) {
  const set = LINES[voice];
  if (name === 'read_page') return pick(set.read);
  const make = set[name];
  if (typeof make !== 'function') return pick(set.thinking);
  return pick(make(subject(voice, name, args, names) || ''));
}


/** Line after the page has moved, while the explanation is being put together. */
export const afterLine = (voice) => pick(LINES[voice].after);

/** Fallback text for a finished step when the model gave none. */
export function doneLine(voice, name, args, names) {
  const make = LINES[voice].done[name];
  return make ? make(subject(voice, name, args, names)) : '';
}
