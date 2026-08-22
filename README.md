# Bot Utilitário para Discord / Discord Utility Bot

Bot Node.js com boas-vindas, tickets privados, controle de permissões e transcript no encerramento.

## Uso

1. Copie `.env.example` para `.env` e preencha os IDs e o token da aplicação Discord.
2. Execute `npm install`, `npm run register` e `npm start`.
3. Para Koyeb, publique pelo `Dockerfile`, exponha a porta 8000 e cadastre as variáveis como secrets.

O endpoint `/health` permite verificar o estado. Em hospedagem gratuita o bot pode suspender por inatividade; o transcript é enviado ao canal antes de sua remoção e não é persistido externamente.

---

Node.js utility bot with welcome messages, private tickets, permission controls and a text transcript on close.
