// Renders the `cats` / `qs` data from content.js into #tabs and #qlist.

// Groups without a `cat` belong to the category of the group before them.
let lastCat = cats[0];
qs.forEach(g => { g.cat = (g.cat || lastCat).trim(); lastCat = g.cat; });

// Categories used in qs but missing from `cats` still get a tab.
const allCats = [...cats];
qs.forEach(g => { if (!allCats.includes(g.cat)) allCats.push(g.cat); });

const answerOf = n => (n.a ?? n.answer ?? '').trim();

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function tipBox(tip) {
  return el('div', 'tip-box', '<b>Tip:</b> ' + tip);
}

// Nested follow-up: question toggles its answer and its own follow-ups.
function renderNode(n) {
  const node = el('div', 'node');
  const q = el('div', 'node-q', '▸ ' + n.q.trim());
  const body = el('div', 'node-a');
  const ans = answerOf(n);
  if (ans) body.appendChild(el('div', 'answer', ans));
  if (n.tip) body.appendChild(tipBox(n.tip));
  (n.children || []).forEach(c => body.appendChild(renderNode(c)));

  q.addEventListener('click', () => {
    const open = body.style.display === 'block';
    body.style.display = open ? 'none' : 'block';
    q.innerHTML = (open ? '▸ ' : '▾ ') + n.q.trim();
  });
  node.append(q, body);
  return node;
}

function renderCard(n, num) {
  const card = el('div', 'q-card');
  const header = el('div', 'q-header');
  header.append(
    el('span', 'q-num', String(num)),
    el('span', 'q-text', n.q.trim()),
    el('span', 'q-arrow', '▶')
  );
  const body = el('div', 'q-body');
  const ans = answerOf(n);
  if (ans) body.appendChild(el('div', 'answer', ans));
  if (n.tip) body.appendChild(tipBox(n.tip));
  (n.children || []).forEach(c => body.appendChild(renderNode(c)));

  header.addEventListener('click', () => card.classList.toggle('open'));
  card.append(header, body);
  return card;
}

function renderList(cat) {
  const list = document.getElementById('qlist');
  list.innerHTML = '';
  const groups = qs.filter(g => g.cat === cat);
  let num = 1;
  groups.forEach(g => {
    // A tab with several groups (e.g. one per company) gets a heading per group.
    if (groups.length > 1) list.appendChild(el('div', 'subtitle', g.q.trim()));
    const intro = answerOf(g);
    if (intro) list.appendChild(el('div', 'answer', intro));
    (g.children || []).forEach(c => list.appendChild(renderCard(c, num++)));
  });
  if (window.Prism) Prism.highlightAllUnder(list);
}

function renderTabs() {
  const tabs = document.getElementById('tabs');
  allCats.forEach((cat, i) => {
    const count = qs.filter(g => g.cat === cat)
      .reduce((s, g) => s + (g.children || []).length, 0);
    const btn = el('button', 'cat-tab' + (i === 0 ? ' active' : ''), `${cat} (${count})`);
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      renderList(cat);
    });
    tabs.appendChild(btn);
  });
}

renderTabs();
renderList(allCats[0]);
