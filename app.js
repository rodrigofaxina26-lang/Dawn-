/* Dawn — fluxo de aplicação */
(function () {
  'use strict';

  var STORAGE_KEY = 'dawn-aplicacao-v1';
  var QUEUE_KEY = 'dawn-leads-pendentes';

  // Configuração de atendimento — ajustar antes de publicar:
  var WHATSAPP_NUMBER = '5519971158885';            // número da concierge, só dígitos (55 + DDD + número)
  var SCHEDULE_URL = '';                            // link de agendamento (Calendly/Cal.com); vazio = só confirma

  // Destino dos leads — ver CONFIGURACAO.md para gerar a URL.
  // Vazio = modo de teste: o lead só aparece no console do navegador.
  var LEAD_ENDPOINT = '';
  var LEAD_PLAIN_TEXT = true;   // true para Google Apps Script (evita bloqueio de CORS); false para Formspree

  var screens = {
    cover: document.getElementById('screen-cover'),
    form: document.getElementById('screen-form'),
    done: document.getElementById('screen-done')
  };

  var steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  var progressBar = document.getElementById('progress-bar');
  var progressTrack = document.getElementById('progress-track');
  var progressCount = document.getElementById('progress-count');
  var summaryEl = document.getElementById('summary');
  var submitBtn = document.getElementById('btn-submit');

  var LABELS = {
    tipo: 'Tipo de joia',
    investimento: 'Investimento',
    prazo: 'Prazo desejado',
    canal: 'Atendimento',
    nome: 'Nome',
    telefone: 'Telefone',
    email: 'E-mail'
  };

  var state = { answers: {}, step: 0, started: false };

  // ---------- persistência ----------
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function restore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && data.answers) {
        state = data;
        // reidrata seleções
        steps.forEach(function (step) {
          var field = step.dataset.field;
          if (field && state.answers[field]) {
            var btn = step.querySelector('.option[data-value="' + CSS.escape(state.answers[field]) + '"]');
            if (btn) btn.setAttribute('aria-pressed', 'true');
          }
        });
        ['nome', 'telefone', 'email'].forEach(function (f) {
          var input = document.getElementById('input-' + f);
          if (input && state.answers[f]) input.value = state.answers[f];
        });
        if (state.started) {
          showScreen('form');
          goTo(Math.min(state.step, steps.length - 1), true);
        }
      }
    } catch (e) {}
  }

  // ---------- navegação ----------
  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      screens[key].classList.toggle('is-active', key === name);
    });
    window.scrollTo(0, 0);
  }

  function goTo(index, instant) {
    state.step = index;
    steps.forEach(function (step, i) {
      step.classList.toggle('is-active', i === index);
    });
    var pct = Math.round((index / (steps.length - 1)) * 100);
    progressBar.style.width = pct + '%';
    progressTrack.setAttribute('aria-valuenow', String(pct));
    progressCount.textContent = (index + 1) + ' / ' + steps.length;

    if (steps[index].dataset.kind === 'summary') renderSummary();
    if (steps[index].dataset.kind === 'contact' && !instant) {
      var first = steps[index].querySelector('input');
      if (first && !first.value) first.focus();
    }
    save();
  }

  function next() {
    if (state.step < steps.length - 1) goTo(state.step + 1);
  }

  function back() {
    if (state.step > 0) goTo(state.step - 1);
  }

  // ---------- validação ----------
  function validPhone(v) {
    var digits = v.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 13;
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  }

  function validateContact() {
    var ok = true;
    var checks = {
      nome: function (v) { return v.trim().length >= 2; },
      telefone: validPhone,
      email: validEmail
    };
    Object.keys(checks).forEach(function (f) {
      var input = document.getElementById('input-' + f);
      var wrap = input.closest('.field');
      var valid = checks[f](input.value);
      wrap.classList.toggle('has-error', !valid);
      if (!valid && ok) { input.focus(); ok = false; }
      if (valid) state.answers[f] = input.value.trim();
    });
    return ok;
  }

  // máscara leve de telefone BR
  function maskPhone(v) {
    var d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
    if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
  }

  // ---------- resumo ----------
  function renderSummary() {
    var order = ['tipo', 'investimento', 'prazo', 'nome', 'telefone', 'email', 'canal'];
    summaryEl.innerHTML = '';
    order.forEach(function (f) {
      if (!state.answers[f]) return;
      var row = document.createElement('div');
      row.className = 'summary__row';
      var label = document.createElement('span');
      label.className = 'summary__label';
      label.textContent = LABELS[f];
      var value = document.createElement('span');
      value.className = 'summary__value';
      value.textContent = state.answers[f];
      row.appendChild(label);
      row.appendChild(value);
      summaryEl.appendChild(row);
    });
  }

  // ---------- origem do tráfego ----------
  // Guarda de onde veio a visita (anúncio, busca, indicação) para atribuir o lead.
  function captureSource() {
    var params = new URLSearchParams(location.search);
    var src = {};
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid']
      .forEach(function (k) { if (params.get(k)) src[k] = params.get(k); });
    if (document.referrer && document.referrer.indexOf(location.host) === -1) {
      src.referrer = document.referrer;
    }
    return src;
  }

  var SOURCE = captureSource();

  // ---------- fila de reenvio ----------
  // Se a rede falhar, o lead fica guardado e é reenviado na próxima visita.
  function readQueue() {
    try { return JSON.parse(localStorage.getItem(QUEUE_KEY)) || []; } catch (e) { return []; }
  }

  function writeQueue(list) {
    try { localStorage.setItem(QUEUE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function enqueue(payload) {
    var list = readQueue();
    list.push(payload);
    writeQueue(list.slice(-20)); // limite de segurança
  }

  function flushQueue() {
    if (!LEAD_ENDPOINT) return;
    var list = readQueue();
    if (!list.length) return;
    writeQueue([]);
    list.forEach(function (payload) {
      postLead(payload)['catch'](function () { enqueue(payload); });
    });
  }

  // ---------- envio ----------
  function buildPayload() {
    var a = state.answers;
    return Object.assign({}, a, SOURCE, {
      origem: 'dawn-personalize',
      enviadoEm: new Date().toISOString(),
      _subject: 'Nova aplicação Dawn — ' + (a.nome || 'sem nome') + ' — ' + (a.tipo || '')
    });
  }

  function postLead(payload) {
    // text/plain mantém a requisição "simples", sem preflight OPTIONS —
    // necessário para o Google Apps Script, que não responde ao preflight.
    var type = LEAD_PLAIN_TEXT ? 'text/plain;charset=utf-8' : 'application/json';
    return fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': type },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res;
    });
  }

  function openChannel() {
    var a = state.answers;
    if (a.canal === 'WhatsApp com concierge' && WHATSAPP_NUMBER) {
      var msg = 'Olá! Acabei de enviar minha aplicação no site da Dawn.\n' +
        'Nome: ' + a.nome + '\n' +
        'Joia: ' + a.tipo + '\n' +
        'Investimento: ' + a.investimento + '\n' +
        'Prazo: ' + a.prazo;
      window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg), '_blank');
    } else if (a.canal === 'Videochamada com especialista' && SCHEDULE_URL) {
      window.open(SCHEDULE_URL, '_blank');
    }
  }

  function finish() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    showScreen('done');
    openChannel();
  }

  var submitting = false;

  function submit() {
    if (submitting) return;
    var payload = buildPayload();

    if (!LEAD_ENDPOINT) {
      console.log('Aplicação Dawn (modo de teste, sem endpoint):', payload);
      finish();
      return;
    }

    submitting = true;
    submitBtn.classList.add('is-loading');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando…';

    postLead(payload)
      .then(function () {
        finish();
      })['catch'](function (err) {
        // Não perde o lead: guarda para reenviar e segue com o atendimento.
        console.warn('Falha ao registrar o lead, guardado para reenvio:', err);
        enqueue(payload);
        finish();
      })
      .then(function () {
        submitting = false;
        submitBtn.classList.remove('is-loading');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar aplicação';
      });
  }

  // ---------- eventos ----------
  document.getElementById('btn-start').addEventListener('click', function () {
    state.started = true;
    showScreen('form');
    goTo(state.step || 0);
  });

  // opções (choice): seleção + auto-avanço
  steps.forEach(function (step) {
    if (step.dataset.kind !== 'choice') return;
    var field = step.dataset.field;
    step.addEventListener('click', function (e) {
      var btn = e.target.closest('.option');
      if (!btn) return;
      step.querySelectorAll('.option').forEach(function (o) {
        o.setAttribute('aria-pressed', 'false');
      });
      btn.setAttribute('aria-pressed', 'true');
      state.answers[field] = btn.dataset.value;
      save();
      setTimeout(next, 280); // deixa a seleção visível antes de avançar
    });
  });

  // navegação por botões
  document.addEventListener('click', function (e) {
    var nav = e.target.closest('[data-nav]');
    if (!nav) return;
    if (nav.dataset.nav === 'back') back();
    if (nav.dataset.nav === 'next') {
      if (steps[state.step].dataset.kind === 'contact') {
        if (validateContact()) { save(); next(); }
      } else {
        next();
      }
    }
  });

  submitBtn.addEventListener('click', submit);

  // máscara do telefone
  var phoneInput = document.getElementById('input-telefone');
  phoneInput.addEventListener('input', function () {
    phoneInput.value = maskPhone(phoneInput.value);
  });

  // limpa erro ao digitar
  ['nome', 'telefone', 'email'].forEach(function (f) {
    document.getElementById('input-' + f).addEventListener('input', function (e) {
      e.target.closest('.field').classList.remove('has-error');
    });
  });

  // ---------- teclado ----------
  document.addEventListener('keydown', function (e) {
    // capa: Enter inicia
    if (screens.cover.classList.contains('is-active')) {
      if (e.key === 'Enter') document.getElementById('btn-start').click();
      return;
    }
    if (!screens.form.classList.contains('is-active')) return;

    var step = steps[state.step];

    // A/B/C... seleciona opção nas etapas de escolha (fora de inputs)
    if (step.dataset.kind === 'choice' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) {
      var idx = e.key.toUpperCase().charCodeAt(0) - 65; // A=0
      if (e.key.length === 1 && idx >= 0 && idx < 26) {
        var options = step.querySelectorAll('.option');
        if (options[idx]) { options[idx].click(); e.preventDefault(); return; }
      }
    }

    if (e.key === 'Enter') {
      if (step.dataset.kind === 'contact') {
        e.preventDefault();
        if (validateContact()) { save(); next(); }
      } else if (step.dataset.kind === 'summary') {
        e.preventDefault();
        submit();
      }
    }

    if (e.key === 'Escape') back();
  });

  restore();
  flushQueue();
})();
