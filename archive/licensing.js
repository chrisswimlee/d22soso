/* /licensing/ — one page for casino and card-room buyers, built by tools/build-exhibits.mjs.
   Public facts only, from wayne-chiang-truth-document.md and inventor-author.md. House-edge
   figures and the rate sheet stay confidential: never add them here. */

export const LICENSING_EMAIL = "2handholdem@gmail.com";

export const PATENTS = {
  twohh: [
    ["11,117,045", "https://patents.google.com/patent/US11117045"],
    ["11,731,032", "https://patents.google.com/patent/US11731032"],
    ["12,005,342", "https://patents.google.com/patent/US12005342"],
  ],
  badugi: [
    ["11,810,421", "https://patents.google.com/patent/US11810421"],
    ["12,131,608", "https://patents.google.com/patent/US12131608"],
  ],
  pending: ["2023/0419777", "https://patents.google.com/patent/US20230419777A1"],
};

export const SIDE_BETS = ["Flounder 4", "Nessie 9", "888 Flop Bonus", "Community Bonus"];

/* Qualifying 4-card Badugi, Ante Bonus (published in the 2026 inventor sheet). */
export const BADUGI_BONUS = [["4", "25 : 1"], ["5", "10 : 1"], ["6", "5 : 1"], ["7", "3 : 1"], ["8", "2 : 1"], ["9", "1 : 1"]];

export const LICENSING = {
  en: {
    name: "Licensing",
    kicker: "2 HH, LLC · Table game licensing",
    title: "License 2 Hand Hold’em™ and Badugi Chase™",
    lede: "Two patented casino table games by Wayne Chiang. 2 Hand Hold’em is certified by the Washington State Gambling Commission and dealt live at {n} venues today.",
    ask: "Email about licensing",
    askSubject: "Licensing inquiry: 2 Hand Hold’em / Badugi Chase",
    demo: "Play the free demo",
    terms: "Terms and the licensing packet are shared on request.",
    facts: [
      ["Patents", "5 U.S. patents granted · 1 application pending"],
      ["Assignee", "2 HH, LLC"],
      ["Certified", "Washington State Gambling Commission"],
      ["Debut", "Great American Casino Tukwila (Maverick Gaming)"],
    ],
    liveTitle: "Live today",
    mapLabel: "Map of the venues dealing 2 Hand Hold’em live",
    fullMap: "Open the full map",
    regions: {},
    twohhTitle: "2 Hand Hold’em™",
    twohhPitch: "Two hands, one board. The player plays both hands against a single dealer board, without slowing the pit.",
    sideBets: "Proprietary side bets",
    patents: "U.S. Patents",
    pending: "U.S. Patent Application",
    badugiTitle: "Badugi Chase™ · “The Baby Rainbow”",
    badugiPitch: "Three cards, then the Chase: the player picks one of three community cards to finish a four-card Badugi. Co-invented with Charles Chang.",
    bonusTitle: "Ante Bonus · qualifying 4-card Badugi",
    bonusHigh: "{n}-high",
    pressTitle: "For press and partners",
    press: [
      ["Fact sheet", "/assets/media-kit/fact-sheet.txt"],
      ["Full media kit (.zip)", "/assets/media-kit/d22soso-media-kit.zip"],
      ["The Invention Foundry exhibit", "/foundry/"],
    ],
  },
  ko: {
    name: "라이선스",
    kicker: "2 HH, LLC · 테이블 게임 라이선스",
    title: "2 Hand Hold’em™과 Badugi Chase™ 라이선스",
    lede: "Wayne Chiang이 발명한 특허 카지노 테이블 게임 두 가지입니다. 2 Hand Hold’em은 워싱턴주 도박위원회의 인증을 받았으며, 현재 {n}곳에서 라이브로 운영되고 있습니다.",
    ask: "라이선스 문의 이메일",
    askSubject: "Licensing inquiry: 2 Hand Hold’em / Badugi Chase",
    demo: "무료 데모 플레이",
    terms: "조건과 라이선스 자료는 요청 시 제공합니다.",
    facts: [
      ["특허", "미국 특허 5건 등록 · 출원 1건 심사 중"],
      ["권리자", "2 HH, LLC"],
      ["인증", "워싱턴주 도박위원회"],
      ["데뷔", "Great American Casino Tukwila (Maverick Gaming)"],
    ],
    liveTitle: "현재 운영 중",
    mapLabel: "2 Hand Hold’em을 라이브로 운영하는 장소 지도",
    fullMap: "전체 지도 열기",
    regions: { Washington: "워싱턴주", California: "캘리포니아주", Texas: "텍사스주", Nevada: "네바다주" },
    twohhTitle: "2 Hand Hold’em™",
    twohhPitch: "두 개의 핸드, 하나의 보드. 플레이어는 두 핸드로 딜러의 단일 보드와 대결하며, 테이블 진행 속도는 그대로입니다.",
    sideBets: "독점 사이드 베팅",
    patents: "미국 특허",
    pending: "미국 특허 출원",
    badugiTitle: "Badugi Chase™ · “베이비 레인보우”",
    badugiPitch: "카드 세 장, 그리고 체이스: 커뮤니티 카드 세 장 중 하나를 골라 네 장 바둑이를 완성합니다. Charles Chang과 공동 발명.",
    bonusTitle: "앤티 보너스 · 4장 바둑이 성립 시",
    bonusHigh: "{n}-하이",
    pressTitle: "언론 및 파트너용",
    press: [
      ["팩트 시트 (영문)", "/assets/media-kit/fact-sheet.txt"],
      ["전체 미디어 키트 (.zip)", "/assets/media-kit/d22soso-media-kit.zip"],
      ["발명 공방 전시", "/ko/foundry/"],
    ],
  },
  zh: {
    name: "授权",
    kicker: "2 HH, LLC · 桌面游戏授权",
    title: "授权 2 Hand Hold’em™ 与 Badugi Chase™",
    lede: "Wayne Chiang 发明的两款专利赌场桌面游戏。2 Hand Hold’em 已通过华盛顿州博彩委员会认证，目前在 {n} 个场所实地发牌。",
    ask: "发邮件洽谈授权",
    askSubject: "Licensing inquiry: 2 Hand Hold’em / Badugi Chase",
    demo: "免费试玩",
    terms: "授权条款与资料包可应要求提供。",
    facts: [
      ["专利", "5 项美国专利已授权 · 1 项申请审查中"],
      ["专利权人", "2 HH, LLC"],
      ["认证", "华盛顿州博彩委员会"],
      ["首发", "Great American Casino Tukwila (Maverick Gaming)"],
    ],
    liveTitle: "目前上桌",
    mapLabel: "实地提供 2 Hand Hold’em 的场所地图",
    fullMap: "打开完整地图",
    regions: { Washington: "华盛顿州", California: "加利福尼亚州", Texas: "得克萨斯州", Nevada: "内华达州" },
    twohhTitle: "2 Hand Hold’em™",
    twohhPitch: "两手牌，一张牌面。玩家用两手牌对阵庄家的同一组公共牌，牌桌节奏不受影响。",
    sideBets: "专属边注",
    patents: "美国专利",
    pending: "美国专利申请",
    badugiTitle: "Badugi Chase™ · “小彩虹”",
    badugiPitch: "先发三张，再进入 Chase：从三张公共牌中选一张，凑成四张 Badugi。与 Charles Chang 共同发明。",
    bonusTitle: "前注奖金 · 成立四张 Badugi",
    bonusHigh: "{n} 高",
    pressTitle: "媒体与合作方",
    press: [
      ["资料表（英文）", "/assets/media-kit/fact-sheet.txt"],
      ["完整媒体资料包 (.zip)", "/assets/media-kit/d22soso-media-kit.zip"],
      ["发明工坊展区", "/zh/foundry/"],
    ],
  },
};
