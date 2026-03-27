"use strict";

function onNetworkTestClick() {
  var resultEl = document.getElementById('network-test-result');
  if (!resultEl) return;
  resultEl.innerText = 'Fetching...';
  
  fetch('https://cip.cc', {
    headers: { 'Accept': 'text/plain' }
  }).then(function(response) {
    return response.text();
  }).then(function(text) {
    resultEl.innerText = text;
  }).catch(function(err) {
    resultEl.innerText = 'Error: ' + err.message;
  });
}
