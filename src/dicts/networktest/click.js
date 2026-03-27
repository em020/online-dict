"use strict";

// Force Youdao online dict all sections folded on first paint, then release control after their DOM has been initialized.
var forcedFoldBlocks = ['web', 'sentence', 'phrase'];
var pendingForcedFoldBlocks = forcedFoldBlocks.reduce(function(map, block) {
  map[block] = true;
  return map;
}, {});

function updateFoldOverrideStyle() {
  var style = document.getElementById('force-fold-web-sentence');
  if (!style) {
    return;
  }

  var selectors = forcedFoldBlocks.filter(function(block) {
    return pendingForcedFoldBlocks[block];
  }).map(function(block) {
    return '#' + block + '_body';
  });

  if (selectors.length === 0) {
    style.parentNode.removeChild(style);
    console.log('[networktest] fold override style removed');
    return;
  }

  style.textContent = selectors.join(', ') + ' { display: none !important; }';
  console.log('[networktest] fold override style updated', selectors.join(', '));
}

function injectFoldOverrideStyle() {
  if (document.getElementById('force-fold-web-sentence')) {
    return;
  }

  var style = document.createElement('style');
  style.id = 'force-fold-web-sentence';
  (document.head || document.documentElement).appendChild(style);
  updateFoldOverrideStyle();
  console.log('[networktest] fold override style injected');
}

function finalizeForcedFoldBlock(block) {
  if (!pendingForcedFoldBlocks[block]) {
    return;
  }

  var bodyEl = document.getElementById(block + '_body');
  if (!bodyEl) {
    return;
  }

  console.log('[networktest] first render detected for', block);

  if (typeof window.hideDefinition === 'function') {
    window.hideDefinition(block);
  } else {
    bodyEl.style.display = 'none';
  }

  if (typeof window.foldImg === 'function') {
    window.foldImg(block);
  }

  pendingForcedFoldBlocks[block] = false;
  updateFoldOverrideStyle();
}

function observeForcedFoldTargets() {
  if (typeof MutationObserver !== 'function') {
    console.log('[networktest] MutationObserver unavailable');
    return;
  }

  function hasPendingForcedFoldBlocks() {
    return forcedFoldBlocks.some(function(block) {
      return pendingForcedFoldBlocks[block];
    });
  }

  function finalizeAllForcedFoldBlocks() {
    forcedFoldBlocks.forEach(function(block) {
      finalizeForcedFoldBlock(block);
    });
  }

  var observer = new MutationObserver(function() {
    finalizeAllForcedFoldBlocks();

    if (!hasPendingForcedFoldBlocks()) {
      observer.disconnect();
      console.log('[networktest] fold observer disconnected');
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  finalizeAllForcedFoldBlocks();
}

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

injectFoldOverrideStyle();
observeForcedFoldTargets();
updateNetworkTestGlobalQ(0);
