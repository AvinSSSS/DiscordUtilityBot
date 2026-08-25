# 🤖 Bot Utilitário para Discord

[![Tests](https://img.shields.io/badge/testes-Node%20Test%20Runner-3c873a?logo=node.js)](#testes)
[![Node](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js)](https://nodejs.org/)

Bot enxuto para comunidades que precisam receber novos membros e organizar suporte por tickets sem painéis complexos.

Documentos legais: [Termos de Serviço](https://avinssss.github.io/DiscordUtilityBot/) e [Política de Privacidade](https://avinssss.github.io/DiscordUtilityBot/privacy.html).

## ✨ Funcionalidades

- Mensagem de boas-vindas em canal configurável.
- Comando `/sugerir` para publicar sugestões com votação por 👍/👎.
- Comando `/ticket` para criar um canal privado.
- Prevenção de mais de um ticket aberto por usuário.
- Permissões exclusivas para autor e equipe de suporte.
- Comando `/fechar` com autorização e transcript das últimas 100 mensagens.
- Arquivamento do transcript em canal privado ou, como fallback, por DM ao autor.
- Bloqueio de fechamento concorrente e recuperação quando o arquivamento falha.
- Endpoints `/`, `/health` e `/ready` para hospedagem e monitoramento.
- Validação das variáveis antes da conexão, desligamento gracioso e imagem Docker com healthcheck.
- Testes automatizados e CI no GitHub Actions.

## 🛠️ Configuração

Requisitos: Node.js 22+, uma aplicação no Discord Developer Portal e permissões para gerenciar canais.

```bash
npm install
copy .env.example .env
```

Preencha no `.env`:

| Variável | Finalidade |
|---|---|
| `DISCORD_TOKEN` | Token secreto do bot |
| `DISCORD_CLIENT_ID` | ID da aplicação |
| `DISCORD_GUILD_ID` | Servidor usado para registrar comandos |
| `WELCOME_CHANNEL_ID` | Canal das boas-vindas |
| `TICKET_CATEGORY_ID` | Categoria dos tickets |
| `SUPPORT_ROLE_ID` | Cargo autorizado a atender/fechar |
| `TRANSCRIPT_CHANNEL_ID` | Canal privado que arquiva os transcripts (recomendado) |
| `SUGGESTION_CHANNEL_ID` | Canal que recebe sugestões; vazio usa o canal do comando |
| `PORT` | Porta HTTP, padrão `8000` |

```bash
npm run register
npm start
```

## 🧪 Testes

```bash
npm test
```

Os testes não precisam de token e validam configuração, nomes seguros, autorização,
estado do ticket, ordenação das mensagens e anexos do transcript.

```bash
npm run check
```

O workflow `.github/workflows/ci.yml` executa as duas verificações em pushes e pull requests.

## 🐳 Docker e Koyeb

```bash
docker build -t discord-utility-bot .
docker run --env-file .env -p 8000:8000 discord-utility-bot
```

No Koyeb, publique o `Dockerfile`, exponha a porta 8000, use `/health` no
healthcheck e cadastre as variáveis como secrets. Planos gratuitos podem
suspender o serviço por inatividade.

## ✅ Checklist do Discord

1. Ative **Server Members Intent** e **Message Content Intent** na página **Bot**.
2. Convide o bot com os escopos `bot` e `applications.commands`.
3. Conceda `View Channels`, `Send Messages`, `Read Message History`, `Attach Files`
   `Add Reactions` e `Manage Channels` somente nos canais e categorias necessários.
4. Crie um canal privado de auditoria e configure `TRANSCRIPT_CHANNEL_ID`.
5. Rode `npm run register` uma vez após criar ou alterar os slash commands.

## 🔐 Segurança e limitações

- Nunca versione o `.env` ou o token do Discord.
- Conceda ao bot somente as permissões necessárias.
- O transcript é salvo no canal configurado; sem ele, o bot tenta enviá-lo por DM
  ao autor e mantém o ticket aberto se não conseguir preservar o histórico.
- O MVP exporta no máximo 100 mensagens por limitação intencional da consulta.
- O armazenamento e a retenção dos transcripts seguem as permissões e políticas do seu servidor.

---

## 🇬🇧 English

Node.js/discord.js utility bot with configurable welcomes, private ticket channels, role-based closing, text transcripts, health endpoints and Docker support.
