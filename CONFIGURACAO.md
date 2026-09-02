# Configuração do Dawn

Tudo que precisa ser ajustado antes de publicar está no topo do arquivo `app.js`.

```js
var WHATSAPP_NUMBER = '5519971158885';   // já configurado
var SCHEDULE_URL    = '';                // pendente
var LEAD_ENDPOINT   = '';                // pendente
var LEAD_PLAIN_TEXT = true;
```

---

## 1. Registro dos leads (pendente)

Enquanto `LEAD_ENDPOINT` estiver vazio, o site funciona normalmente, mas **os leads não são
gravados em lugar nenhum** — aparecem só no console do navegador (F12). Escolha uma das
opções abaixo.

### Opção A — Google Sheets (recomendada)

Os leads caem direto numa planilha sua. É gratuito, sem limite mensal, e você já tem conta Google.

1. Crie uma planilha nova em [sheets.new](https://sheets.new) e nomeie-a "Leads Dawn".
2. No menu, vá em **Extensões → Apps Script**.
3. Apague o conteúdo e cole o script que está em `apps-script.gs` (nesta pasta).
4. Clique em **Implantar → Nova implantação**.
5. Em "Tipo", escolha **App da Web**.
6. Configure:
   - *Executar como:* **Eu**
   - *Quem pode acessar:* **Qualquer pessoa**  ← essencial, senão o site não consegue enviar
7. Clique em **Implantar** e autorize o acesso quando o Google pedir.
8. Copie a **URL do app da Web** (termina em `/exec`).
9. Cole em `app.js`:

```js
var LEAD_ENDPOINT   = 'https://script.google.com/macros/s/SEU_ID_AQUI/exec';
var LEAD_PLAIN_TEXT = true;
```

Para receber um e-mail a cada lead novo, preencha a variável `EMAIL_AVISO` no topo do
`apps-script.gs`.

### Opção B — Formspree (mais rápido de configurar)

Os leads chegam por e-mail e ficam num painel. Gratuito até 50 por mês.

1. Crie a conta em [formspree.io](https://formspree.io) e depois um novo formulário.
2. Copie o endpoint (algo como `https://formspree.io/f/xayzabcd`).
3. Em `app.js`:

```js
var LEAD_ENDPOINT   = 'https://formspree.io/f/xayzabcd';
var LEAD_PLAIN_TEXT = false;
```

---

## 2. Link de agendamento (pendente)

Quem escolhe "Agendar videochamada com especialista" hoje só vê a tela de confirmação.
Para abrir uma agenda de verdade, crie um evento no [Cal.com](https://cal.com) ou
[Calendly](https://calendly.com) e cole o link:

```js
var SCHEDULE_URL = 'https://cal.com/dawn/consultoria';
```

---

## Como os leads são protegidos

- **Envio antes da confirmação:** o lead é registrado antes de o cliente ser levado ao
  WhatsApp ou à agenda. Se ele desistir de abrir a conversa, o contato já está salvo.
- **Fila de reenvio:** se a internet do cliente falhar no momento do envio, o lead fica
  guardado no navegador dele e é reenviado sozinho na próxima visita. O cliente nunca vê
  erro — a experiência dele continua normal.
- **Origem da campanha:** o site captura `utm_source`, `utm_campaign`, `fbclid` e `gclid`
  da URL e envia junto com o lead. Assim dá para saber qual anúncio trouxe cada cliente.
  Basta usar links com UTM nos anúncios, por exemplo:
  `https://dawn.com.br/?utm_source=instagram&utm_campaign=aliancas`

## Rodar o site localmente

```bash
cd "C:/Users/rodrigo.faxina/Desktop/Dawn" && python -m http.server 4173
```

Depois acesse http://localhost:4173
