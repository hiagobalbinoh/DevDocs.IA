# DevDocs IA — Arquitetura

Aplicação estática (HTML, CSS e JavaScript puro). Não há servidor próprio: o navegador conversa direto com a API da Groq e, opcionalmente, com a API do GitHub.

```
index.html              → redireciona para a landing
main/landing.html       → página pública
main/login.html         → login e cadastro
main/auth.js            → usuários, sessão e perfis (localStorage + PBKDF2)
main/index.html         → workspace: chat, agentes, prompts, tarefas, integrações
main/extras.js          → perfil/logout, painel de usuários, análise de arquivos e documentos
main/assets/audio/      → vozes dos agentes Desenvolvedor e Jurídica
docs/                   → esta documentação
```

## Módulos
- **auth.js** — `OrbitAuth.register/login/logout/current/can/setRole/removeUser`. Senha com PBKDF2-SHA256 (100 mil iterações) e salt. Sessão de 12 h.
- **extras.js** — carrega depois do script principal e reaproveita `agents`, `renderMarkdown` e `showToast`. Contém:
  - leitura de fontes (texto, ZIP via JSZip, PDF via pdf.js, DOCX, GitHub);
  - análise estática por regras (segredos, `eval`, SQL concatenado, `innerHTML`, hash fraco, TODO, debug);
  - montagem de contexto com orçamento de caracteres e priorização de arquivos;
  - streaming com a Groq (`/openai/v1/chat/completions`);
  - geração e exportação de documentos.

## Dados no navegador (localStorage)
`orbit_users`, `orbit_session`, `groq_api_key`, `github_token`, `orbit_tasks`, `orbit_usage`, `orbit_docs`.
(Os prefixos `orbit_` foram mantidos para não perder dados de versões anteriores.)
