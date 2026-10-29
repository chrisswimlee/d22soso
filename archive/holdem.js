/* A small playable 2 Hand Hold'em hand: split four hole cards, then see both hands play the dealer. */
const RANKS = "23456789TJQKA";
const SUITS = ["♠", "♥", "♦", "♣"];
const NAMES = ["High card", "Pair", "Two pair", "Three of a kind", "Straight", "Flush", "Full house", "Four of a kind", "Straight flush"];

function deck() {
  const d = [];
  for (let s = 0; s < 4; s++) for (let r = 2; r <= 14; r++) d.push({ r, s });
  for (let i = d.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [d[i], d[j]] = [d[j], d[i]]; }
  return d;
}

function score5(cs) {
  const rs = cs.map((c) => c.r).sort((a, b) => b - a);
  const flush = cs.every((c) => c.s === cs[0].s);
  const uniq = [...new Set(rs)];
  let high = 0;
  if (uniq.length === 5) {
    if (rs[0] - rs[4] === 4) high = rs[0];
    else if (rs[0] === 14 && rs[1] === 5) high = 5;
  }
  const counts = uniq.map((r) => [rs.filter((x) => x === r).length, r]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  const shape = counts.map((c) => c[0]).join("");
  let cat;
  if (high && flush) cat = 8;
  else if (shape === "41") cat = 7;
  else if (shape === "32") cat = 6;
  else if (flush) cat = 5;
  else if (high) cat = 4;
  else if (shape === "311") cat = 3;
  else if (shape === "221") cat = 2;
  else if (shape === "2111") cat = 1;
  else cat = 0;
  const tb = high ? [high] : counts.map((c) => c[1]);
  return tb.reduce((acc, r) => acc * 15 + r, cat) * Math.pow(15, 5 - tb.length);
}

function best(cards) {
  let top = -1;
  const n = cards.length;
  for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) for (let c = b + 1; c < n; c++) for (let d = c + 1; d < n; d++) for (let e = d + 1; e < n; e++) {
    top = Math.max(top, score5([cards[a], cards[b], cards[c], cards[d], cards[e]]));
  }
  return top;
}
const category = (score) => NAMES[Math.floor(score / Math.pow(15, 5))];

function cardEl(c, opts = {}) {
  const el = document.createElement(opts.button ? "button" : "span");
  if (opts.button) el.type = "button";
  el.className = "card" + (c && (c.s === 1 || c.s === 2) ? " red" : "") + (c ? "" : " back");
  el.innerHTML = c ? `<b>${RANKS[c.r - 2].replace("T", "10")}</b><i>${SUITS[c.s]}</i>` : "";
  if (c) el.setAttribute("aria-label", `${RANKS[c.r - 2].replace("T", "10")} of ${["spades", "hearts", "diamonds", "clubs"][c.s]}`);
  return el;
}

export function mountDemo(root) {
  root.classList.add("hh");
  root.innerHTML = `
    <div class="hh-head"><p class="mono kicker">Playable · 2 Hand Hold’em™</p><button type="button" class="hh-deal btn-ghost">Deal again</button></div>
    <div class="hh-row"><span class="hh-label mono">Dealer</span><div class="hh-cards" data-dealer></div></div>
    <div class="hh-row"><span class="hh-label mono">Board</span><div class="hh-cards" data-board></div></div>
    <div class="hh-row"><span class="hh-label mono">Your 4</span><div class="hh-cards" data-hole></div></div>
    <div class="hh-hands"><div class="hh-hand" data-h1><span class="mono">Hand 1</span><div class="hh-cards"></div><p></p></div><div class="hh-hand" data-h2><span class="mono">Hand 2</span><div class="hh-cards"></div><p></p></div></div>
    <p class="hh-msg" aria-live="polite"></p>
    <button type="button" class="hh-go btn-solid" disabled>Show the turn & river</button>`;
  const $ = (s) => root.querySelector(s);
  let st;

  function deal() {
    const d = deck();
    st = { hole: d.slice(0, 4), dealer: d.slice(4, 7), board: d.slice(7, 12), pick: [], done: false };
    render();
  }
  function render() {
    const { hole, dealer, board, pick, done } = st;
    $("[data-dealer]").replaceChildren(...dealer.map((c) => cardEl(done ? c : null)));
    $("[data-board]").replaceChildren(...board.map((c, i) => cardEl(i < 3 || done ? c : null)));
    $("[data-hole]").replaceChildren(...hole.map((c, i) => {
      const b = cardEl(c, { button: true });
      b.classList.toggle("picked", pick.includes(i));
      b.disabled = done;
      b.addEventListener("click", () => {
        if (pick.includes(i)) st.pick = pick.filter((x) => x !== i);
        else if (pick.length < 2) st.pick = [...pick, i];
        render();
      });
      return b;
    }));
    const h1 = pick.map((i) => hole[i]);
    const h2 = pick.length === 2 ? hole.filter((_, i) => !pick.includes(i)) : [];
    $("[data-h1] .hh-cards").replaceChildren(...h1.map((c) => cardEl(c)));
    $("[data-h2] .hh-cards").replaceChildren(...h2.map((c) => cardEl(c)));
    $(".hh-go").disabled = pick.length !== 2 || done;
    const msg = $(".hh-msg");
    for (const sel of ["[data-h1] p", "[data-h2] p"]) $(sel).textContent = "";
    root.querySelectorAll(".hh-hand").forEach((h) => h.classList.remove("win", "lose", "push"));
    if (!done) {
      msg.textContent = pick.length < 2 ? "Tap two cards for Hand 1. The other two become Hand 2." : "Both hands set. Play them against the dealer.";
      return;
    }
    const dealerBest = best([...dealer, ...board]);
    let wins = 0;
    [[h1, "[data-h1]"], [h2, "[data-h2]"]].forEach(([h, sel]) => {
      const s = best([...h, ...board]);
      const res = s > dealerBest ? "win" : s < dealerBest ? "lose" : "push";
      if (res === "win") wins++;
      root.querySelector(sel).classList.add(res);
      $(`${sel} p`).textContent = `${category(s)} · ${res === "win" ? "beats the dealer" : res === "lose" ? "loses" : "push"}`;
    });
    msg.textContent = `Dealer makes ${category(dealerBest).toLowerCase()}. ${wins === 2 ? "Both hands win." : wins === 1 ? "You split the action: one hand wins." : "Not this time."}`;
  }
  $(".hh-go").addEventListener("click", () => { st.done = true; render(); });
  $(".hh-deal").addEventListener("click", deal);
  deal();
}
