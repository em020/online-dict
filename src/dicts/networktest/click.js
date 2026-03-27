"use strict";

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
