# DevDocs IA — Segurança e privacidade

## O que o sistema faz
- Senhas guardadas com PBKDF2-SHA256 + salt; nunca em texto puro.
- O cadastro público não escolhe perfil: só o usuário Hiago vira dono/administrador.
- Alterações de perfil só podem ser feitas pelo Hiago, e ninguém altera o próprio perfil.
- Os arquivos são lidos no navegador. Só o trecho escolhido para análise vai para a Groq.

## Limitações conhecidas
1. **Sem backend**: usuários, sessão e permissões ficam no localStorage. Quem tem acesso ao navegador pode editá-los. Serve para organizar acesso local, não para proteger dados de terceiros.
2. **Chave da Groq no navegador**: não publique o site com uma chave pessoal. Para uso público, crie um backend que guarde a chave.
3. **Token do GitHub**: use permissões mínimas (somente leitura).
4. **Conteúdo enviado à IA**: não analise arquivos com segredos ou dados pessoais reais sem avaliar a política da Groq.

## Próximo passo recomendado
Criar um backend (Node ou PHP) com sessão em cookie `HttpOnly`, banco de dados e a chave da Groq no servidor.
