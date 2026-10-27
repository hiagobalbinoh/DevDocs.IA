# DevDocs IA

Workspace de IA para **analisar código e arquivos, conversar com agentes e gerar documentação**. HTML, CSS e JavaScript puro, usando a API da [Groq](https://groq.com).

## Experiência

- `index.html` redireciona para a landing page do DevDocs IA
- `main/landing.html` é a página pública com animações GSAP e apresentação do produto
- `main/index.html` é o workspace completo com chat, agentes, visão, voz, tarefas, GitHub e configurações

## Novidades

- **Interface** preto e vermelho (`main/theme.css`, `main/fx.js`): modo escuro por padrão, brilho que segue o mouse, paleta de comandos (**Ctrl+K**), animações de entrada, efeito ao clicar, contadores animados e landing interativa. Respeita a opção "reduzir movimento" do sistema.

- **Login com perfis** (`main/login.html`, `main/auth.js`): cadastro e entrada com senha protegida por PBKDF2. O usuário **Hiago** é o dono e único administrador; os demais entram como *Usuário* e são promovidos a *Gerente* por ele em **Usuários**. Tudo fica no navegador (localStorage) e não substitui um backend.
- **Análise de arquivos** (menu *Análise de arquivos*): arquivos de código/texto, ZIP, PDF, DOCX, repositório do GitHub ou texto colado. Gera um mapa do projeto e alertas automáticos (segredos, eval, SQL concatenado, innerHTML, hash fraco, TODO) e roda análises com IA: visão geral, segurança, bugs, LGPD, README e resumo. Depois, converse com os arquivos.
- **Documentos** (menu *Documentos*): gera README, documentação técnica, guia de uso, relatório de segurança, relatório LGPD e resumo executivo, com download em `.md`/`.html` e impressão em PDF.
- **14 agentes** focados em código, documentos e qualidade, incluindo *Desenvolvedor* e *Assistente Jurídica* (com as vozes do DevDocs).

Veja `docs/GUIA-DE-USO.md`, `docs/ARQUITETURA.md` e `docs/SEGURANCA.md`.

## Modelos disponíveis

### OpenAI
- `openai/gpt-oss-120b` (padrão)
- `openai/gpt-oss-20b`
- `openai/gpt-oss-safeguard-20b`

### Alibaba Cloud
- `qwen/qwen3.8-27b`

### Canopy Labs
- `canopylabs/orpheus-v1-english`
- `canopylabs/orpheus-arabic-saudi`

### Meta (Guard)
- `meta-llama/llama-prompt-guard-2-22m`
- `meta-llama/llama-prompt-guard-2-86m`

## Como usar

1. Abra o `index.html` ou ative o GitHub Pages
2. Cole sua chave da Groq e clique em **Salvar**
3. Escolha o modelo e converse

A resposta aparece em **streaming** (tempo real). A chave é usada somente no navegador e não deve ser exposta em um site público.

## Ativar GitHub Pages

1. Settings → Pages
2. Source: branch `main`
3. Aguarde alguns minutos
4. Acesse: `https://SEU-USUARIO.github.io/chat-ia-groq/`

---

Feito com ❤️