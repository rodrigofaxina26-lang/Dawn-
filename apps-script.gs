/**
 * Dawn — recebe as aplicações do site e grava na planilha.
 *
 * Instalação: ver CONFIGURACAO.md, seção "Opção A — Google Sheets".
 */

// Deixe vazio para não receber aviso por e-mail.
var EMAIL_AVISO = '';

var COLUNAS = [
  ['enviadoEm',    'Data'],
  ['nome',         'Nome'],
  ['telefone',     'Telefone'],
  ['email',        'E-mail'],
  ['tipo',         'Tipo de joia'],
  ['investimento', 'Investimento'],
  ['prazo',        'Prazo'],
  ['canal',        'Atendimento'],
  ['utm_source',   'Origem'],
  ['utm_campaign', 'Campanha'],
  ['utm_medium',   'Mídia'],
  ['fbclid',       'Facebook ID'],
  ['gclid',        'Google ID'],
  ['referrer',     'Veio de']
];

function doPost(e) {
  try {
    var dados = JSON.parse(e.postData.contents);
    var aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Cria o cabeçalho na primeira execução.
    if (aba.getLastRow() === 0) {
      aba.appendRow(COLUNAS.map(function (c) { return c[1]; }));
      aba.getRange(1, 1, 1, COLUNAS.length).setFontWeight('bold');
      aba.setFrozenRows(1);
    }

    aba.appendRow(COLUNAS.map(function (c) {
      var v = dados[c[0]];
      if (c[0] === 'enviadoEm' && v) return new Date(v);
      return v || '';
    }));

    if (EMAIL_AVISO) {
      MailApp.sendEmail({
        to: EMAIL_AVISO,
        subject: 'Nova aplicação Dawn — ' + (dados.nome || 'sem nome'),
        body: [
          'Nome: ' + (dados.nome || '-'),
          'Telefone: ' + (dados.telefone || '-'),
          'E-mail: ' + (dados.email || '-'),
          '',
          'Joia: ' + (dados.tipo || '-'),
          'Investimento: ' + (dados.investimento || '-'),
          'Prazo: ' + (dados.prazo || '-'),
          'Prefere: ' + (dados.canal || '-'),
          '',
          'Origem: ' + (dados.utm_source || 'direto'),
          'Campanha: ' + (dados.utm_campaign || '-')
        ].join('\n')
      });
    }

    return resposta({ ok: true });
  } catch (err) {
    return resposta({ ok: false, erro: String(err) });
  }
}

function resposta(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
