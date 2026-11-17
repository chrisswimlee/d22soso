/* D22: The Living Archive — localisation.
   English is the source copy in content.js / index.html. This module holds the
   Korean (ko) and Simplified Chinese (zh) overlays plus every UI string, and
   merges them over deep clones of the English content so content.js stays the
   single source of truth for structure, links, and facts. */

export const LOCALES = [
  { code: "en", label: "EN", name: "English" },
  { code: "ko", label: "한국어", name: "한국어" },
  { code: "zh", label: "中文", name: "简体中文" },
];
export const LANG_CODES = LOCALES.map((l) => l.code);
const LANG_KEY = "d22-lang";

export function detectLocale() {
  try {
    const q = new URLSearchParams(location.search).get("lang");
    if (q && LANG_CODES.includes(q)) return q;
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && LANG_CODES.includes(saved)) return saved;
  } catch {}
  const nav = (navigator.language || "en").toLowerCase();
  if (nav.startsWith("ko")) return "ko";
  if (nav.startsWith("zh")) return "zh";
  return "en";
}
export function persistLocale(code) {
  try { localStorage.setItem(LANG_KEY, code); } catch {}
}

/* ---------- UI strings (flat keys, {name}-style placeholders) ---------- */
export const UI = {
  en: {
    metaDescription: "Explore the career of Wayne “D22-soso” Chiang as a miniature world: the 1999 world title, broadcasting, patented table games, Cube Draft, his book, and media contacts.",
    canvasLabel: "Interactive 3D map of Wayne Chiang’s archive. Use the sector list to open any exhibit.",
    livingArchive: "The Living Archive",
    worldView: "World view",
    beneathArchive: "Beneath the archive",
    introLead: "First Brood War World Champion, 1999",
    introWsop: "WSOP Talent Manager",
    introInventor: "Inventor of 2 Hand Hold’em",
    startTour: "Start the tour",
    exploration: "Exploration",
    travel: "Travel",
    exhibitMode: "Exhibit",
    sectorsSuffix: "sectors",
    listView: "List view",
    media: "Media",
    classicSite: "Classic site",
    sectorsBtn: "Sectors",
    skipToSectors: "Skip to the sector list",
    explored: "{n}% explored",
    sound: "Sound",
    soundEffects: "Sound effects",
    destination: "Destination",
    enterExhibit: "Enter exhibit",
    artifacts: "Artifacts",
    findsHint: "Explore to find {n} artifacts",
    zoomOut: "Zoom out",
    zoomIn: "Zoom in",
    hintExplore: "Drag to rotate · Scroll to zoom · Click a sign to enter",
    hintExploreTouch: "Drag to rotate · Pinch to zoom · Tap a sign",
    hintFound: "Drag to rotate · Scroll to zoom · Click a destination",
    hintFoundTouch: "Drag to rotate · Pinch to zoom · Tap a sign",
    hintUnder: "Drag down to return",
    hintDoneBuried: "Drag up, past the stop.",
    hintDone: "Every artifact recovered.",
    hintScout: "Scout dispatched to the signal…",
    designedBy: "Designed by chrisswimlee",
    artifactRecovered: "Artifact recovered",
    buriedArtifact: "Buried artifact",
    unidentifiedArtifact: "Unidentified artifact",
    signalDetected: "Signal detected",
    clickReadAgain: "Click to read again",
    clickRecover: "Click to recover",
    clickSendScout: "Click to send the scout",
    backToWorld: "Back to the world",
    otherSectors: "Other sectors",
    exhibitsNav: "Exhibits",
    archiveIndex: "D22 Archive / Index",
    enlargedPhoto: "Enlarged photo",
    closePhoto: "Close photo",
    enlarge: "Enlarge: {alt}",
    loadingLine: "First Brood War World Champion, 1999",
    enteringArchive: "Entering the archive",
    loadingAlt: "Wayne Chiang holding the 1999 world championship trophy",
    noscript: "This archive needs JavaScript. Visit the",
    noscriptLink: "classic site",
    siteTitle: "D22: The Living Archive",
    exhibitTitle: "{name} · D22: The Living Archive",
    guidedTourStop: "Guided tour · stop {pos} of {total}",
    nextStop: "Next stop: {name} →",
    finishTour: "Finish the tour",
    leaveTour: "Leave tour",
    prevName: "← {name}",
    nextName: "{name} →",
    previous: "Previous: {name}",
    next: "Next: {name}",
    finish: "Finish",
    chapterOne: "Chapter one",
    bookQuote: "Because the most important bet you’ll ever make… is on you.",
    bookDesc: "Business decisions, poker, and the age of AI, from a Fortune 500 executive and a world champion.",
    tapBook: "Tap the book to open it",
    openBook: "Open the book",
    bookCoverAlt: "Cover of Betting on Yourself by Joe Matton and Wayne Chiang",
    contactEyebrow: "Primary business channel · licensing · press · talent",
    emailWayne: "Email Wayne",
    copyEmail: "Copy email",
    venueMapLabel: "Map of the casinos dealing 2 Hand Hold’em live",
    copied: "Copied",
    selectedCopy: "Selected. Press copy.",
    language: "Language",
    championshipLink: "The 1999 world championship",
    holdem: {
      playable: "Playable · 2 Hand Hold’em™",
      dealAgain: "Deal again",
      dealer: "Dealer",
      board: "Board",
      your4: "Your 4",
      hand1: "Hand 1",
      hand2: "Hand 2",
      showTurnRiver: "Show the turn & river",
      pickTwo: "Tap two cards for Hand 1. The other two become Hand 2.",
      bothSet: "Both hands set. Play them against the dealer.",
      beats: "beats the dealer",
      loses: "loses",
      push: "push",
      dealerMakes: "Dealer makes {hand}.",
      bothWin: "Both hands win.",
      splitWin: "You split the action: one hand wins.",
      notThisTime: "Not this time.",
      suits: ["spades", "hearts", "diamonds", "clubs"],
      of: "of",
      categories: ["High card", "Pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush"],
    },
  },
  ko: {
    metaDescription: "Wayne “D22-soso” Chiang의 커리어를 미니어처 월드로 탐험하세요: 1999년 월드 타이틀, 방송, 특허 테이블 게임, 큐브 드래프트, 저서, 미디어 문의.",
    canvasLabel: "Wayne Chiang 아카이브의 인터랙티브 3D 지도. 섹터 목록에서 전시를 열 수 있습니다.",
    livingArchive: "살아있는 아카이브",
    worldView: "월드 뷰",
    beneathArchive: "아카이브 아래",
    introLead: "1999년 최초의 브루드 워 세계 챔피언",
    introWsop: "WSOP 탤런트 매니저",
    introInventor: "2 Hand Hold’em 발명가",
    startTour: "투어 시작하기",
    exploration: "탐험",
    travel: "이동 중",
    exhibitMode: "전시",
    sectorsSuffix: "개 섹터",
    listView: "목록 보기",
    media: "미디어",
    classicSite: "클래식 사이트",
    sectorsBtn: "섹터",
    skipToSectors: "섹터 목록으로 건너뛰기",
    explored: "{n}% 탐험",
    sound: "소리",
    soundEffects: "효과음",
    destination: "목적지",
    enterExhibit: "전시 입장",
    artifacts: "유물",
    findsHint: "탐험하며 유물 {n}개를 찾으세요",
    zoomOut: "축소",
    zoomIn: "확대",
    hintExplore: "드래그하여 회전 · 스크롤하여 확대/축소 · 표지판을 클릭해 입장",
    hintExploreTouch: "드래그하여 회전 · 핀치하여 확대/축소 · 표지판을 탭하세요",
    hintFound: "드래그하여 회전 · 스크롤하여 확대/축소 · 목적지를 클릭하세요",
    hintFoundTouch: "드래그하여 회전 · 핀치하여 확대/축소 · 표지판을 탭하세요",
    hintUnder: "아래로 드래그하면 돌아갑니다",
    hintDoneBuried: "멈춤 지점을 지나 위로 드래그하세요.",
    hintDone: "모든 유물을 회수했습니다.",
    hintScout: "신호를 향해 정찰병을 보냈습니다…",
    designedBy: "Designed by chrisswimlee",
    artifactRecovered: "유물 회수",
    buriedArtifact: "묻혀 있던 유물",
    unidentifiedArtifact: "미확인 유물",
    signalDetected: "신호 감지됨",
    clickReadAgain: "클릭하면 다시 읽을 수 있습니다",
    clickRecover: "클릭하여 회수",
    clickSendScout: "클릭하여 정찰병 파견",
    backToWorld: "월드로 돌아가기",
    otherSectors: "다른 섹터",
    exhibitsNav: "전시 목록",
    archiveIndex: "D22 아카이브 / 인덱스",
    enlargedPhoto: "확대된 사진",
    closePhoto: "사진 닫기",
    enlarge: "확대: {alt}",
    loadingLine: "1999년 최초의 브루드 워 세계 챔피언",
    enteringArchive: "아카이브에 입장 중",
    loadingAlt: "1999년 세계 챔피언십 트로피를 들고 있는 Wayne Chiang",
    noscript: "이 아카이브는 JavaScript가 필요합니다.",
    noscriptLink: "클래식 사이트 방문",
    siteTitle: "D22: 살아있는 아카이브",
    exhibitTitle: "{name} · D22: 살아있는 아카이브",
    guidedTourStop: "가이드 투어 · {total}곳 중 {pos}번째",
    nextStop: "다음 장소: {name} →",
    finishTour: "투어 마치기",
    leaveTour: "투어 나가기",
    prevName: "← {name}",
    nextName: "{name} →",
    previous: "이전: {name}",
    next: "다음: {name}",
    finish: "마치기",
    chapterOne: "1장",
    bookQuote: "인생에서 가장 중요한 베팅은… 바로 자신에게 거는 베팅입니다.",
    bookDesc: "포춘 500 임원과 세계 챔피언이 전하는 비즈니스 의사결정, 포커, 그리고 AI 시대.",
    tapBook: "책을 탭하면 열립니다",
    openBook: "책 열기",
    bookCoverAlt: "Joe Matton과 Wayne Chiang의 저서 『Betting on Yourself』 표지",
    contactEyebrow: "주요 비즈니스 채널 · 라이선싱 · 언론 · 탤런트",
    emailWayne: "Wayne에게 이메일",
    copyEmail: "이메일 복사",
    venueMapLabel: "2 Hand Hold’em을 라이브로 운영하는 카지노 지도",
    copied: "복사됨",
    selectedCopy: "선택됨. 복사하세요.",
    language: "언어",
    championshipLink: "1999년 세계 챔피언십",
    holdem: {
      playable: "플레이 가능 · 2 Hand Hold’em™",
      dealAgain: "다시 딜",
      dealer: "딜러",
      board: "보드",
      your4: "내 카드 4장",
      hand1: "핸드 1",
      hand2: "핸드 2",
      showTurnRiver: "턴과 리버 보기",
      pickTwo: "핸드 1에 넣을 카드 두 장을 탭하세요. 나머지 두 장이 핸드 2가 됩니다.",
      bothSet: "두 핸드가 완성됐습니다. 딜러와 대결하세요.",
      beats: "딜러를 이겼습니다",
      loses: "졌습니다",
      push: "무승부",
      dealerMakes: "딜러의 족보는 {hand}입니다.",
      bothWin: "두 핸드 모두 승리했습니다.",
      splitWin: "한 핸드만 승리했습니다.",
      notThisTime: "이번에는 아쉽네요.",
      suits: ["스페이드", "하트", "다이아몬드", "클럽"],
      of: "",
      categories: ["하이카드", "원페어", "투페어", "트리플", "스트레이트", "플러시", "풀하우스", "포카드", "스트레이트 플러시"],
    },
  },
  zh: {
    metaDescription: "以微缩世界探索 Wayne “D22-soso” Chiang 的职业生涯：1999 年世界冠军、广播、专利赌场游戏、Cube Draft、他的著作与媒体联系。",
    canvasLabel: "Wayne Chiang 档案馆的互动 3D 地图。使用区域列表打开任意展品。",
    livingArchive: "活档案馆",
    worldView: "世界视图",
    beneathArchive: "档案馆之下",
    introLead: "1999 年首位《母巢之战》世界冠军",
    introWsop: "WSOP 人才经理",
    introInventor: "2 Hand Hold’em 发明人",
    startTour: "开始导览",
    exploration: "探索",
    travel: "前往中",
    exhibitMode: "展览",
    sectorsSuffix: "个区域",
    listView: "列表视图",
    media: "媒体",
    classicSite: "经典站点",
    sectorsBtn: "区域",
    skipToSectors: "跳到区域列表",
    explored: "已探索 {n}%",
    sound: "声音",
    soundEffects: "音效",
    destination: "目的地",
    enterExhibit: "进入展品",
    artifacts: "文物",
    findsHint: "探索并找到 {n} 件文物",
    zoomOut: "缩小",
    zoomIn: "放大",
    hintExplore: "拖动旋转 · 滚动缩放 · 点击标牌进入",
    hintExploreTouch: "拖动旋转 · 双指缩放 · 点按标牌",
    hintFound: "拖动旋转 · 滚动缩放 · 点击目的地",
    hintFoundTouch: "拖动旋转 · 双指缩放 · 点按标牌",
    hintUnder: "向下拖动返回",
    hintDoneBuried: "向上拖动，越过止点。",
    hintDone: "已找回全部文物。",
    hintScout: "已向信号派出侦察兵…",
    designedBy: "Designed by chrisswimlee",
    artifactRecovered: "文物已找回",
    buriedArtifact: "埋藏的文物",
    unidentifiedArtifact: "未识别文物",
    signalDetected: "检测到信号",
    clickReadAgain: "点击重新阅读",
    clickRecover: "点击回收",
    clickSendScout: "点击派出侦察兵",
    backToWorld: "返回世界",
    otherSectors: "其他区域",
    exhibitsNav: "展品",
    archiveIndex: "D22 档案馆 / 索引",
    enlargedPhoto: "放大的照片",
    closePhoto: "关闭照片",
    enlarge: "放大：{alt}",
    loadingLine: "1999 年首位《母巢之战》世界冠军",
    enteringArchive: "正在进入档案馆",
    loadingAlt: "Wayne Chiang 手持 1999 年世界冠军奖杯",
    noscript: "本档案馆需要 JavaScript。请访问",
    noscriptLink: "经典站点",
    siteTitle: "D22：活档案馆",
    exhibitTitle: "{name} · D22：活档案馆",
    guidedTourStop: "导览 · 第 {pos} 站，共 {total} 站",
    nextStop: "下一站：{name} →",
    finishTour: "结束导览",
    leaveTour: "离开导览",
    prevName: "← {name}",
    nextName: "{name} →",
    previous: "上一站：{name}",
    next: "下一站：{name}",
    finish: "结束",
    chapterOne: "第一章",
    bookQuote: "因为你一生中最重要的一次下注……就是押注你自己。",
    bookDesc: "一位财富 500 强高管与一位世界冠军谈商业决策、扑克与 AI 时代。",
    tapBook: "点按书籍将其打开",
    openBook: "打开书籍",
    bookCoverAlt: "Joe Matton 与 Wayne Chiang 合著的《Betting on Yourself》封面",
    contactEyebrow: "主要商务渠道 · 授权 · 新闻 · 人才",
    emailWayne: "给 Wayne 发邮件",
    copyEmail: "复制邮箱",
    venueMapLabel: "实地提供 2 Hand Hold’em 的赌场地图",
    copied: "已复制",
    selectedCopy: "已选中，请按复制。",
    language: "语言",
    championshipLink: "1999 年世界冠军赛",
    holdem: {
      playable: "可试玩 · 2 Hand Hold’em™",
      dealAgain: "重新发牌",
      dealer: "庄家",
      board: "公共牌",
      your4: "你的 4 张",
      hand1: "手牌 1",
      hand2: "手牌 2",
      showTurnRiver: "看转牌和河牌",
      pickTwo: "点选两张牌作为手牌 1，其余两张自动成为手牌 2。",
      bothSet: "两手牌已组好，与庄家对决。",
      beats: "击败庄家",
      loses: "落败",
      push: "平局",
      dealerMakes: "庄家凑成{hand}。",
      bothWin: "两手全赢。",
      splitWin: "一胜一负，平分秋色。",
      notThisTime: "这次运气不佳。",
      suits: ["黑桃", "红桃", "方块", "梅花"],
      of: "",
      categories: ["高牌", "一对", "两对", "三条", "顺子", "同花", "葫芦", "四条", "同花顺"],
    },
  },
};

export function makeT(locale) {
  const dict = UI[locale] || UI.en;
  return (key, vars) => {
    let s = dict[key] ?? UI.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  };
}

/* ---------- Exhibit overlays: only text fields, matched by sector id + block order ---------- */
const SECTOR_T = {
  ko: {
    arena: {
      name: "챔피언십 아레나", short: "아레나", tagline: "1999 · 월드 타이틀 · 아카이브 전시", keyAlt: "1999년 세계 챔피언십 트로피를 든 Wayne Chiang",
      exhibit: { kicker: "섹터 01 · 실시간 전략", title: "최초의 브루드 워 세계 챔피언", lede: "1999년 4월 28일, 랜덤 종족으로 플레이한 D22-soso는 블리자드의 첫 공식 브루드 워 세계 챔피언십인 Battle.net 시즌 1에서 우승했습니다. 커맨드 앤 컨커부터 스타크래프트까지, 온라인 래더 정상을 지킨 3년의 정점이었습니다.", blocks: [
        { items: [{ alt: "첫 공식 브루드 워 세계 챔피언십 대진표 아카이브 페이지", caption: "원본 대진표" }, { alt: "1999년 스타크래프트 트로피를 든 Wayne Chiang", caption: "1999년의 트로피들." }] },
        { title: "결승전", text: ["그의 여정은 Nautosoft, 신주영, Guillaume “Grrrr…” Patry를 거쳤습니다. Crexis(Chris Low)와의 결승은 Showdown에서 마지막까지 갔습니다.", "테란 절벽 전투에서 패한 뒤 보병, 고스트, 시즈 탱크로 재건해 35분 37초에 5게임을 마무리하며 2,500달러의 타이틀을 차지했습니다."] },
        { title: "아카이브 인터뷰", items: [{ title: "Zombie Grub 인터뷰", source: "Case’s Ladder 시절, 그리고 첫 공식 월드 타이틀" }, { title: "Tasteless & Artosis 회고", source: "씬을 이끌어 온 캐스터들과 함께" }] },
        { title: "대회 기록", items: [["1996", "커맨드 앤 컨커 · Case’s Ladder 1위, 1v1 & 팀 · Team Synergy"], ["1997", "워크래프트 II · Kali 1v1 상위 3위 · Clan C4L과 팀 래더 1위"], ["1998년 4월", "스타크래프트 · Case’s Ladder 1위, 1v1 & 팀"], ["1998년 4월", "첫 스타크래프트 대회 우승 · Neutral Ground Mountain View"], ["1998년 10월", "첫 스타크래프트 대회 캐스터 · PGL 시즌 3"], ["1999년 2월", "Battle.net vs Kali · 2번 시드"], ["1999년 4월", "브루드 워 시즌 1 세계 챔피언 · 랜덤 · 2,500달러"], ["1999년 5월", "PGL 시즌 4 · 준우승 · 7,000달러"], ["1999년 6월", "미국 vs 캐나다 쇼케이스 · MVP, 3–0"], ["1999년 7월", "스포츠서울 #5 · 세계 챔피언 초청전 3위"], ["1999년 9월", "Battle.net 세계 챔피언십 결승 · 3위"]] },
        { title: "1차 자료", items: [{ label: "블리자드 시즌 1 결승 리포트" }, { label: "Liquipedia: Soso" }, { label: "전체 게이밍 아카이브" }] },
      ] },
    },
    garden: {
      name: "전략의 정원", short: "정원", tagline: "Magic · 큐브 드래프트 · 래더", keyAlt: "Brian Weissman과 함께한 Wayne Chiang",
      exhibit: { kicker: "섹터 02 · 테이블탑 전략", title: "큐브가 시작된 곳", lede: "실시간 전략 이전에 Magic이 있었습니다. Brian Weissman은 팔로알토의 Round Table Pizza에서 그를 경쟁 플레이로 이끌었습니다. 그의 커스텀 드래프트 풀 “더 큐브”는 큐브 드래프트로 성장했고, 이후 Magic Online의 대표 형식이 됐습니다.", blocks: [
        { items: [{ alt: "Brian Weissman과 함께한 Wayne Chiang", caption: "그를 경쟁 Magic으로 이끈 Brian Weissman과 함께." }] },
        { text: "큐브 드래프트 아이디어의 대부분에 대한 공개적인 공로는 Brian Weissman과 Tom Martell에게 돌아갑니다.", cite: "큐브 드래프트의 기원" },
        { title: "영상으로 보는 큐브 드래프트", items: [{ title: "Magic History: The Cube", source: "The Tranquil Domain · 형식의 구술사" }, { title: "큐브 드래프트는 누가 만들었나?", source: "Brian Weissman이 들려주는 기원 · Wayne Chiang 채널" }, { title: "Kraken MTG 셀러브리티 큐브 드래프트 토너먼트", source: "Kraken · 라이브 방송 1부" }] },
        { items: [["프로 투어", "뉴욕 ’01 · 보스턴 ’02 · 총 3회 출전 자격"], ["예선", "PTQ 상위 8위 단골"], ["형식", "큐브 드래프트 · 오픈 형식, 특허 주장 없음"]] },
        { title: "여전히 도전 중", items: [["2004", "워크래프트 III · US West FFA 1위 · 팀전 2위"], ["2015 →", "하스스톤 · 전설 35위(스탠다드 NA) · 11위(와일드 NA)"], ["2018", "하스스톤 와일드 오픈 아메리카 · 상위 32위"], ["최근", "클래시 로얄 챌린저 · 리그 오브 레전드 다이아몬드 5 · Once Upon a Galaxy 1위"]] },
        { items: [{ alt: "하스스톤 전설 35위 스크린샷", caption: "전설 35위, 스탠다드 NA." }] },
        { items: [{ label: "큐브 드래프트 룸" }, { label: "Magic 룸" }, { label: "X의 Kraken 셀러브리티 큐브 드래프트" }] },
      ] },
    },
    broadcast: {
      name: "방송 스테이션", short: "방송", tagline: "Live at the Bike · WSOP · 인터뷰", keyAlt: "World Series of Poker 로고",
      exhibit: { kicker: "섹터 03 · 포커 & 미디어", title: "펠트에서 컨트롤룸으로", lede: "10년 넘게 하이스테이크스 포커 프로로 뛰다가 카메라 뒤로 옮겼습니다. Live at the Bike의 공동 소유주이자 리드 프로듀서로서 최고 시청자를 2,500명에서 8,800명으로 키웠습니다. 현재는 World Series of Poker 미디어 팀의 탤런트 매니저입니다.", blocks: [
        { items: [{ alt: "2025 WSOP에서 SlayerS_BoxeR와 함께한 Wayne Chiang", caption: "WSOP 2025, SlayerS_BoxeR와 함께." }, { alt: "포커 프로 ElkY와 함께한 Wayne Chiang", caption: "ElkY와 함께." }] },
        { title: "시청하기", items: [{ title: "WSOP의 브이로거 붐", source: "PokerOrg Q&A" }, { title: "스타크래프트 챔피언, WSOP 탤런트 매니저", source: "The Flow Show · Jeff Gross" }, { title: "그는 포커로 수백만을 벌었다…", source: "Table 1 Podcast" }, { title: "Live at the Bike 전 소유주", source: "Chasing Poker Greatness" }, { title: "Wayne Chiang Poker", source: "YouTube 채널" }] },
        { items: [["WSOP", "탤런트 매니저, 미디어 팀 · 브이로거 프로그램"], ["Live at the Bike", "공동 소유주 & 리드 프로듀서 · 최고 시청자 2,500 → 8,800"], ["PokerCraft", "Hellmuth, Negreanu, Greenstein과 함께한 팟캐스트"], ["Global Poker", "뱅크롤 챌린지 · 1위"]] },
        { items: [{ label: "클래식 사이트의 포커 룸" }] },
      ] },
    },
    foundry: {
      name: "발명 공방", short: "공방", tagline: "특허 테이블 게임 · 플레이 가능 데모", keyAlt: "2 Hand Hold’em 로고",
      exhibit: { kicker: "섹터 04 · 특허 테이블 게임", title: "두 개의 핸드. 하나의 보드.", lede: "2 Hand Hold’em™은 플레이어에게 홀 카드 네 장을 주어 딜러의 단일 보드를 상대로 두 개의 독립 핸드로 나눌 수 있게 합니다. 워싱턴주 도박위원회의 인증을 받아 카지노에서 실제로 딜링되고 있습니다.", blocks: [
        {},
        { title: "2 Hand Hold’em 플레이 방법", items: [["앤티", "핸드마다 하나씩, 같은 금액의 베팅 두 개."], ["딜", "플레이어에게 홀 카드 네 장, 딜러에게 세 장, 그리고 플랍 세 장."], ["배열", "네 장을 두 장씩 두 핸드로 나눕니다."], ["체크 또는 레이즈", "각 핸드마다 독립적으로 체크하거나 앤티의 2배를 레이즈."], ["쇼다운", "턴과 리버가 열립니다. 각 핸드는 딜러와 따로 대결합니다."]] },
        { items: [["2 Hand Hold’em™", "미국 특허 11,117,045 · 11,731,032 · 12,005,342"], ["Badugi Chase™", "미국 특허 11,810,421 · 12,131,608 · 공동 발명가 Charles Chang"], ["사이드 베팅", "Flounder 4 · Nessie 9 · 888 Flop Bonus · Community Bonus"]] },
        {},
        { title: "Badugi Chase™ · “베이비 레인보우”", text: ["카드 세 장, 그리고 체이스: 커뮤니티 카드 세 장 중 하나를 골라 네 장 바둑이를 완성합니다. 무늬와 숫자가 모두 다르면 이기고, 가장 낮은 탑 카드가 승리합니다."] },
        { items: [{ alt: "Badugi Chase 테이블 레이아웃", caption: "Badugi Chase 레이아웃." }] },
        { items: [{ label: "play2hh.com에서 온라인 플레이" }, { label: "특허 11,117,045" }] },
      ] },
    },
    library: {
      name: "도서관", short: "도서관", tagline: "Betting on Yourself · Kendall Hunt", keyAlt: "Betting on Yourself 책 표지",
      exhibit: { kicker: "섹터 05 · 저자", title: "Betting on Yourself", lede: "비즈니스, 포커, 그리고 AI 시대에서 승리하기. 포춘 500 임원이자 WSOP 챔피언 Joe Matton과 공저했으며, 2025년 12월 Kendall Hunt에서 출간됐습니다.", blocks: [
        {},
        { items: [["저자", "Joe Matton & Wayne Chiang"], ["출판사", "Kendall Hunt · 2025년 12월"], ["ISBN", "9798319708007"], ["다루는 주제", "비즈니스 의사결정 · 포커 · AI 시대"]] },
        { items: [{ label: "Amazon에서 구매" }, { label: "Kendall Hunt" }] },
      ] },
    },
    command: {
      name: "커맨드 센터", short: "커맨드", tagline: "약력 · 미디어 키트 · 라이선싱 · 문의", keyAlt: "2025 World Series of Poker에서의 Wayne Chiang",
      exhibit: { kicker: "섹터 06 · 미디어 & 라이선싱", title: "Wayne “D22-soso” Chiang", lede: "첫 공식 스타크래프트: 브루드 워 시즌 1 세계 챔피언(랜덤, 1999), 큐브 드래프트 선구자, 특허 카지노 게임 발명가, World Series of Poker 탤런트 매니저, 『Betting on Yourself』 공저자.", blocks: [
        {},
        { items: [{ alt: "1999년 세계 챔피언십 트로피를 든 Wayne Chiang의 언론용 헤드샷", caption: "언론용 헤드샷, 시즌 1 트로피와 함께." }, { alt: "1999년 트로피들을 든 Wayne Chiang의 언론용 헤드샷", caption: "언론용 헤드샷, 1999년 트로피들과 함께." }, { alt: "각인된 1999년 세계 챔피언 트로피 클로즈업", caption: "D22-soso가 각인된 트로피 명판." }] },
        { title: "언론 & 미디어 키트", items: [{ label: "전체 미디어 키트 (.zip)" }, { label: "짧은 약력" }, { label: "긴 약력" }, { label: "팩트 시트" }, { label: "헤드샷 · 트로피" }, { label: "헤드샷 · PGL 시대" }, { label: "헤드샷 · 클로즈업" }] },
        { title: "한눈에 보기", items: [["1996–99", "C&C, 워크래프트 II, 스타크래프트 래더 1위"], ["1999", "브루드 워 시즌 1 세계 챔피언"], ["2001–02", "Magic 프로 투어 · 큐브 드래프트의 기원"], ["2007", "UC 샌디에이고 경제학 학사"], ["2015", "2 Hand Hold’em™ 발명"], ["2021", "Live at the Bike 매각"], ["2025", "WSOP 탤런트 매니저 · Betting on Yourself"]] },
        { title: "다른 곳에서", items: [{ label: "LinkedIn" }, { label: "X @D22_soso" }, { label: "Instagram" }, { label: "YouTube" }, { label: "Liquipedia" }] },
      ] },
    },
  },
  zh: {
    arena: {
      name: "冠军竞技场", short: "竞技场", tagline: "1999 · 世界冠军 · 档案展品", keyAlt: "Wayne Chiang 手持 1999 年世界冠军奖杯",
      exhibit: { kicker: "区域 01 · 即时战略", title: "首位《母巢之战》世界冠军", lede: "1999 年 4 月 28 日，使用随机种族的 D22-soso 赢得了 Battle.net 第一赛季——暴雪首个官方《母巢之战》世界冠军。这为他从《命令与征服》到《星际争霸》称霸线上天梯的三年画上了句号。", blocks: [
        { items: [{ alt: "首个官方《母巢之战》世界冠军对阵表档案页", caption: "原始对阵表" }, { alt: "Wayne Chiang 与他的 1999 年星际争霸奖杯", caption: "1999 年的奖杯。" }] },
        { title: "决赛", text: ["他的晋级之路先后经过 Nautosoft、申柱荣（Shin Ju Young）和 Guillaume “Grrrr…” Patry。与 Crexis（Chris Low）的决赛在 Showdown 上打满全场。", "在一场人族悬崖战失利后，他以步兵、幽灵和攻城坦克重整旗鼓，在 35:37 拿下第五局，赢得 2,500 美元冠军。"] },
        { title: "档案访谈", items: [{ title: "Zombie Grub 访谈", source: "从 Case’s Ladder 岁月到首个官方世界冠军" }, { title: "Tasteless 与 Artosis 回顾", source: "与将这个舞台传承下去的解说们" }] },
        { title: "比赛纪录", items: [["1996", "《命令与征服》· Case’s Ladder 第一，单人及战队 · Team Synergy"], ["1997", "《魔兽争霸 II》· Kali 单人前三 · 与 Clan C4L 战队天梯第一"], ["1998年4月", "《星际争霸》· Case’s Ladder 第一，单人及战队"], ["1998年4月", "首个星际争霸赛事冠军 · Neutral Ground Mountain View"], ["1998年10月", "首位星际争霸赛事解说 · PGL 第三赛季"], ["1999年2月", "Battle.net 对 Kali · 二号种子"], ["1999年4月", "《母巢之战》第一赛季世界冠军 · 随机种族 · 2,500 美元"], ["1999年5月", "PGL 第四赛季 · 亚军 · 7,000 美元"], ["1999年6月", "美国对加拿大表演赛 · MVP，3–0"], ["1999年7月", "体育首尔 #5 · 世界冠军邀请赛第三名"], ["1999年9月", "Battle.net 世界冠军总决赛 · 第三名"]] },
        { title: "一手资料", items: [{ label: "暴雪第一赛季决赛报道" }, { label: "Liquipedia：Soso" }, { label: "完整游戏档案" }] },
      ] },
    },
    garden: {
      name: "策略花园", short: "花园", tagline: "万智牌 · Cube Draft · 天梯", keyAlt: "Wayne Chiang 与 Brian Weissman",
      exhibit: { kicker: "区域 02 · 桌面策略", title: "Cube 的起源之地", lede: "在即时战略之前，先有万智牌。Brian Weissman 在帕洛阿尔托一家 Round Table Pizza 将他带入竞技对局。他自创的轮抽牌池“The Cube”后来发展为 Cube Draft，成为 Magic Online 的常驻玩法。", blocks: [
        { items: [{ alt: "Wayne Chiang 与 Brian Weissman", caption: "与带他走进竞技万智牌的 Brian Weissman。" }] },
        { text: "Cube Draft 创意的绝大部分公开功劳属于 Brian Weissman 和 Tom Martell。", cite: "Cube Draft 的起源" },
        { title: "影像中的 Cube Draft", items: [{ title: "Magic History: The Cube", source: "The Tranquil Domain · 这一赛制的口述历史" }, { title: "Cube Draft 是谁创造的？", source: "Brian Weissman 讲述起源 · Wayne Chiang 频道" }, { title: "Kraken 万智牌名人 Cube Draft 锦标赛", source: "Kraken · 直播第一部分" }] },
        { items: [["职业巡回赛", "纽约 ’01 · 波士顿 ’02 · 三次获得资格"], ["资格赛", "多次 PTQ 八强"], ["赛制", "Cube Draft · 开放赛制，无专利主张"]] },
        { title: "仍在攀登", items: [["2004", "《魔兽争霸 III》· 美西 FFA 第一 · 组队第二"], ["2015 →", "《炉石传说》· 传说第 35 名（标准 NA）· 第 11 名（狂野 NA）"], ["2018", "炉石狂野公开赛美洲区 · 32 强"], ["近期", "《皇室战争》挑战者 · 《英雄联盟》钻石 5 · Once Upon a Galaxy 第一"]] },
        { items: [{ alt: "《炉石传说》传说第 35 名截图", caption: "传说第 35 名，标准模式 NA。" }] },
        { items: [{ label: "Cube Draft 展室" }, { label: "万智牌展室" }, { label: "X 上的 Kraken 名人 Cube Draft" }] },
      ] },
    },
    broadcast: {
      name: "广播站", short: "广播", tagline: "Live at the Bike · WSOP · 访谈", keyAlt: "世界扑克系列赛标志",
      exhibit: { kicker: "区域 03 · 扑克与媒体", title: "从牌桌到控制室", lede: "十余年的高额扑克职业选手，后来走到镜头之后。作为 Live at the Bike 的共同所有者兼首席制作人，他将峰值观众从 2,500 提升到 8,800。如今他是世界扑克系列赛媒体团队的人才经理。", blocks: [
        { items: [{ alt: "Wayne Chiang 与 SlayerS_BoxeR 在 2025 WSOP", caption: "WSOP 2025，与 SlayerS_BoxeR。" }, { alt: "Wayne Chiang 与扑克职业选手 ElkY", caption: "与 ElkY。" }] },
        { title: "收看收听", items: [{ title: "WSOP 的视频博主热潮", source: "PokerOrg 问答" }, { title: "星际冠军、WSOP 人才经理", source: "The Flow Show · Jeff Gross" }, { title: "他靠扑克赚了数百万……", source: "Table 1 Podcast" }, { title: "Live at the Bike 前所有者", source: "Chasing Poker Greatness" }, { title: "Wayne Chiang Poker", source: "YouTube 频道" }] },
        { items: [["WSOP", "人才经理，媒体团队 · 视频博主计划"], ["Live at the Bike", "共同所有者兼首席制作人 · 峰值观众 2,500 → 8,800"], ["PokerCraft", "与 Hellmuth、Negreanu、Greenstein 的播客"], ["Global Poker", "资金挑战赛 · 第一名"]] },
        { items: [{ label: "经典站点上的扑克展室" }] },
      ] },
    },
    foundry: {
      name: "发明工坊", short: "工坊", tagline: "专利桌面游戏 · 可试玩演示", keyAlt: "2 Hand Hold’em 标志",
      exhibit: { kicker: "区域 04 · 专利桌面游戏", title: "两手牌。一张牌面。", lede: "2 Hand Hold’em™ 让玩家拿到四张底牌，拆成两手独立的牌，对阵庄家的同一组公共牌。它已通过华盛顿州博彩委员会认证，并在赌场实地发牌。", blocks: [
        {},
        { title: "2 Hand Hold’em 玩法", items: [["前注", "每手一注，两注金额相等。"], ["发牌", "你拿四张底牌，庄家三张，外加三张翻牌。"], ["分牌", "将四张牌分成两手各两张。"], ["让牌或加注", "每手独立让牌，或加注前注的 2 倍。"], ["摊牌", "发出转牌与河牌，每手分别与庄家对决。"]] },
        { items: [["2 Hand Hold’em™", "美国专利 11,117,045 · 11,731,032 · 12,005,342"], ["Badugi Chase™", "美国专利 11,810,421 · 12,131,608 · 共同发明人 Charles Chang"], ["边注", "Flounder 4 · Nessie 9 · 888 Flop Bonus · Community Bonus"]] },
        {},
        { title: "Badugi Chase™ · “小彩虹”", text: ["先发三张，再进入 Chase：从三张公共牌中选一张，凑成四张 Badugi。花色与点数互不相同的最低牌获胜。"] },
        { items: [{ alt: "Badugi Chase 桌面布局", caption: "Badugi Chase 桌面布局。" }] },
        { items: [{ label: "在 play2hh.com 在线试玩" }, { label: "专利 11,117,045" }] },
      ] },
    },
    library: {
      name: "图书馆", short: "图书馆", tagline: "Betting on Yourself · Kendall Hunt", keyAlt: "《Betting on Yourself》书封",
      exhibit: { kicker: "区域 05 · 作者", title: "Betting on Yourself", lede: "在商业、扑克与 AI 时代制胜。与财富 500 强高管兼 WSOP 冠军 Joe Matton 合著，2025 年 12 月由 Kendall Hunt 出版。", blocks: [
        {},
        { items: [["作者", "Joe Matton 与 Wayne Chiang"], ["出版社", "Kendall Hunt · 2025 年 12 月"], ["ISBN", "9798319708007"], ["涵盖", "商业决策 · 扑克 · AI 时代"]] },
        { items: [{ label: "在 Amazon 购买" }, { label: "Kendall Hunt" }] },
      ] },
    },
    command: {
      name: "指挥中心", short: "指挥", tagline: "简介 · 媒体包 · 授权 · 联系", keyAlt: "Wayne Chiang 在 2025 年世界扑克系列赛",
      exhibit: { kicker: "区域 06 · 媒体与授权", title: "Wayne “D22-soso” Chiang", lede: "首个官方《星际争霸：母巢之战》第一赛季世界冠军（随机种族，1999）、Cube Draft 先驱、专利赌场游戏发明人、世界扑克系列赛人才经理，以及《Betting on Yourself》合著者。", blocks: [
        {},
        { items: [{ alt: "Wayne Chiang 手持 1999 年世界冠军奖杯的新闻头像", caption: "新闻头像，与第一赛季奖杯。" }, { alt: "Wayne Chiang 与 1999 年奖杯的新闻头像", caption: "新闻头像，与 1999 年奖杯。" }, { alt: "刻有铭文的 1999 年世界冠军奖杯特写", caption: "奖杯铭牌，刻着 D22-soso。" }] },
        { title: "新闻与媒体包", items: [{ label: "完整媒体包（.zip）" }, { label: "简短简介" }, { label: "详细简介" }, { label: "事实清单" }, { label: "头像 · 奖杯" }, { label: "头像 · PGL 时代" }, { label: "头像 · 特写" }] },
        { title: "一览", items: [["1996–99", "《命令与征服》《魔兽争霸 II》《星际争霸》天梯第一"], ["1999", "《母巢之战》第一赛季世界冠军"], ["2001–02", "万智牌职业巡回赛 · Cube Draft 起源"], ["2007", "加州大学圣地亚哥分校经济学学士"], ["2015", "发明 2 Hand Hold’em™"], ["2021", "Live at the Bike 被收购"], ["2025", "WSOP 人才经理 · 《Betting on Yourself》"]] },
        { title: "其他平台", items: [{ label: "LinkedIn" }, { label: "X @D22_soso" }, { label: "Instagram" }, { label: "YouTube" }, { label: "Liquipedia" }] },
      ] },
    },
  },
};

const ARTIFACT_T = {
  ko: {
    name: { title: "그가 D22가 된 사연", text: "Dennis “Thresh” Fong이 그에게 D22-soso라는 이름을 지어줬습니다. 라이벌 Gadianton은 D23-Gadianton이 됐습니다." },
    caster: { title: "하루 늦었다", text: "1998년 10월, PGL 시즌 3 등록을 단 하루 놓친 그는 대신 경기 중계를 맡아 스타크래프트 최초의 플레이바이플레이 캐스터가 됐습니다." },
    ng: { title: "Neutral Ground에서의 250달러", text: "그의 첫 스타크래프트 대회 우승은 1998년 4월 Neutral Ground Mountain View에서 Jay “Gadianton” Severson을 상대로 거뒀습니다." },
    usa: { title: "미국 vs 캐나다", text: "1999년 6월 미국 vs 캐나다 쇼케이스의 MVP로, 3–0 완승을 거뒀습니다." },
    pizza: { title: "Round Table Pizza", text: "경쟁 Magic은 팔로알토의 Round Table Pizza에서, 맞은편의 Brian Weissman과 함께 시작됐습니다." },
    count: { title: "카운트 아웃", text: "Hi-Lo와 Hi-Opt 1을 쓰는 블랙잭 어드밴티지 플레이어로, 라스베이거스와 샌디에이고의 주요 카지노에서 출입 금지를 당했습니다." },
    bankroll: { title: "뱅크롤 챌린지", text: "스트리밍된 Global Poker 뱅크롤 챌린지에서 +11,464달러로 우승했습니다." },
    pimp: { title: "Pimpest Plays", text: "Gamers.com에서 Thresh, Calbear와 함께 GX StarCraft를 운영했습니다: 경기 후 배틀 리포트와, e스포츠 하이라이트 릴의 초기 청사진인 Pimpest Plays." },
    script: { title: "시나리오 작가", text: "그의 장편 시나리오 한 편이 2007년 Screenwriting Expo 결선에 올랐습니다." },
  },
  zh: {
    name: { title: "D22 的由来", text: "Dennis “Thresh” Fong 为他改名为 D22-soso；他的对手 Gadianton 则成了 D23-Gadianton。" },
    caster: { title: "只迟了一天", text: "1998 年 10 月，他错过 PGL 第三赛季报名仅一天，于是改当比赛解说，成为星际争霸首位实况解说员。" },
    ng: { title: "Neutral Ground 的 250 美元", text: "他的首个星际争霸赛事冠军是 1998 年 4 月在 Neutral Ground Mountain View 击败 Jay “Gadianton” Severson 拿下的。" },
    usa: { title: "美国对加拿大", text: "1999 年 6 月美国对加拿大表演赛 MVP，以 3–0 横扫对手。" },
    pizza: { title: "Round Table Pizza", text: "竞技万智牌始于帕洛阿尔托一家 Round Table Pizza，对面坐着 Brian Weissman。" },
    count: { title: "被拒之门外", text: "他以 Hi-Lo 和 Hi-Opt 1 玩二十一点优势打法，被拉斯维加斯和圣地亚哥多家主要赌场列入黑名单。" },
    bankroll: { title: "资金挑战赛", text: "赢得直播的 Global Poker 资金挑战赛，最终 +11,464 美元。" },
    pimp: { title: "Pimpest Plays", text: "在 Gamers.com，他与 Thresh、Calbear 运营 GX StarCraft：赛后战报和 Pimpest Plays——电竞精彩集锦的早期蓝图。" },
    script: { title: "编剧", text: "他的一部长片剧本曾入围 2007 年 Screenwriting Expo 决赛。" },
  },
};

/* Merge a text overlay over a cloned block. Pair items (timeline/facts/steps)
   keep their third element (the "key" flag); object items copy known text fields. */
function applyBlock(base, tr) {
  if (!tr) return;
  for (const f of ["title", "text", "cite"]) if (tr[f] !== undefined) base[f] = tr[f];
  if (Array.isArray(tr.items) && Array.isArray(base.items)) {
    tr.items.forEach((ti, i) => {
      const bi = base.items[i];
      if (bi == null || ti == null) return;
      if (Array.isArray(bi) && Array.isArray(ti)) {
        if (ti[0] !== undefined) bi[0] = ti[0];
        if (ti[1] !== undefined) bi[1] = ti[1];
      } else if (typeof bi === "object") {
        for (const f of ["caption", "alt", "label", "title", "source"]) if (ti[f] !== undefined) bi[f] = ti[f];
      }
    });
  }
}

const ERA_T = {
  ko: { "1995 – today": "1995 – 현재", "2010s – today": "2010년대 – 현재", "2015 – today": "2015 – 현재", "December 2025": "2025년 12월", "Today": "현재" },
  zh: { "1995 – today": "1995 至今", "2010s – today": "2010年代至今", "2015 – today": "2015 至今", "December 2025": "2025年12月", "Today": "现今" },
};

export function localizeSectors(baseSectors, locale) {
  const all = structuredClone(baseSectors);
  const dict = SECTOR_T[locale];
  if (!dict) return all;
  for (const s of all) {
    if (ERA_T[locale]?.[s.era]) s.era = ERA_T[locale][s.era];
    const tr = dict[s.id];
    if (!tr) continue;
    for (const f of ["name", "short", "tagline"]) if (tr[f]) s[f] = tr[f];
    if (tr.keyAlt && s.key) s.key.alt = tr.keyAlt;
    if (!tr.exhibit) continue;
    for (const f of ["kicker", "title", "lede"]) if (tr.exhibit[f]) s.exhibit[f] = tr.exhibit[f];
    (tr.exhibit.blocks || []).forEach((tb, i) => applyBlock(s.exhibit.blocks[i], tb));
  }
  return all;
}

export function localizeArtifacts(baseArtifacts, locale) {
  const all = structuredClone(baseArtifacts);
  const dict = ARTIFACT_T[locale];
  if (!dict) return all;
  for (const a of all) if (dict[a.id]) Object.assign(a, dict[a.id]);
  return all;
}
