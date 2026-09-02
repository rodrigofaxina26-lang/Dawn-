# Dawn

Site de captação da **Dawn — joias sob medida**. O visitante preenche uma aplicação de
qualificação e é encaminhado ao atendimento pelo canal que preferir.

## Como rodar

Não há build nem dependências — são arquivos estáticos.

```bash
python -m http.server 4173
```

Depois acesse http://localhost:4173

## Estrutura

| Arquivo | Função |
|---|---|
| `index.html` | Capa, etapas do formulário e tela de confirmação |
| `styles.css` | Estilo visual (paleta azul-marinho da marca) |
| `app.js` | Navegação, validação, envio dos leads e fila de reenvio |
| `apps-script.gs` | Script do Google Apps Script que grava os leads na planilha |
| `CONFIGURACAO.md` | **Comece por aqui** — o que precisa ser configurado |

## O fluxo

1. **Capa** — convite para iniciar a aplicação
2. **Tipo de joia** — anel, aliança, colar, brinco, pingente, pulseira
3. **Faixa de investimento** — qualifica o lead
4. **Prazo desejado**
5. **Contato** — nome, telefone e e-mail, pedidos só depois do envolvimento
6. **Canal de atendimento** — videochamada com especialista ou WhatsApp com a concierge
7. **Revisão** e envio

Navegação por teclado: as letras selecionam as opções, `Enter` avança e `Esc` volta.
O rascunho fica salvo no navegador, então quem fecha a aba retoma de onde parou.

## Registro dos leads

O lead é gravado **antes** de o cliente ser levado ao WhatsApp ou à agenda, para que nada
se perca se ele desistir de abrir a conversa. Se a rede falhar, o envio entra numa fila
local e é refeito sozinho na próxima visita, sem o cliente ver erro.

Os parâmetros de campanha da URL (`utm_source`, `utm_campaign`, `fbclid`, `gclid`) são
enviados junto, o que permite saber qual anúncio trouxe cada cliente.

## Pendências

- [ ] Definir o destino dos leads (`LEAD_ENDPOINT` em `app.js`) — ver `CONFIGURACAO.md`
- [ ] Definir o link de agendamento (`SCHEDULE_URL` em `app.js`)
- [ ] Substituir a imagem de fundo da capa por uma foto de peça da Dawn
- [ ] Publicar em um domínio
