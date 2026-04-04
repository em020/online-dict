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

var latestSelectionLookup = null;
var hasInjectedGlobalDoubleClickListener = false;

function normalizeSelectionText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function readFallbackSelectionLookup() {
  return SelectionContext.read();
}

function readCurrentSelectionLookup() {
  return readFallbackSelectionLookup();
}

function updateLatestSelectionLookup() {
  var currentSelection = readCurrentSelectionLookup();
  if (currentSelection) {
    latestSelectionLookup = currentSelection;
    console.log('[networktest] cached selection lookup', currentSelection.selectionText);
  } else {
    latestSelectionLookup = null;
  }
  return currentSelection;
}

function getCurrentSelectionLookup() {
  var selection = readCurrentSelectionLookup();

  if (!selection && latestSelectionLookup) {
    selection = latestSelectionLookup;
  }

  return selection;
}

function getSelectionLookupCommand() {
  var selection = getCurrentSelectionLookup();

  if (!selection) {
    console.log('[networktest] no selection available for lookup');
    return null;
  }

  var selectionText = selection.selectionText;
  var context = selection.context;

  if (typeof window.eudic_generateSearchWordCmd === 'function') {
    return window.eudic_generateSearchWordCmd(selectionText, context);
  }

  return 'cmd://dict/searchword?word=' + encodeURIComponent(selectionText);
}

function triggerSelectionLookup() {
  var cmd = getSelectionLookupCommand();
  if (!cmd) {
    return;
  }

  console.log('[networktest] selection lookup command', cmd);

  if (typeof window.eudic_clientCallback === 'function') {
    window.eudic_clientCallback(cmd);
    return;
  }

  window.location.href = cmd;
}

function updateSelectionLookupButtonState(button) {
  if (!button) {
    return;
  }

  var enabled = !!readCurrentSelectionLookup();
  if ('disabled' in button) {
    button.disabled = !enabled;
  }
  button.style.opacity = enabled ? '1' : '0.45';
  button.style.pointerEvents = enabled ? 'auto' : 'none';
}

function logSelectionDump(source) {
  var selection = getCurrentSelectionLookup();

  if (!selection) {
    console.log('[networktest] ' + source + ' selection unavailable');
    return;
  }

  console.log('[networktest] ' + source + ' selection dump', {
    word: selection.selectionText,
    sentence: selection.context || ''
  });
}

function injectGlobalDoubleClickListener() {
  if (hasInjectedGlobalDoubleClickListener) {
    return;
  }

  hasInjectedGlobalDoubleClickListener = true;

  document.addEventListener('dblclick', function() {
    window.setTimeout(function() {
      updateLatestSelectionLookup();
      logSelectionDump('dblclick');
    }, 0);
  }, true);

  console.log('[networktest] global dblclick listener injected');
}

function handleSelectionLookupButtonPress(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  updateLatestSelectionLookup();
  // triggerSelectionLookup();
  logSelectionDump('lookup_fab')
}

function injectSelectionLookupButton() {
  if (document.getElementById('networktest-selection-lookup-button')) {
    return;
  }

  var scrollToTop = document.getElementById('scrollToTop');
  if (!scrollToTop) {
    return;
  }

  var button;

  var listItem = document.createElement('li');
  listItem.id = 'networktest-selection-lookup-button';
  listItem.title = '查找选中内容';

  var iconBox = document.createElement('span');
  iconBox.className = 'imgBox';
  iconBox.style.display = 'flex';
  iconBox.style.alignItems = 'center';
  iconBox.style.justifyContent = 'center';

  var iconText = document.createElement('span');
  iconText.innerText = '查';
  iconText.style.display = 'block';
  iconText.style.fontSize = '16px';
  iconText.style.fontWeight = '700';
  iconText.style.color = 'rgb(47, 47, 47)';

  iconBox.appendChild(iconText);
  listItem.appendChild(iconBox);

  var scrollBtn = document.getElementById('scrollBtn');
  if (scrollBtn && scrollBtn.parentNode === scrollToTop) {
    scrollToTop.insertBefore(listItem, scrollBtn.nextSibling);
  } else {
    scrollToTop.appendChild(listItem);
  }

  button = listItem;

  button.addEventListener('mousedown', handleSelectionLookupButtonPress);
  button.addEventListener('touchstart', handleSelectionLookupButtonPress, {
    passive: false
  });
  button.addEventListener('click', function(event) {
    event.preventDefault();
    event.stopPropagation();
  });

  updateSelectionLookupButtonState(button);

  document.addEventListener('selectionchange', function() {
    updateLatestSelectionLookup();
    updateSelectionLookupButtonState(button);
  });

  document.addEventListener('mouseup', function() {
    updateLatestSelectionLookup();
    updateSelectionLookupButtonState(button);
  });

  document.addEventListener('touchend', function() {
    window.setTimeout(function() {
      updateLatestSelectionLookup();
      updateSelectionLookupButtonState(button);
    }, 0);
  });

  console.log('[networktest] selection lookup button injected');
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

// injectFoldOverrideStyle();
// observeForcedFoldTargets();
// updateNetworkTestGlobalQ(0);
injectGlobalDoubleClickListener();
injectSelectionLookupButton();
// window.eudic_clientCallback = () => {}
