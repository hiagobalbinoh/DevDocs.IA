/* Orbit AI – extras: perfil/logout, painel de usuários, agentes DevDocs (com voz)
 * e sistema de análise de arquivos (arquivos, ZIP, PDF, DOCX, repositório GitHub). */
(function () {
  if (!window.OrbitAuth || !OrbitAuth.current()) return;
  const me = OrbitAuth.current();
  const q = (s, r) => (r || document).querySelector(s);
  const esc = (s) => escapeText(String(s));
  const FENCE = '```';
  const notify = (m) => showToast(m);

  /* ---------- estilos ---------- */
  const style = document.createElement('style');
  style.textContent = `
    .an-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}
    @media(max-width:900px){.an-grid{grid-template-columns:1fr}}
    .an-drop{border:1.5px dashed var(--line-strong);border-radius:13px;padding:26px 14px;text-align:center;color:var(--muted);font-size:12px;cursor:pointer;transition:.2s}
    .an-drop:hover,.an-drop.over{border-color:var(--brand);background:var(--brand-soft);color:var(--ink)}
    .an-drop b{display:block;color:var(--ink);font-size:13px;margin-bottom:4px}
    .an-row{display:flex;gap:8px;margin-top:10px}.an-row input,.an-row select,.an-field,.an-ta{flex:1;min-width:0;padding:9px 10px;border:1px solid var(--line-strong);border-radius:9px;background:var(--surface);color:var(--ink);font:12px "Inter",sans-serif}
    .an-ta{width:100%;min-height:64px;resize:vertical;margin-top:10px}
    .an-files{display:grid;gap:6px;margin-top:12px;max-height:230px;overflow:auto}
    .an-file{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--line);border-radius:9px;font-size:11px}
    .an-file span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.an-file small{color:var(--muted);white-space:nowrap}
    .an-file button{border:0;background:none;color:var(--muted);cursor:pointer;font-size:14px}
    .an-stat{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:4px 0 12px}
    .an-stat div{padding:10px;border:1px solid var(--line);border-radius:10px;text-align:center}.an-stat strong{display:block;font-size:17px}.an-stat small{color:var(--muted);font-size:10px}
    .an-find{display:grid;gap:6px;font-size:11px}.an-find div{padding:8px 10px;border-radius:9px;border:1px solid var(--line)}
    .an-find .high{border-left:3px solid #c4513c}.an-find .medium{border-left:3px solid #d9a03f}.an-find .low{border-left:3px solid #8a9a5b}
    .an-find small{color:var(--muted);display:block;margin-top:3px;word-break:break-all}
    .an-out{font-size:13px;line-height:1.65}.an-out h3,.an-out h4{margin:16px 0 6px}.an-out pre{overflow:auto;padding:12px;border-radius:9px;background:var(--surface-soft);font-size:12px}.an-out code{font-size:12px}
    .an-log{display:grid;gap:10px;max-height:340px;overflow:auto;margin:6px 0 10px}
    .an-msg{padding:10px 12px;border-radius:11px;font-size:12.5px;line-height:1.6;border:1px solid var(--line)}.an-msg.u{background:var(--brand-soft);margin-left:14%}.an-msg.a{background:var(--surface-soft);margin-right:6%}
    .an-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .user-table{width:100%;border-collapse:collapse;font-size:12px}.user-table th,.user-table td{padding:10px 8px;border-bottom:1px solid var(--line);text-align:left}.user-table select{padding:6px;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface);color:var(--ink)}
    .logout-btn{margin-left:auto;border:0;background:none;color:var(--sidebar-muted);cursor:pointer;font-size:15px}
  `;
  document.head.appendChild(style);

  /* ---------- perfil, logout, menu por perfil ---------- */
  const profile = q('.profile');
  if (profile) {
    const initials = me.username.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
    profile.innerHTML = `<div class="avatar">${esc(initials)}</div><div><strong>${esc(me.username)}</strong><small>${esc(OrbitAuth.ROLE_LABEL[me.role])}</small></div><button class="logout-btn" id="logoutBtn" title="Sair">sair</button>`;
    q('#logoutBtn').addEventListener('click', () => OrbitAuth.logout());
  }
  const navList = q('.nav-list');
  function updateTaskCount() { const c = q('.nav-item[data-view="tasks"] .count'); if (c) { c.textContent = scheduledTasks.length; c.style.display = scheduledTasks.length ? '' : 'none'; } }
  updateTaskCount();
  const filesNav = q('.nav-item[data-view="files"]');
  if (OrbitAuth.can('users') && navList) {
    const b = document.createElement('button');
    b.className = 'nav-item'; b.dataset.view = 'users'; b.innerHTML = '<svg class="ic" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> Usuários';
    b.addEventListener('click', () => showView('users')); navList.appendChild(b);
  }
  document.querySelectorAll('.nav-item[data-view]').forEach((b) => { if (!OrbitAuth.can(b.dataset.view)) b.style.display = 'none'; });
  const baseShowView = window.showView;
  window.showView = function (view) {
    if (!OrbitAuth.can(view)) { notify('Seu perfil não tem acesso a essa área'); return; }
    baseShowView(view);
    const ct = q('#conversationTitle');
    if (ct) {
      const names = { files: 'Análise de arquivos', docs: 'Documentos', agents: 'Agentes', prompts: 'Prompts', tasks: 'Tarefas', integrations: 'Integrações', dashboard: 'Painel', settings: 'Configurações', users: 'Usuários' };
      if (view !== 'chat' && names[view]) { if (!ct.dataset.nav) ct.dataset.chat = ct.textContent; ct.dataset.nav = '1'; ct.textContent = names[view]; }
      else if (view === 'chat' && ct.dataset.nav) { ct.textContent = ct.dataset.chat; delete ct.dataset.nav; }
    }
    if (view === 'users') renderUsers();
    if (view === 'docs') renderDocs();
    updateTaskCount();
  };

  /* ---------- painel de usuários ---------- */
  const usersSection = document.createElement('section');
  usersSection.className = 'page-view'; usersSection.id = 'usersView';
  usersSection.innerHTML = '<div class="page-heading"><div><span class="eyebrow"><i></i> Acesso</span><h1>Usuários e perfis</h1><p>Somente o dono (Hiago) gerencia os perfis de acesso.</p></div></div><div class="big-card"><table class="user-table"><thead><tr><th>Usuário</th><th>E-mail</th><th>Perfil</th><th></th></tr></thead><tbody id="usersBody"></tbody></table></div>';
  (q('#settingsView') || q('.chat-column')).after(usersSection);
  function renderUsers() {
    const actor = OrbitAuth.current();
    q('#usersBody').innerHTML = OrbitAuth.listUsers().map((u) => {
      const editable = OrbitAuth.canManage(actor, u);
      const opts = (u.role === 'super' ? ['super'] : ['manager', 'user']).map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${OrbitAuth.ROLE_LABEL[r]}</option>`).join('');
      return `<tr><td>${esc(u.username)}</td><td>${esc(u.email)}</td><td><select data-role="${u.id}" ${editable ? '' : 'disabled'}>${opts}</select></td><td>${editable ? `<button class="danger-action" data-del="${u.id}">Excluir</button>` : ''}</td></tr>`;
    }).join('');
  }
  usersSection.addEventListener('change', (e) => {
    const id = e.target.dataset.role; if (!id) return;
    try { OrbitAuth.setRole(id, e.target.value); notify('Perfil atualizado'); } catch (err) { notify(err.message); }
    renderUsers();
  });
  usersSection.addEventListener('click', (e) => {
    const id = e.target.dataset.del; if (!id || !confirm('Excluir este usuário?')) return;
    try { OrbitAuth.removeUser(id); notify('Usuário excluído'); } catch (err) { notify(err.message); }
    renderUsers();
  });

  /* ---------- voz dos agentes DevDocs ---------- */
  const VOICES = { 'Desenvolvedor': 'assets/audio/dev-intro.mp3', 'Assistente Jurídica': 'assets/audio/jur-intro.mp3' };
  let voice = null;
  function speak(src) { try { if (voice) voice.pause(); voice = new Audio(src); voice.play().catch(() => {}); } catch (e) { /* sem áudio */ } }
  [q('#agentGrid'), q('#agentOverview')].forEach((el) => el && el.addEventListener('click', () => { setTimeout(() => { if (VOICES[selectedAgent]) speak(VOICES[selectedAgent]); }, 0); }));

  /* ---------- análise de arquivos ---------- */
  const TEXT_BLOCK = /\.(png|jpe?g|gif|webp|ico|bmp|mp3|mp4|wav|ogg|mov|avi|woff2?|ttf|eot|otf|exe|dll|so|class|jar|bin|dat|db|sqlite|lock)$/i;
  const SKIP_PATH = /(^|\/)(node_modules|\.git|dist|build|vendor|__pycache__|\.next|\.idea|\.vscode)(\/|$)|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|composer\.lock)$|\.min\.(js|css)$/i;
  const MAX_FILE = 300000;
  let files = [];
  let lastReport = '', lastAnswer = '';
  let chatHistory = [];

  const view = q('#filesView');
  view.innerHTML = `
    <div class="page-heading"><div><span class="eyebrow"><i></i> Análise</span><h1>Análise de arquivos</h1><p>Envie arquivos, ZIP, PDF, DOCX ou um repositório do GitHub. Eu mapeio o projeto, procuro problemas e converso sobre o conteúdo.</p></div><button class="outline-action" id="anClear">Limpar tudo</button></div>
    <div class="an-grid">
      <div class="big-card">
        <div class="card-title"><div><span>1. Fontes</span><small>Tudo é lido no seu navegador</small></div></div>
        <div class="an-drop" id="anDrop"><b>Arraste arquivos aqui ou clique para escolher</b>código, texto, JSON, CSV, ZIP, PDF, DOCX…</div>
        <input type="file" id="anInput" multiple hidden>
        <div class="an-row"><input id="anRepo" placeholder="GitHub: usuario/repositorio ou URL"><button class="outline-action" id="anRepoBtn">Carregar</button></div>
        <textarea class="an-ta" id="anPaste" placeholder="Ou cole um trecho de código/texto e clique em Adicionar texto"></textarea>
        <div class="an-row"><button class="outline-action" id="anPasteBtn">Adicionar texto</button></div>
        <div class="an-files" id="anFiles"></div>
      </div>
      <div class="big-card">
        <div class="card-title"><div><span>2. Executar análise</span><small>Usa a chave e o modelo configurados no painel</small></div></div>
        <label class="setting-line">Tipo <select id="anMode" class="an-field"></select></label>
        <label class="setting-line">Profundidade <select id="anDepth" class="an-field"><option value="12000">Rápida (~12 mil caracteres)</option><option value="24000" selected>Normal (~24 mil)</option><option value="48000">Profunda (~48 mil)</option></select></label>
        <textarea class="an-ta" id="anCustom" placeholder="Pergunta ou instrução extra (opcional)"></textarea>
        <div class="an-actions"><button class="primary-action" id="anRun">Executar análise</button></div>
        <small style="display:block;margin-top:10px;color:var(--muted);font-size:11px">Em contas gratuitas da Groq use a profundidade Rápida se aparecer erro de limite.</small>
      </div>
    </div>
    <div class="big-card" id="anReportCard" hidden><div class="card-title"><div><span>Análise automática (sem IA)</span><small>Mapa do projeto e padrões suspeitos</small></div></div><div id="anReport"></div></div>
    <div class="big-card" id="anResultCard" hidden style="margin-top:14px"><div class="card-title"><div><span id="anResultTitle">Resultado</span><small id="anResultMeta"></small></div></div><div class="an-out" id="anOut"></div><div class="an-actions"><button class="outline-action" id="anCopy">Copiar</button><button class="outline-action" id="anDownload">Baixar .md</button></div></div>
    <div class="big-card" style="margin-top:14px"><div class="card-title"><div><span>3. Converse com os arquivos</span><small>O agente busca os trechos mais relevantes para cada pergunta</small></div></div><div class="an-log" id="fcLog"></div><div class="an-row"><input id="fcInput" placeholder="Ex.: onde fica a validação de senha? como corrigir?"><button class="primary-action" id="fcSend">Enviar</button></div></div>`;

  const MODES = {
    dev: { label: 'Desenvolvedor – visão geral do programa', agent: 'Desenvolvedor', prompt: 'Analise este projeto: objetivo, arquitetura e estrutura, tecnologias, fluxo principal, qualidade do código, bugs prováveis, melhorias priorizadas e quais arquivos modificar primeiro.' },
    sec: { label: 'Segurança', agent: 'Code Reviewer', prompt: 'Faça uma auditoria de segurança. Para cada problema informe severidade, arquivo, trecho envolvido e a correção recomendada. Considere os achados automáticos.' },
    bugs: { label: 'Caçar bugs', agent: 'Debugger', prompt: 'Encontre bugs e erros de lógica prováveis. Ordene por impacto, explique a causa raiz e proponha a correção mínima com código.' },
    jur: { label: 'Jurídico – LGPD', agent: 'Assistente Jurídica', prompt: 'Analise sob a LGPD: dados pessoais tratados, finalidade e base legal prováveis, riscos, lacunas e medidas de adequação recomendadas.' },
    doc: { label: 'Gerar documentação (README)', agent: 'Technical Writer', prompt: 'Escreva um README completo em Markdown: descrição, requisitos, instalação, uso, estrutura de pastas e pontos de atenção.' },
    sum: { label: 'Resumo executivo', agent: 'Summarizer Ultra', prompt: 'Resuma o conteúdo dos arquivos: pontos-chave, decisões, números, prazos e próximos passos.' },
    custom: { label: 'Somente minha pergunta', agent: 'Deep Analyst', prompt: 'Responda à pergunta do usuário com base nos arquivos.' }
  };
  q('#anMode').innerHTML = Object.entries(MODES).map(([k, m]) => `<option value="${k}">${m.label}</option>`).join('');
  q('#anMode').addEventListener('change', (e) => { if (e.target.value === 'jur') speak('assets/audio/jur-lgpd.mp3'); });

  const fmt = (n) => n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : n > 1024 ? Math.round(n / 1024) + ' KB' : n + ' B';
  const extOf = (p) => (p.split('/').pop().split('.').length > 1 ? p.split('.').pop().toLowerCase() : 'sem-ext');
  const loaded = {};
  function loadScript(url) {
    return loaded[url] || (loaded[url] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = url; s.onload = res; s.onerror = () => rej(new Error('Falha ao carregar biblioteca')); document.head.appendChild(s); }));
  }

  function addFile(path, text, source) {
    if (!text || !text.trim()) return;
    const truncated = text.length > MAX_FILE;
    if (truncated) text = text.slice(0, MAX_FILE);
    files = files.filter((f) => f.path !== path);
    files.push({ path, text, size: text.length, lines: text.split('\n').length, ext: extOf(path), truncated, source });
  }
  const looksBinary = (t) => /\u0000/.test(t.slice(0, 2000));

  async function ingest(fileList) {
    for (const file of fileList) {
      const name = file.webkitRelativePath || file.name, ext = extOf(name);
      try {
        if (ext === 'zip') {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
          const zip = await JSZip.loadAsync(file);
          for (const entry of Object.values(zip.files)) {
            if (entry.dir || SKIP_PATH.test(entry.name) || TEXT_BLOCK.test(entry.name)) continue;
            const t = await entry.async('string');
            if (!looksBinary(t)) addFile(entry.name, t, file.name);
          }
        } else if (ext === 'pdf') {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const pdf = await pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
          let out = '';
          for (let i = 1; i <= pdf.numPages; i++) { const page = await pdf.getPage(i); out += `\n[Página ${i}]\n` + (await page.getTextContent()).items.map((it) => it.str).join(' '); }
          addFile(name, out, 'pdf');
        } else if (ext === 'docx') {
          await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
          const zip = await JSZip.loadAsync(file);
          const xml = await zip.file('word/document.xml').async('string');
          addFile(name, xml.replace(/<\/w:p>/g, '\n').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'), 'docx');
        } else if (TEXT_BLOCK.test(name) || SKIP_PATH.test(name)) {
          continue;
        } else if (file.size <= 2000000) {
          const t = await file.text();
          if (!looksBinary(t)) addFile(name, t, 'upload');
        }
      } catch (err) { notify(`Não consegui ler ${name}: ${err.message}`); }
    }
    refresh();
  }

  const prio = (p) => { const n = p.toLowerCase().split('/').pop(); if (/^readme/.test(n)) return 100; if (/^(package\.json|composer\.json|requirements\.txt|pom\.xml|go\.mod|cargo\.toml|dockerfile|projeto)$/.test(n)) return 90; if (/^(index|main|app|server|login|connection|config)\./.test(n)) return 80; if (/\.(md|txt)$/.test(n)) return 40; if (/\.(css|svg|json|sql|csv)$/.test(n)) return 20; return 50; };

  async function loadRepo(value) {
    let m = value.trim().replace(/\.git$/, '').match(/github\.com\/([^/\s]+)\/([^/\s#?]+)/) || value.trim().match(/^([^/\s]+)\/([^/\s]+)$/);
    if (!m) return notify('Use o formato usuario/repositorio ou a URL do GitHub');
    const [, owner, repo] = m, token = localStorage.getItem('github_token');
    const headers = { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const btn = q('#anRepoBtn'); btn.disabled = true; btn.textContent = 'Carregando…';
    try {
      const meta = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!meta.ok) throw new Error(meta.status === 404 ? 'Repositório não encontrado (privado? configure o token no GitHub)' : `GitHub respondeu ${meta.status}`);
      const branch = (await meta.json()).default_branch;
      const tree = await (await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers })).json();
      const picks = (tree.tree || []).filter((n) => n.type === 'blob' && n.size <= 200000 && !SKIP_PATH.test(n.path) && !TEXT_BLOCK.test(n.path)).sort((a, b) => prio(b.path) - prio(a.path) || a.size - b.size).slice(0, 60);
      let done = 0;
      const get = async (n) => {
        const url = token ? `https://api.github.com/repos/${owner}/${repo}/contents/${n.path.split('/').map(encodeURIComponent).join('/')}?ref=${branch}` : `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${n.path.split('/').map(encodeURIComponent).join('/')}`;
        const r = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw+json' } : {} });
        if (r.ok) { const t = await r.text(); if (!looksBinary(t)) addFile(`${repo}/${n.path}`, t, 'github'); }
        btn.textContent = `Carregando ${++done}/${picks.length}`;
      };
      for (let i = 0; i < picks.length; i += 6) await Promise.all(picks.slice(i, i + 6).map(get));
      notify(`${done} arquivos de ${owner}/${repo} carregados${tree.truncated ? ' (árvore truncada)' : ''}`);
      refresh();
    } catch (err) { notify(err.message); } finally { btn.disabled = false; btn.textContent = 'Carregar'; }
  }

  /* análise estática, sem IA */
  const RULES = [
    ['high', 'Possível segredo/chave exposta', /(gsk_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN (RSA |EC )?PRIVATE KEY-----)/],
    ['high', 'Uso de eval()', /\beval\s*\(/],
    ['medium', 'Senha fixa no código', /(password|senha|passwd|pwd)\s*[:=]\s*['"][^'"\s]{3,}['"]/i],
    ['medium', 'SQL montado com entrada do usuário', /\b(SELECT|INSERT|UPDATE|DELETE)\b[^\n]{0,80}(\$_(GET|POST|REQUEST)|['"]\s*[.+]\s*\$?\w+)/i],
    ['medium', 'innerHTML / document.write (risco de XSS)', /\.innerHTML\s*\+?=|document\.write\s*\(/],
    ['medium', 'Hash fraco (md5/sha1)', /\b(md5|sha1)\s*\(/i],
    ['medium', 'Verificação de senha suspeita (compara com o próprio hash)', /\$hash\s*=\s*password_hash\([^;]*;[\s\S]{0,1500}password_verify\([^,]+,\s*\$hash\)/],
    ['low', 'TODO / FIXME pendente', /\b(TODO|FIXME|HACK|XXX)\b/],
    ['low', 'Debug esquecido (console.log, var_dump, print_r)', /\b(console\.log|var_dump|print_r)\s*\(/]
  ];
  function staticAnalysis() {
    const byExt = {}; let lines = 0;
    files.forEach((f) => { byExt[f.ext] = byExt[f.ext] || { n: 0, l: 0 }; byExt[f.ext].n++; byExt[f.ext].l += f.lines; lines += f.lines; });
    const findings = [];
    RULES.forEach(([sev, label, re]) => {
      const hits = [];
      files.forEach((f) => {
        if (label.startsWith('Verificação')) { if (re.test(f.text)) hits.push(`${f.path}`); return; }
        f.text.split('\n').forEach((ln, i) => { if (re.test(ln)) hits.push(`${f.path}:${i + 1}`); });
      });
      if (hits.length) findings.push({ sev, label, count: hits.length, where: hits.slice(0, 4) });
    });
    return { byExt, lines, findings };
  }
  function reportMarkdown(a) {
    return `Arquivos: ${files.length} | Linhas: ${a.lines}\nPor tipo: ${Object.entries(a.byExt).map(([e, v]) => `${e}=${v.n}`).join(', ')}\nAchados automáticos:\n` + (a.findings.length ? a.findings.map((f) => `- [${f.sev}] ${f.label} (${f.count}x) ex.: ${f.where.join('; ')}`).join('\n') : '- nenhum padrão suspeito encontrado');
  }

  function refresh() {
    q('#anFiles').innerHTML = files.map((f, i) => `<div class="an-file"><span title="${esc(f.path)}">${esc(f.path)}</span><small>${f.lines} lin · ${fmt(f.size)}${f.truncated ? ' · cortado' : ''}</small><button data-rm="${i}" title="Remover">×</button></div>`).join('');
    const card = q('#anReportCard');
    if (!files.length) { card.hidden = true; lastReport = ''; return; }
    const a = staticAnalysis(); lastReport = reportMarkdown(a); card.hidden = false;
    const top = Object.entries(a.byExt).sort((x, y) => y[1].l - x[1].l).slice(0, 4).map(([e]) => e).join(', ');
    q('#anReport').innerHTML = `<div class="an-stat"><div><strong>${files.length}</strong><small>arquivos</small></div><div><strong>${a.lines.toLocaleString('pt-BR')}</strong><small>linhas</small></div><div><strong>${Object.keys(a.byExt).length}</strong><small>tipos (${esc(top)})</small></div><div><strong>${a.findings.length}</strong><small>alertas</small></div></div>` +
      `<div class="an-find">${a.findings.length ? a.findings.map((f) => `<div class="${f.sev}"><strong>${esc(f.label)}</strong> — ${f.count}x<small>${f.where.map(esc).join(' · ')}</small></div>`).join('') : '<div class="low">Nenhum padrão suspeito encontrado nas regras automáticas.</div>'}</div>`;
  }

  function contextFor(budget, question) {
    const tree = files.slice(0, 200).map((f) => `- ${f.path} (${f.lines} linhas)`).join('\n');
    let out = `ESTRUTURA (${files.length} arquivos):\n${tree}\n\n${lastReport}\n\nCONTEÚDO:\n`, left = budget - out.length;
    let ranked = files.slice();
    if (question) {
      const words = [...new Set(question.toLowerCase().match(/[a-zà-ú0-9_]{3,}/g) || [])];
      const score = (f) => words.reduce((s, w) => s + (f.path.toLowerCase().includes(w) ? 5 : 0) + Math.min(8, (f.text.toLowerCase().split(w).length - 1)), 0);
      ranked.sort((a, b) => score(b) - score(a));
    } else ranked.sort((a, b) => prio(b.path) - prio(a.path) || a.size - b.size);
    for (const f of ranked) {
      if (left < 400) break;
      const slice = Math.min(f.text.length, 6000, left - 120);
      out += `\n### ${f.path}\n${FENCE}\n${f.text.slice(0, slice)}${slice < f.text.length ? '\n…[truncado]' : ''}\n${FENCE}\n`;
      left = budget - out.length;
    }
    return out;
  }

  async function groqStream(messages, onToken, signal) {
    const key = (q('#apiKey').value || localStorage.getItem('groq_api_key') || '').trim();
    if (!key) throw new Error('Configure sua chave Groq nas configurações');
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', signal, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model: q('#reasoningModel').value, messages, stream: true, temperature: 0.3 }) });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Erro ${res.status}`); }
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '', all = '';
    for (;;) {
      const p = await reader.read(); if (p.done) break; buf += dec.decode(p.value, { stream: true });
      const parts = buf.split('\n'); buf = parts.pop() || '';
      for (const line of parts) {
        const d = line.trim().replace(/^data:\s*/, ''); if (!d || d === '[DONE]') continue;
        try { const t = JSON.parse(d).choices?.[0]?.delta?.content; if (t) { all += t; onToken(all); } } catch (e) { /* fragmento */ }
      }
    }
    return all;
  }
  const sysPrompt = (name) => { const a = agents.find((x) => x.name === name); return a ? agentSystemPrompt(a) : 'Você é um analista técnico. Responda em português brasileiro e não invente dados.'; };

  let running = null;
  async function runAnalysis() {
    if (!files.length) return notify('Adicione arquivos antes de analisar');
    const mode = MODES[q('#anMode').value], extra = q('#anCustom').value.trim();
    if (q('#anMode').value === 'custom' && !extra) return notify('Escreva sua pergunta');
    if (running) { running.abort(); return; }
    const btn = q('#anRun'); btn.textContent = '■ Parar'; running = new AbortController();
    q('#anResultCard').hidden = false; q('#anResultTitle').textContent = mode.label; q('#anResultMeta').textContent = `${files.length} arquivos · modelo ${q('#reasoningModel').value}`;
    const out = q('#anOut'); out.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>';
    try {
      const budget = parseInt(q('#anDepth').value, 10);
      const user = `${mode.prompt}${extra ? `\n\nInstrução do usuário: ${extra}` : ''}\n\n${contextFor(budget, extra)}`;
      lastAnswer = await groqStream([{ role: 'system', content: sysPrompt(mode.agent) }, { role: 'user', content: user }], (t) => { out.textContent = t; }, running.signal);
      out.innerHTML = renderMarkdown(lastAnswer || 'Sem conteúdo na resposta.');
    } catch (err) { out.textContent = err.name === 'AbortError' ? (lastAnswer ? '' : 'Análise interrompida.') : `Erro: ${err.message}`; if (err.name !== 'AbortError') notify(err.message); }
    finally { running = null; btn.textContent = 'Executar análise'; }
  }

  let chatBusy = false;
  async function askFiles() {
    const input = q('#fcInput'), text = input.value.trim(); if (!text || chatBusy) return;
    if (!files.length) return notify('Adicione arquivos antes de conversar');
    chatBusy = true; input.value = '';
    const log = q('#fcLog');
    log.insertAdjacentHTML('beforeend', `<div class="an-msg u">${esc(text)}</div>`);
    const bubble = document.createElement('div'); bubble.className = 'an-msg a'; bubble.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>'; log.appendChild(bubble); log.scrollTop = log.scrollHeight;
    try {
      const sys = sysPrompt(MODES[q('#anMode').value].agent) + ' Responda usando SOMENTE os arquivos fornecidos; cite o arquivo e, quando possível, a linha. Se a informação não estiver nos arquivos, diga isso.';
      const msgs = [{ role: 'system', content: sys }, ...chatHistory.slice(-6), { role: 'user', content: `${contextFor(10000, text)}\n\nPERGUNTA: ${text}` }];
      const answer = await groqStream(msgs, (t) => { bubble.textContent = t; log.scrollTop = log.scrollHeight; });
      bubble.innerHTML = renderMarkdown(answer || 'Sem resposta.');
      chatHistory.push({ role: 'user', content: text }, { role: 'assistant', content: answer });
    } catch (err) { bubble.textContent = `Erro: ${err.message}`; }
    finally { chatBusy = false; log.scrollTop = log.scrollHeight; }
  }

  /* ---------- eventos ---------- */
  const drop = q('#anDrop'), inp = q('#anInput');
  drop.addEventListener('click', () => inp.click());
  inp.addEventListener('change', () => { ingest([...inp.files]); inp.value = ''; });
  ['dragover', 'dragenter'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => ingest([...e.dataTransfer.files]));
  q('#anRepoBtn').addEventListener('click', () => loadRepo(q('#anRepo').value));
  q('#anRepo').addEventListener('keydown', (e) => { if (e.key === 'Enter') loadRepo(q('#anRepo').value); });
  q('#anPasteBtn').addEventListener('click', () => { const t = q('#anPaste').value; if (!t.trim()) return; addFile(`texto-colado-${files.length + 1}.txt`, t, 'colado'); q('#anPaste').value = ''; refresh(); });
  q('#anFiles').addEventListener('click', (e) => { const i = e.target.dataset.rm; if (i === undefined) return; files.splice(+i, 1); refresh(); });
  q('#anClear').addEventListener('click', () => { files = []; chatHistory = []; lastAnswer = ''; q('#fcLog').innerHTML = ''; q('#anResultCard').hidden = true; refresh(); });
  q('#anRun').addEventListener('click', runAnalysis);
  q('#fcSend').addEventListener('click', askFiles);
  q('#fcInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') askFiles(); });
  q('#anCopy').addEventListener('click', () => { navigator.clipboard.writeText(lastAnswer).then(() => notify('Copiado')); });
  q('#anDownload').addEventListener('click', () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([lastAnswer], { type: 'text/markdown' })); a.download = 'analise-orbit.md'; a.click(); URL.revokeObjectURL(a.href); });
  const upload = q('#uploadPageFile'); if (upload) upload.addEventListener('click', () => inp.click());

  /* ---------- documentos ---------- */
  const DOC_TYPES = {
    readme: { label: 'README do projeto', icon: 'README.md', agent: 'Technical Writer', prompt: 'Escreva um README.md completo em Markdown: descrição, requisitos, instalação, uso, estrutura de pastas e pontos de atenção.' },
    tecnica: { label: 'Documentação técnica', icon: 'TECNICA.md', agent: 'Desenvolvedor', prompt: 'Escreva a documentação técnica: visão geral, arquitetura, módulos e arquivos principais, fluxos, dependências, configuração e pontos de atenção.' },
    guia: { label: 'Guia de instalação e uso', icon: 'GUIA.md', agent: 'Technical Writer', prompt: 'Escreva um guia passo a passo de instalação, configuração e uso, com pré-requisitos, comandos e solução de problemas.' },
    seguranca: { label: 'Relatório de segurança', icon: 'SEGURANCA.md', agent: 'Code Reviewer', prompt: 'Escreva um relatório de segurança: resumo, achados (severidade, arquivo, descrição e correção) e plano de correção priorizado. Considere os achados automáticos.' },
    lgpd: { label: 'Relatório LGPD', icon: 'LGPD.md', agent: 'Assistente Jurídica', prompt: 'Escreva um relatório de conformidade com a LGPD: dados pessoais tratados, finalidade e base legal prováveis, riscos, lacunas e plano de adequação. Informe que não substitui parecer jurídico.' },
    resumo: { label: 'Resumo executivo', icon: 'RESUMO.md', agent: 'Summarizer Ultra', prompt: 'Escreva um resumo executivo de uma página: o que é o projeto, estado atual, riscos principais e próximos passos.' }
  };
  let docs = []; try { docs = JSON.parse(localStorage.getItem('orbit_docs') || '[]'); } catch (e) { docs = []; }
  let openDocId = null, docBusy = false;
  const saveDocs = () => { docs = docs.slice(0, 30); try { localStorage.setItem('orbit_docs', JSON.stringify(docs)); } catch (e) { notify('Sem espaço para salvar; baixe o documento'); } };

  const dstyle = document.createElement('style');
  dstyle.textContent = '.doc-types{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}@media(max-width:900px){.doc-types{grid-template-columns:1fr 1fr}}.doc-type{display:flex;flex-direction:column;gap:4px;text-align:left;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--surface);color:var(--ink);cursor:pointer;transition:.2s}.doc-type:hover{border-color:var(--brand);transform:translateY(-2px)}.doc-type b{font-size:18px;color:var(--brand-dark)}.doc-type strong{font-size:12.5px}.doc-type small{color:var(--muted);font-size:11px}.doc-type:disabled{opacity:.55;cursor:wait}.doc-item{display:flex;justify-content:space-between;gap:8px;padding:9px 10px;border:1px solid var(--line);border-radius:9px;font-size:11.5px;cursor:pointer;margin-bottom:6px}.doc-item.on{border-color:var(--brand);background:var(--brand-soft)}.doc-item small{color:var(--muted);display:block}.doc-empty{color:var(--muted);font-size:12px;padding:8px 2px}';
  document.head.appendChild(dstyle);

  const docsView = document.createElement('section');
  docsView.className = 'page-view'; docsView.id = 'docsView';
  docsView.innerHTML = '<div class="page-heading"><div><span class="eyebrow"><i></i> Documentos</span><h1>Documentos do projeto</h1><p>Gere documentos prontos a partir dos arquivos carregados em <b>Análise de arquivos</b>.</p></div><button class="primary-action" id="dcAll">Gerar todos</button></div>' +
    '<div class="big-card"><div class="card-title"><div><span>Escolha o documento</span><small id="dcSource"></small></div></div><div class="doc-types" id="dcTypes"></div></div>' +
    '<div class="an-grid" style="margin-top:14px"><div class="big-card"><div class="card-title"><div><span>Gerados</span><small>Salvos neste navegador</small></div></div><div id="dcList"></div></div>' +
    '<div class="big-card"><div class="card-title"><div><span id="dcTitle">Visualização</span><small id="dcMeta"></small></div></div><div class="an-out" id="dcView"><div class="doc-empty">Gere ou selecione um documento para visualizar.</div></div><div class="an-actions" id="dcActions" hidden><button class="outline-action" id="dcMd">Baixar .md</button><button class="outline-action" id="dcHtml">Baixar .html</button><button class="outline-action" id="dcPrint">Imprimir / PDF</button><button class="danger-action" id="dcDel">Excluir</button></div></div></div>';
  view.after(docsView);
  q('#dcTypes').innerHTML = Object.entries(DOC_TYPES).map(([k, d]) => `<button class="doc-type" data-type="${k}"><b>${d.icon}</b><strong>${d.label}</strong><small>Agente: ${esc(d.agent)}</small></button>`).join('');

  function renderDocs() {
    q('#dcSource').textContent = files.length ? `${files.length} arquivos carregados como fonte` : 'Nenhum arquivo carregado — vá em Análise de arquivos primeiro';
    q('#dcList').innerHTML = docs.length ? docs.map((d) => `<div class="doc-item ${d.id === openDocId ? 'on' : ''}" data-doc="${d.id}"><div><strong>${esc(d.title)}</strong><small>${new Date(d.created).toLocaleString('pt-BR')}</small></div></div>`).join('') : '<div class="doc-empty">Nenhum documento gerado ainda.</div>';
    const cur = docs.find((d) => d.id === openDocId);
    q('#dcActions').hidden = !cur;
    if (cur) { q('#dcTitle').textContent = cur.title; q('#dcMeta').textContent = new Date(cur.created).toLocaleString('pt-BR'); q('#dcView').innerHTML = renderMarkdown(cur.content); }
  }
  async function genDoc(key) {
    const d = DOC_TYPES[key];
    if (!files.length) { notify('Carregue arquivos na Análise de arquivos primeiro'); return false; }
    docBusy = true; document.querySelectorAll('.doc-type,#dcAll').forEach((b) => (b.disabled = true));
    q('#dcTitle').textContent = d.label; q('#dcMeta').textContent = 'Gerando…'; q('#dcActions').hidden = true;
    const out = q('#dcView'); out.innerHTML = '<div class="typing"><i></i><i></i><i></i></div>';
    try {
      const budget = parseInt(q('#anDepth').value, 10) || 24000;
      const user = `${d.prompt}\n\nResponda apenas com o documento em Markdown, sem comentários fora dele. Não invente informações que não estejam nos arquivos.\n\n${contextFor(budget, '')}`;
      const text = await groqStream([{ role: 'system', content: sysPrompt(d.agent) }, { role: 'user', content: user }], (t) => { out.textContent = t; });
      if (!text.trim()) throw new Error('A IA não devolveu conteúdo');
      const doc = { id: String(Date.now()), type: key, title: d.label, created: new Date().toISOString(), content: text };
      docs.unshift(doc); saveDocs(); openDocId = doc.id; renderDocs(); return true;
    } catch (err) { out.textContent = `Erro: ${err.message}`; notify(err.message); return false; }
    finally { docBusy = false; document.querySelectorAll('.doc-type,#dcAll').forEach((b) => (b.disabled = false)); }
  }
  const slug = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const download = (name, content, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([content], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); };
  const htmlPage = (d) => `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${esc(d.title)}</title><style>body{font:15px/1.7 system-ui,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#1b1b16}h3,h4{margin:22px 0 6px}pre{background:#f3f2ec;padding:12px;border-radius:8px;overflow:auto}code{font-size:13px}blockquote{border-left:3px solid #9bab55;margin:0;padding-left:14px;color:#555}footer{margin-top:40px;color:#888;font-size:12px}</style></head><body><h2>${esc(d.title)}</h2>${renderMarkdown(d.content)}<footer>Gerado por DevDocs IA em ${new Date(d.created).toLocaleString('pt-BR')}</footer></body></html>`;
  q('#dcTypes').addEventListener('click', (e) => { const b = e.target.closest('[data-type]'); if (b && !docBusy) genDoc(b.dataset.type); });
  q('#dcAll').addEventListener('click', async () => { if (docBusy) return; for (const k of Object.keys(DOC_TYPES)) { if (!(await genDoc(k))) break; } });
  q('#dcList').addEventListener('click', (e) => { const i = e.target.closest('[data-doc]'); if (!i) return; openDocId = i.dataset.doc; renderDocs(); });
  const curDoc = () => docs.find((d) => d.id === openDocId);
  q('#dcMd').addEventListener('click', () => { const d = curDoc(); if (d) download(`${slug(d.title)}.md`, d.content, 'text/markdown'); });
  q('#dcHtml').addEventListener('click', () => { const d = curDoc(); if (d) download(`${slug(d.title)}.html`, htmlPage(d), 'text/html'); });
  q('#dcPrint').addEventListener('click', () => { const d = curDoc(); if (!d) return; const w = window.open('', '_blank'); if (!w) return notify('Libere pop-ups para imprimir'); w.document.write(htmlPage(d)); w.document.close(); w.focus(); setTimeout(() => w.print(), 300); });
  q('#dcDel').addEventListener('click', () => { if (!openDocId || !confirm('Excluir este documento?')) return; docs = docs.filter((d) => d.id !== openDocId); openDocId = null; saveDocs(); q('#dcView').innerHTML = '<div class="doc-empty">Gere ou selecione um documento para visualizar.</div>'; q('#dcTitle').textContent = 'Visualização'; q('#dcMeta').textContent = ''; renderDocs(); });
  renderDocs();
})();
