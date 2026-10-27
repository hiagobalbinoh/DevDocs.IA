/* DevDocs IA — interações: brilho que segue o mouse, ripple, paleta Ctrl+K, contadores e placeholder animado. */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const q = (s, r) => (r || document).querySelector(s);
  const icon = (d) => `<svg class="ic" viewBox="0 0 24 24">${d}</svg>`;

  /* brilho que segue o mouse nos cartões (inclui os criados depois) */
  const SPOT = '.suggestion,.big-card,.library-card,.agent-overview-card,.metric-card,.doc-type,.task-card';
  document.addEventListener('mousemove', (e) => {
    const el = e.target.closest && e.target.closest(SPOT);
    if (el) { if (!el.classList.contains('fx-spot')) el.classList.add('fx-spot'); const r = el.getBoundingClientRect(); el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px'); }
    const col = q('.chat-column'); if (col && !reduce) { const r = col.getBoundingClientRect(); col.style.setProperty('--bx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%'); col.style.setProperty('--by', Math.max(-5, (e.clientY - r.top) / r.height * 40 - 10).toFixed(1) + '%'); }
  }, { passive: true });

  /* ripple nos botões principais */
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.primary-action,.new-chat,.send'); if (!b || reduce) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height), s = document.createElement('span');
    s.className = 'ripple'; s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 650);
  });

  /* contadores animados nas estatísticas da análise */
  function countUp(el) {
    const raw = el.textContent.replace(/\./g, '').replace(/\s/g, ''), target = parseInt(raw, 10); if (isNaN(target) || reduce) return;
    const t0 = performance.now(), dur = 700;
    (function tick(now) { const p = Math.min(1, (now - t0) / dur), v = Math.round(target * (1 - Math.pow(1 - p, 3))); el.textContent = v.toLocaleString('pt-BR'); if (p < 1) requestAnimationFrame(tick); })(t0);
  }
  const rep = q('#anReport');
  if (rep) new MutationObserver(() => { rep.querySelectorAll('.an-stat strong').forEach((el) => { if (!el.dataset.c) { el.dataset.c = '1'; countUp(el); } }); }).observe(rep, { childList: true });

  /* placeholder digitando */
  const ta = q('#userInput');
  if (ta && !reduce) {
    const base = ta.placeholder, lines = ['Analise o login desse projeto…', 'Gere um README para este repositório…', 'Faça uma auditoria de segurança deste código…', 'Há dados pessoais aqui? Verifique a LGPD…'];
    let li = 0, ci = 0, dir = 1, wait = 0;
    setInterval(() => {
      if (document.activeElement === ta || ta.value) { ta.placeholder = base; return; }
      if (wait > 0) { wait--; return; }
      ci += dir; ta.placeholder = lines[li].slice(0, ci) + (ci % 2 ? '▍' : '');
      if (ci >= lines[li].length) { dir = -1; wait = 18; ta.placeholder = lines[li]; }
      else if (ci <= 0) { dir = 1; li = (li + 1) % lines.length; wait = 4; }
    }, 55);
  }

  /* paleta de comandos (Ctrl/⌘ + K) */
  const VIEWS = [['chat', 'Chat com agentes', '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'], ['files', 'Análise de arquivos', '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'], ['docs', 'Documentos', '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>'], ['agents', 'Agentes', '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/>'], ['prompts', 'Prompts', '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3"/>'], ['tasks', 'Tarefas', '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'], ['integrations', 'Integrações', '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4"/>'], ['dashboard', 'Painel', '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'], ['settings', 'Configurações', '<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/>'], ['users', 'Usuários', '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>']];
  const back = document.createElement('div'); back.className = 'cmd-back';
  back.innerHTML = '<div class="cmd" role="dialog" aria-label="Paleta de comandos"><input id="cmdIn" placeholder="Ir para… ou executar uma ação" autocomplete="off"><ul id="cmdList"></ul><div class="foot"><span>↑↓ navegar</span><span>↵ abrir</span><span>esc fechar</span></div></div>';
  document.body.appendChild(back);
  let sel = 0, items = [];
  const actions = () => [
    ...VIEWS.filter(([v]) => !window.OrbitAuth || OrbitAuth.can(v)).map(([v, l, d]) => ({ label: l, hint: 'ir para', ic: d, run: () => showView(v) })),
    { label: 'Nova conversa', hint: 'ação', ic: '<path d="M12 5v14M5 12h14"/>', run: () => q('#newChat').click() },
    { label: 'Alternar tema claro/escuro', hint: 'ação', ic: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>', run: () => q('#themeBtn').click() },
    { label: 'Sair da conta', hint: 'ação', ic: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>', run: () => window.OrbitAuth && OrbitAuth.logout() }];
  function paint() {
    const term = q('#cmdIn').value.trim().toLowerCase();
    items = actions().filter((a) => a.label.toLowerCase().includes(term)); sel = Math.min(sel, Math.max(0, items.length - 1));
    q('#cmdList').innerHTML = items.length ? items.map((a, i) => `<li class="${i === sel ? 'on' : ''}" data-i="${i}">${icon(a.ic)}<span>${a.label}</span><small>${a.hint}</small></li>`).join('') : '<li>Nada encontrado</li>';
  }
  const open = () => { back.classList.add('open'); q('#cmdIn').value = ''; sel = 0; paint(); q('#cmdIn').focus(); };
  const close = () => back.classList.remove('open');
  const run = (i) => { const a = items[i]; if (a) { close(); a.run(); } };
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); back.classList.contains('open') ? close() : open(); return; }
    if (!back.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowDown') { e.preventDefault(); sel = (sel + 1) % items.length; paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = (sel - 1 + items.length) % items.length; paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
  });
  q('#cmdIn').addEventListener('input', () => { sel = 0; paint(); });
  q('#cmdList').addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) run(+li.dataset.i); });
  back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
  const tb = q('.top-actions');
  if (tb) { const b = document.createElement('button'); b.className = 'top-button'; b.innerHTML = 'Buscar <kbd>Ctrl K</kbd>'; b.addEventListener('click', open); tb.prepend(b); }
})();
