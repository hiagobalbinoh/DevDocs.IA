# DevDocs IA — Guia de uso

## 1. Primeiro acesso
1. Abra `main/login.html` (ou `index.html`, que leva à landing page).
2. Clique em **Criar conta**. Cadastre-se com o nome de usuário **Hiago** para ser o dono (administrador); os demais entram como **Usuário**.
3. No workspace, abra **Configurações**, cole sua chave da Groq e clique em **Salvar**.

## 2. Abas
| Aba | Para que serve |
|---|---|
| Chat com agentes | Conversa com o agente escolhido ou com o Router automático. Aceita imagens e voz. |
| Análise de arquivos | Carrega arquivos, ZIP, PDF, DOCX, repositório do GitHub ou texto colado; mostra o mapa do projeto, alertas automáticos e roda análises com IA. |
| Documentos | Gera README, documentação técnica, guia de uso, relatório de segurança, relatório LGPD e resumo executivo. |
| Agentes | Lista os 14 agentes; escolha um para o chat. |
| Prompts | Modelos prontos para análise, revisão, segurança, README, LGPD e testes. |
| Tarefas | Agenda prompts para rodar depois. |
| Integrações | GitHub (token com permissões mínimas) e Groq. |
| Painel | Uso da sessão. |
| Configurações | Chave, modelos, tema e privacidade. |
| Usuários | Só o Hiago: gerenciar perfis. |

## 3. Fluxo recomendado
1. **Análise de arquivos** → carregue o projeto (ZIP ou repositório).
2. Confira o relatório automático (sem IA) e escolha o tipo de análise e a profundidade.
3. Clique em **Analisar com IA** ou converse com os arquivos.
4. Vá em **Documentos**, gere o que precisar e baixe em `.md`, `.html` ou imprima como PDF.

## 4. Perfis
| Perfil | Acesso |
|---|---|
| Usuário | Chat, análise, documentos, agentes, prompts, tarefas, painel |
| Gerente | + Integrações |
| Dono (Hiago) | Tudo: configurações, usuários, promover e excluir perfis |

## 5. Limites da análise
- Em contas gratuitas da Groq, use a profundidade **Rápida** se aparecer erro de limite.
- Arquivos muito grandes são cortados; o mapa lista todos, mas só os mais relevantes entram no contexto da IA.
- A análise é auxiliar: revise antes de aplicar. O relatório LGPD não substitui parecer jurídico.
