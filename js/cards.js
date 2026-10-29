/* Playing cards. Blocks marked [data-card="A♠"] get a card back and corner
   indices; [data-reveal="card"] deals them face-down from the shoe and turns
   them over as they land (CSS). On fine pointers the card tilts toward the
   pointer and its foil catches the light. */
import { reduced, coarse } from "./pref.js";

function span(className, text) {
  const el = document.createElement("span");
  el.className = className;
  el.setAttribute("aria-hidden", "true");
  if (text) el.textContent = text;
  return el;
}

function cornerIndex(rank, suit, extra = "") {
  const idx = span(`card-index mono${extra}`);
  idx.append(span("card-rank", rank), span("card-suit", suit));
  return idx;
}

function mountCard(card, i) {
  const face = card.dataset.card || "";
  const suit = face.slice(-1);
  const rank = face.slice(0, -1);
  card.classList.add("play-card");
  card.classList.toggle("is-red", "♥♦".includes(suit));
  card.style.setProperty("--deal", i);

  const back = span("card-back");
  back.append(span("card-back-mark mono", "D22"));
  card.prepend(back, span("card-foil"), cornerIndex(rank, suit));
  card.append(cornerIndex(rank, suit, " card-index--foot"));
}

function initHold(card) {
  let frame = 0;
  let x = 0.5;
  let y = 0.5;
  const paint = () => {
    frame = 0;
    card.style.setProperty("--cx", x.toFixed(3));
    card.style.setProperty("--cy", y.toFixed(3));
    /* ±5deg: enough to read as a card in hand, not enough to slip the pointer */
    card.style.setProperty("--tilt-x", `${((0.5 - y) * 10).toFixed(2)}deg`);
    card.style.setProperty("--tilt-y", `${((x - 0.5) * 10).toFixed(2)}deg`);
    /* Shadow falls away from the raised edge */
    card.style.setProperty("--lean", `${((0.5 - x) * 12).toFixed(1)}px`);
  };
  card.addEventListener("pointermove", (e) => {
    const r = card.getBoundingClientRect();
    if (!r.width || !r.height) return;
    x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    card.classList.add("is-held");
    if (!frame) frame = requestAnimationFrame(paint);
  });
  card.addEventListener("pointerleave", () => {
    card.classList.remove("is-held");
    ["--cx", "--cy", "--tilt-x", "--tilt-y", "--lean"].forEach((p) => card.style.removeProperty(p));
  });
}

/* Career hand: five face-down cards; turning all five makes a royal flush */
function initHand(root) {
  const cards = [...root.querySelectorAll(".hand-card")];
  const count = root.querySelector(".hand-count");
  const reset = root.querySelector(".hand-reset");
  const total = cards.length;

  const label = (card, i) => {
    if (card.classList.contains("is-turned")) card.removeAttribute("aria-label");
    else card.setAttribute("aria-label", `Card ${i + 1} of ${total}, face down. Turn it over.`);
  };

  const sync = () => {
    const turned = cards.filter((c) => c.classList.contains("is-turned")).length;
    const done = turned === total;
    root.classList.toggle("is-complete", done);
    count.textContent = done ? "Royal flush. That’s the career." : `${turned} of ${total} turned`;
    reset.hidden = turned === 0;
  };

  cards.forEach((card, i) => {
    card.parentElement.style.setProperty("--i", i);
    label(card, i);
    card.addEventListener("click", () => {
      const turned = card.classList.toggle("is-turned");
      card.setAttribute("aria-pressed", String(turned));
      label(card, i);
      sync();
    });
  });

  reset.addEventListener("click", () => {
    cards.forEach((card, i) => {
      /* Gather right to left so the fan closes like a hand being mucked */
      setTimeout(() => {
        card.classList.remove("is-turned");
        card.setAttribute("aria-pressed", "false");
        label(card, i);
      }, reduced ? 0 : (total - 1 - i) * 70);
    });
    setTimeout(() => {
      sync();
      cards[0].focus({ preventScroll: true });
    }, reduced ? 0 : total * 70);
  });

  if (!reduced && !coarse) cards.forEach(initHold);
}

export function initCards() {
  const cards = [...document.querySelectorAll("[data-card]")];
  cards.forEach(mountCard);
  if (!reduced && !coarse) cards.forEach(initHold);
  document.querySelectorAll("[data-career-hand]").forEach(initHand);
}
