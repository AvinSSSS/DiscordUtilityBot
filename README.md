# 🤖 Bot Utilitário para Discord

[![Tests](https://img.shields.io/badge/testes-Node%20Test%20Runner-3c873a?logo=node.js)](#testes)
[![Node](https://img.shields.io/badge/Node.js-22+-339933?logo=node.js)](https://nodejs.org/)

Bot enxuto para comunidades que precisam receber novos membros e organizar suporte por tickets sem painéis complexos.

## ✨ Funcionalidades

- Mensagem de boas-vindas em canal configurável.
- Comando `/ticket` para criar um canal privado.
- Prevenção de mais de um ticket aberto por usuário.
- Permissões exclusivas para autor e equipe de suporte.
- Comando `/fechar` com autorização e transcript das últimas 100 mensagens.
- Endpoints `/` e `/health` para hospedagem e monitoramento.
- Imagem Docker pronta para implantação.

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
| `PORT` | Porta HTTP, padrão `8000` |

```bash
npm run register
npm start
```

## 🧪 Testes

```bash
npm test
```

Os testes não precisam de token e validam funções puras, como a criação segura de nomes de canal.

## 🐳 Docker e Koyeb

```bash
docker build -t discord-utility-bot .
docker run --env-file .env -p 8000:8000 discord-utility-bot
```

No Koyeb, publique o `Dockerfile`, exponha a porta 8000 e cadastre as variáveis como secrets. Planos gratuitos podem suspender o serviço por inatividade.

## 🔐 Segurança e limitações

- Nunca versione o `.env` ou o token do Discord.
- Conceda ao bot somente as permissões necessárias.
- O transcript é anexado antes da exclusão do canal e não usa banco externo.
- O MVP exporta no máximo 100 mensagens por limitação intencional da consulta.

---

## 🇬🇧 English

Node.js/discord.js utility bot with configurable welcomes, private ticket channels, role-based closing, text transcripts, health endpoints and Docker support.
