/* Orbit AI – autenticação com perfis (super, admin, manager, user)
 * Evolução do login-multi (PHP) para o navegador. Senhas com PBKDF2-SHA256 + salt.
 * ATENÇÃO: tudo fica no localStorage; serve para organizar acesso local,
 * não substitui um backend real. */
(function () {
  const USERS_KEY = 'orbit_users', SESSION_KEY = 'orbit_session';
  const OWNER = 'hiago'; // único dono/administrador
  const ROLES = ['super', 'manager', 'user'];
  const ROLE_LABEL = { super: 'Dono (Hiago)', manager: 'Gerente', user: 'Usuário' };
  const VIEWS_BY_ROLE = {
    user: ['chat', 'dashboard', 'prompts', 'agents', 'tasks', 'files', 'docs'],
    manager: ['chat', 'dashboard', 'prompts', 'agents', 'tasks', 'files', 'docs', 'integrations'],
    super: ['chat', 'dashboard', 'prompts', 'agents', 'tasks', 'files', 'docs', 'integrations', 'settings', 'users']
  };
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const isOwner = (name) => String(name || '').trim().toLowerCase() === OWNER;
  // Normaliza: só o Hiago é dono; qualquer outro perfil admin/super vira usuário.
  const users = () => {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY) || '[]').map((u) => ({ ...u, role: isOwner(u.username) ? 'super' : (u.role === 'manager' ? 'manager' : 'user') }));
    } catch (e) { return []; }
  };
  const save = (list) => localStorage.setItem(USERS_KEY, JSON.stringify(list));

  async function hash(password, salt) {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, key, 256);
    return b64(bits);
  }
  function setSession(u) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id: u.id, username: u.username, email: u.email, role: u.role, exp: Date.now() + 1000 * 60 * 60 * 12 }));
  }
  function current() {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (!s || s.exp < Date.now()) { localStorage.removeItem(SESSION_KEY); return null; }
      const fresh = users().find((u) => u.id === s.id);
      if (!fresh) { localStorage.removeItem(SESSION_KEY); return null; }
      return { id: fresh.id, username: fresh.username, email: fresh.email, role: fresh.role };
    } catch (e) { return null; }
  }

  async function register({ username, email, password }) {
    username = (username || '').trim(); email = (email || '').trim().toLowerCase();
    if (!username) throw new Error('Informe o nome de usuário');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error('Informe um e-mail válido');
    if (!password || password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres');
    const list = users();
    if (list.some((u) => u.username.toLowerCase() === username.toLowerCase())) throw new Error('Esse nome de usuário já existe');
    if (list.some((u) => u.email === email)) throw new Error('Esse e-mail já está cadastrado');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    // Só o usuário Hiago vira dono; os demais entram como user (promoção a gerente só pelo Hiago).
    const user = { id: crypto.randomUUID(), username, email, role: isOwner(username) ? 'super' : 'user', salt: b64(salt), hash: await hash(password, salt), createdAt: new Date().toISOString() };
    list.push(user); save(list); setSession(user);
    return current();
  }
  async function login({ email, password }) {
    email = (email || '').trim().toLowerCase();
    if (!email) throw new Error('Informe o e-mail');
    if (!password) throw new Error('Informe a senha');
    const user = users().find((u) => u.email === email);
    const salt = user ? unb64(user.salt) : crypto.getRandomValues(new Uint8Array(16));
    const attempt = await hash(password, salt);
    if (!user || attempt !== user.hash) throw new Error('E-mail ou senha incorretos');
    setSession(user);
    return current();
  }
  function logout() { localStorage.removeItem(SESSION_KEY); location.href = 'login.html'; }
  function requireAuth() { if (!current()) { location.replace('login.html'); return false; } return true; }
  function can(view) { const u = current(); return !!u && VIEWS_BY_ROLE[u.role].includes(view); }
  function listUsers() { return users().map(({ id, username, email, role, createdAt }) => ({ id, username, email, role, createdAt })); }
  function canManage(actor, target, newRole) {
    if (!actor || actor.role !== 'super' || actor.id === target.id) return false;
    return target.role !== 'super' && (!newRole || ['manager', 'user'].includes(newRole));
  }
  function setRole(id, role) {
    const actor = current(), list = users(), target = list.find((u) => u.id === id);
    if (!target || !['manager', 'user'].includes(role) || !canManage(actor, target, role)) throw new Error('Sem permissão para essa alteração');
    target.role = role; save(list);
  }
  function removeUser(id) {
    const actor = current(), list = users(), target = list.find((u) => u.id === id);
    if (!target || !canManage(actor, target)) throw new Error('Sem permissão para excluir');
    save(list.filter((u) => u.id !== id));
  }
  window.OrbitAuth = { register, login, logout, requireAuth, current, can, listUsers, setRole, removeUser, canManage, ROLES, ROLE_LABEL };
})();
