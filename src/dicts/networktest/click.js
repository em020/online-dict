"use strict";

function updateNetworkTestGlobalQ(attempt) {
  var globalQEl = document.getElementById('networktest-global-q');
  if (!globalQEl) {
    console.log('[networktest] global_q element missing');
    return;
  }

  var globalQ = typeof window !== 'undefined' ? window.global_q : undefined;
  if (typeof globalQ !== 'undefined' && globalQ !== null && globalQ !== '') {
    console.log('[networktest] global_q found', globalQ);
    globalQEl.innerText = 'global_q: ' + String(globalQ);
    return;
  }

  console.log('[networktest] global_q unavailable', attempt);
  globalQEl.innerText = 'global_q: ';

  if (attempt < 10) {
    window.setTimeout(function() {
      updateNetworkTestGlobalQ(attempt + 1);
    }, 300);
  }
}

function onNetworkTestClick() {
  console.log('[networktest] click handler entered');
  var resultEl = document.getElementById('network-test-result');
  if (!resultEl) {
    console.log('[networktest] result element missing');
    return;
  }
  console.log('[networktest] result element found');
  resultEl.innerText = 'Fetching...';
  console.log('[networktest] starting fetch');

  fetch('https://www.yunzhijia.com/yzjai/ai/chain', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: '{}'
  }).then(function(response) {
    console.log('[networktest] fetch response', response.status, response.statusText);
    return response.text();
  }).then(function(response) {
    console.log('[networktest] response text length', response.length);
    resultEl.innerText = response;
  }).catch(function(err) {
    console.log('[networktest] fetch error', err && err.message ? err.message : err);
    resultEl.innerText = 'Error: ' + err.message;
  });
}

updateNetworkTestGlobalQ(0);
