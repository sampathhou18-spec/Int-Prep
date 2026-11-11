// Renders the subjects listed in topics.js.
//  - Markdown subjects (content/*.md):  # Section tab   ## Question card   ### Follow-up
//  - The legacy subject uses the `cats` / `qs` data from content.js.

const $ = sel => document.querySelector(sel);

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

// Collapsible follow-up: ▸ title, click to show its body.
function toggleNode(titleHtml, bodyEls) {
  const node = el('div', 'node');
  const q = el('div', 'node-q');
  const body = el('div', 'node-a');
  const set = open => {
    body.style.display = open ? 'block' : 'none';
    q.innerHTML = (open ? '▾ ' : '▸ ') + titleHtml;
  };
  body.append(...bodyEls);
  set(false);
  q.addEventListener('click', () => set(body.style.display !== 'block'));
  node.append(q, body);
  return node;
}

// ---------- Markdown subjects ----------

// Split lines at headings with exactly `level` #'s, ignoring lines inside ``` code blocks.
function splitAt(lines, level) {
  const re = new RegExp('^#{' + level + '}\\s+(.*)$');
  const parts = [{ title: null, lines: [] }];
  let fence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const m = !fence && line.match(re);
    if (m) parts.push({ title: m[1].trim(), lines: [] });
    else parts[parts.length - 1].lines.push(line);
  }
  return parts;
}

const mdBlock = lines => el('div', 'answer md', marked.parse(lines.join('\n')));
const isBlank = lines => !lines.join('').trim();

function mdCard(title, lines) {
  const [main, ...followUps] = splitAt(lines, 3);
  return {
    title: marked.parseInline(title),
    text: (title + '\n' + lines.join('\n')).toLowerCase(),
    body: () => [
      ...(isBlank(main.lines) ? [] : [mdBlock(main.lines)]),
      ...followUps.map(f => toggleNode(marked.parseInline(f.title), [mdBlock(f.lines)])),
    ],
  };
}

function parseMarkdown(text) {
  text = text.replace(/<!--[\s\S]*?-->/g, '');   // comments are notes for you, not the page
  const [pre, ...secs] = splitAt(text.split(/\r?\n/), 1);
  return {
    intro: isBlank(pre.lines) ? '' : marked.parse(pre.lines.join('\n')),
    sections: secs.map(s => {
      const [intro, ...cards] = splitAt(s.lines, 2);
      const blocks = [];
      if (!isBlank(intro.lines)) blocks.push({ intro: marked.parse(intro.lines.join('\n')) });
      cards.forEach(c => blocks.push({ card: mdCard(c.title, c.lines) }));
      return { title: s.title, blocks };
    }),
  };
}

// ---------- Legacy subject (content.js) ----------

const answerOf = n => (n.a ?? n.answer ?? '').trim();
const allText = n => [n.q, answerOf(n), n.tip || '', ...(n.children || []).map(allText)].join(' ');

function legacyBody(n) {
  const els = [];
  const ans = answerOf(n);
  if (ans) els.push(el('div', 'answer', ans));
  if (n.tip) els.push(el('div', 'tip-box', '<b>Tip:</b> ' + n.tip));
  (n.children || []).forEach(c => els.push(toggleNode(c.q.trim(), legacyBody(c))));
  return els;
}

function legacyTopic() {
  // Groups without a `cat` belong to the category of the group before them.
  let lastCat = cats[0];
  qs.forEach(g => { g.cat = (g.cat || lastCat).trim(); lastCat = g.cat; });
  const allCats = [...cats];
  qs.forEach(g => { if (!allCats.includes(g.cat)) allCats.push(g.cat); });

  return {
    intro: '',
    sections: allCats.map(cat => {
      const groups = qs.filter(g => g.cat === cat);
      const blocks = [];
      groups.forEach(g => {
        // A tab with several groups (e.g. one per company) gets a heading per group.
        if (groups.length > 1) blocks.push({ heading: g.q.trim() });
        const intro = answerOf(g);
        if (intro) blocks.push({ intro });
        (g.children || []).forEach(c => blocks.push({
          card: { title: c.q.trim(), text: allText(c).toLowerCase(), body: () => legacyBody(c) },
        }));
      });
      return { title: cat, blocks };
    }),
  };
}

// ---------- Page ----------

const loaded = {};
const cur = { topic: topics[0], section: 0, data: null };

async function load(t) {
  if (loaded[t.id]) return loaded[t.id];
  if (t.legacy) return (loaded[t.id] = legacyTopic());
  const res = await fetch(t.file, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${t.file} (${res.status})`);
  return (loaded[t.id] = parseMarkdown(await res.text()));
}

function renderCard(card, num) {
  const c = el('div', 'q-card');
  const header = el('div', 'q-header');
  header.append(el('span', 'q-num', String(num)), el('span', 'q-text', card.title), el('span', 'q-arrow', '▶'));
  const body = el('div', 'q-body');
  body.append(...card.body());
  header.addEventListener('click', () => c.classList.toggle('open'));
  c.append(header, body);
  return c;
}

const cardCount = sec => sec.blocks.filter(b => b.card).length;

function renderTopics() {
  const bar = $('#topics');
  bar.innerHTML = '';
  topics.forEach(t => {
    const b = el('button', 'topic-tab' + (t === cur.topic ? ' active' : ''), t.title);
    b.addEventListener('click', () => select(t, 0));
    bar.appendChild(b);
  });
}

function renderSections() {
  const tabs = $('#tabs');
  tabs.innerHTML = '';
  cur.data.sections.forEach((sec, i) => {
    const b = el('button', 'cat-tab' + (i === cur.section ? ' active' : ''), `${sec.title} (${cardCount(sec)})`);
    b.addEventListener('click', () => select(cur.topic, i));
    tabs.appendChild(b);
  });
}

function renderList() {
  const list = $('#qlist');
  list.innerHTML = '';
  const query = $('#search').value.trim().toLowerCase();
  $('#tabs').classList.toggle('dimmed', !!query);

  const secs = query ? cur.data.sections : [cur.data.sections[cur.section]].filter(Boolean);
  let total = 0;
  secs.forEach(sec => {
    const blocks = query ? sec.blocks.filter(b => b.card && b.card.text.includes(query)) : sec.blocks;
    if (query && blocks.length) list.appendChild(el('div', 'group-title', sec.title));
    let num = 1;
    blocks.forEach(b => {
      if (b.heading) list.appendChild(el('div', 'group-title', b.heading));
      else if (b.intro) list.appendChild(el('div', 'answer md intro', b.intro));
      else { list.appendChild(renderCard(b.card, num++)); total++; }
    });
  });
  if (query && !total) list.appendChild(el('div', 'empty', 'No matches in ' + cur.topic.title + '.'));
  if (!query && !secs.length) list.appendChild(el('div', 'empty', 'Nothing here yet — add a "# Section" to the file.'));
  if (window.Prism) Prism.highlightAllUnder(list);
}

async function select(topic, section) {
  if (topic !== cur.topic) $('#search').value = '';
  cur.topic = topic;
  cur.section = section;
  history.replaceState(null, '', `#${topic.id}/${section}`);
  renderTopics();
  try {
    cur.data = await load(topic);
  } catch (err) {
    $('#intro').innerHTML = '';
    $('#tabs').innerHTML = '';
    $('#qlist').innerHTML = '';
    $('#qlist').appendChild(el('div', 'empty',
      err.message + '<br>If you opened index.html directly from disk, serve the folder instead (e.g. VS Code "Live Server").'));
    return;
  }
  if (cur.topic !== topic) return; // user clicked another subject while this one loaded
  cur.section = Math.min(section, Math.max(0, cur.data.sections.length - 1));
  $('#intro').innerHTML = cur.data.intro;
  renderSections();
  renderList();
}

$('#search').addEventListener('input', renderList);
$('#toggleAll').addEventListener('click', () => {
  const cards = [...document.querySelectorAll('.q-card')];
  const open = !cards.every(c => c.classList.contains('open'));
  cards.forEach(c => c.classList.toggle('open', open));
});

// Start from the URL hash (#javascript/2) so links and refreshes keep your place.
function selectFromHash() {
  const [hashTopic, hashSection] = decodeURIComponent(location.hash.slice(1)).split('/');
  select(topics.find(t => t.id === hashTopic) || topics[0], parseInt(hashSection, 10) || 0);
}
window.addEventListener('hashchange', selectFromHash);
selectFromHash();
