# Dawn — contexto do projeto

Site de captação da **Dawn**, joalheria de peças sob medida. O visitante responde uma
aplicação de qualificação e é encaminhado ao atendimento humano.

## Restrição importante da máquina

**Não há Node nem npm instalados.** Nada de build, bundler ou framework que exija
`npm install`. O site é HTML, CSS e JavaScript puros, servidos como arquivos estáticos.
Se for necessário mudar de stack, confirmar antes com o usuário.

Para rodar localmente:

```bash
python -m http.server 4173
```

## Idioma

Todo o conteúdo do site, os commits e a conversa com o usuário são em **português do
Brasil**.

## Decisões de produto já tomadas

O site foi inspirado em `guilhermegarciaco.com.br/personalize`, mas a copy **não** deve
copiar a do concorrente — já houve um pedido explícito para reescrever uma frase por estar
parecida demais.

O enquadramento é de "aplicação", não de orçamento: o cliente se candidata a ser atendido.
Isso é deliberado e sustenta o posicionamento de alto ticket.

**A ordem das perguntas é estratégica e não deve ser reorganizada sem motivo:** os dados de
contato vêm por último, depois de o cliente já ter investido esforço nas respostas. A faixa
de investimento é uma escala fechada, nunca um campo aberto, para ancorar o valor e filtrar
quem não é público.

## Arquitetura

| Arquivo | Função |
|---|---|
| `index.html` | Capa, as seis etapas e a tela de confirmação |
| `styles.css` | Paleta azul-marinho da marca, derivada da logo |
| `app.js` | Navegação, validação, envio e fila de reenvio |
| `apps-script.gs` | Vai colado no Google Apps Script, grava os leads na planilha |
| `CONFIGURACAO.md` | Passo a passo dos itens pendentes |

Toda a configuração fica em constantes no topo do `app.js`: `WHATSAPP_NUMBER`,
`SCHEDULE_URL`, `LEAD_ENDPOINT` e `LEAD_PLAIN_TEXT`.

`LEAD_PLAIN_TEXT` controla o `Content-Type` do envio. Deve ficar `true` para o Google Apps
Script: `text/plain` mantém a requisição "simples" e evita o preflight CORS, que o Apps
Script não responde. Para o Formspree, usar `false`.

## Garantias do envio de leads

O lead é registrado **antes** de o cliente ser levado ao WhatsApp ou à agenda. Se ele
desistir de abrir a conversa, o contato já está salvo. Não inverter essa ordem.

Falha de rede nunca vira erro na tela: o lead entra numa fila no `localStorage` e é
reenviado sozinho na próxima visita. Comportamento verificado com endpoint local, incluindo
o caso de reenvio sem duplicação.

Os parâmetros `utm_*`, `fbclid` e `gclid` da URL são capturados e enviados junto, para
atribuir cada lead ao anúncio de origem. A Dawn anuncia no Meta.

## Pendências

- [ ] `LEAD_ENDPOINT` está vazio — **os leads ainda não são gravados em lugar nenhum**
- [ ] `SCHEDULE_URL` está vazio — quem escolhe videochamada só vê a confirmação
- [ ] Trocar a imagem de fundo da capa por uma foto de peça real da Dawn
- [ ] Publicar em um domínio

## Dados da marca

- WhatsApp da concierge: `19 97115-8885` (no código como `5519971158885`)
- Instagram: `@dawn.joias`
- Logo: monograma "A" serifado com um brilho de quatro pontas, branco sobre azul-marinho
