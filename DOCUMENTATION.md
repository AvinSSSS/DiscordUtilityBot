# Documentação técnica do Avin

Este documento apresenta a organização do código, os principais fluxos e os pontos de extensão do bot.

## Visão geral

O Avin é executado como um único processo Node.js. O processo mantém uma conexão com o Gateway do Discord e um pequeno servidor HTTP usado por serviços de hospedagem para verificar sua saúde.

```text
Discord ──interações/eventos──> src/index.js
                                  ├── tickets
                                  ├── sugestões
                                  ├── boas-vindas
                                  └── transcripts

Hospedagem ──HTTP──> /health e /ready
```

## Estrutura do projeto

| Caminho | Responsabilidade |
|---|---|
| `src/index.js` | Inicialização, eventos do Discord e implementação dos comandos |
| `src/register-commands.js` | Definição e registro dos slash commands no servidor |
| `src/config.js` | Leitura e validação das variáveis de ambiente |
| `src/ticket.js` | Metadados e regras de autorização dos tickets |
| `src/transcript.js` | Nome seguro de canal e geração do arquivo de transcript |
| `test/` | Testes unitários executados sem conexão com o Discord |
| `docs/` | Termos de Serviço e Política de Privacidade do GitHub Pages |

## Inicialização

Ao executar `npm start`, `src/index.js` realiza esta sequência:

1. O `dotenv` carrega o arquivo `.env`.
2. `botConfig()` valida o token, os IDs opcionais e a porta.
3. O Express inicia os endpoints HTTP.
4. O cliente do Discord conecta usando os intents configurados.
5. Os listeners passam a receber entradas de membros e interações.

Uma configuração inválida interrompe o processo antes da autenticação, evitando que o bot seja iniciado parcialmente.

## Registro dos comandos

`npm run register` envia a definição de `/ticket`, `/fechar` e `/sugerir` ao servidor indicado por `DISCORD_GUILD_ID`. Esse comando deve ser executado novamente sempre que um slash command for criado ou alterado.

O registro por servidor foi escolhido porque as alterações aparecem rapidamente durante o desenvolvimento.

## Fluxo dos tickets

### Abertura

`/ticket` adia a resposta de forma privada, atualiza o cache de canais e procura outro ticket pertencente ao usuário. Se não existir, cria um canal de texto privado.

O tópico do canal armazena:

```text
ticket-owner:ID_DO_USUARIO;status:open
```

Esse formato permite recuperar o autor e o estado sem banco de dados. O cargo `@everyone` não consegue ver o canal; o autor e o cargo de suporte recebem acesso explícito.

### Fechamento

`/fechar` confirma que o canal é um ticket e autoriza somente seu autor ou o cargo de suporte. Antes de buscar as mensagens, troca o estado para `closing`, bloqueando execuções concorrentes.

As últimas 100 mensagens são ordenadas da mais antiga para a mais recente. Os anexos são preservados como URLs. O arquivo é enviado ao canal de transcripts ou, se ele não estiver disponível, por mensagem direta ao autor. O canal só é excluído depois que o histórico é salvo.

Se ocorrer uma falha, o estado volta para `open`, permitindo uma nova tentativa.

## Fluxo das sugestões

`/sugerir texto: ...` cria um embed com autor, conteúdo e data. Quando `SUGGESTION_CHANNEL_ID` está preenchido, a publicação é enviada para esse canal; caso contrário, usa o canal em que o comando foi executado.

O bot adiciona 👍 e 👎 para votação. Se não possuir a permissão **Adicionar reações**, a sugestão permanece publicada e o autor recebe um aviso privado.

## Boas-vindas

O evento `GuildMemberAdd` envia uma mensagem ao canal definido por `WELCOME_CHANNEL_ID`. Esse recurso depende do **Server Members Intent** habilitado no Discord Developer Portal.

## Endpoints HTTP

| Endpoint | Resposta |
|---|---|
| `/` | Nome do serviço e estado geral |
| `/health` | Confirma que o processo HTTP está ativo |
| `/ready` | Retorna `200` quando o Discord está conectado e `503` durante a inicialização |

## Segurança

- O `.env` nunca deve ser versionado.
- `allowedMentions` limita menções geradas a partir de conteúdo do usuário.
- Os IDs são validados como snowflakes antes da conexão.
- As permissões dos tickets seguem o princípio de acesso mínimo.
- O token deve ser armazenado como secret na plataforma de hospedagem.

## Como adicionar um comando

1. Declare o comando em `src/register-commands.js`.
2. Crie a função que processa a interação em `src/index.js`.
3. Adicione o comando ao roteador de `Events.InteractionCreate`.
4. Inclua testes para regras que possam ser isoladas do Discord.
5. Execute `npm run check` e `npm test`.
6. Execute `npm run register` para atualizar o servidor.

## Validação local

```bash
npm run check
npm test
```

`npm run check` valida a sintaxe dos arquivos. `npm test` executa os testes com o test runner nativo do Node.js.
