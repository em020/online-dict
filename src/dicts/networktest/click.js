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

function splitSentenceCandidates(text) {
  var matches = String(text || '').match(/[^.!?。！？\n]+[.!?。！？\n]*/g);
  return matches || [];
}

function findNearestSentenceContext(text, selectionText) {
  var sentences = splitSentenceCandidates(text);
  var normalizedSelection = normalizeSelectionText(selectionText);

  if (sentences.length === 0) {
    return normalizeSelectionText(text);
  }

  for (var i = 0; i < sentences.length; i++) {
    var sentence = normalizeSelectionText(sentences[i]);
    if (!normalizedSelection || sentence.indexOf(normalizedSelection) !== -1) {
      return sentence;
    }
  }

  return normalizeSelectionText(sentences[0]);
}

function findSentenceSourceElement(node) {
  var current = node;

  if (!current) {
    return document.body || document.documentElement;
  }

  if (current.nodeType === 3) {
    current = current.parentNode;
  }

  while (current && current.nodeType === 1) {
    var tagName = current.tagName ? current.tagName.toUpperCase() : '';
    if (tagName === 'P' || tagName === 'LI' || tagName === 'DIV' || tagName === 'SPAN' || tagName === 'TD' || tagName === 'TH' || tagName === 'ARTICLE' || tagName === 'SECTION' || tagName === 'DD' || tagName === 'DT') {
      return current;
    }

    if (current === document.body || current === document.documentElement) {
      return current;
    }

    current = current.parentNode;
  }

  return document.body || document.documentElement;
}

// Walk text nodes in DOM order under sourceEl to compute the absolute character
// offset of (targetNode, targetOffset) within sourceEl's full text content.
// Returns -1 if targetNode cannot be found under sourceEl.
function getTextNodeOffset(sourceEl, targetNode, targetOffset) {
  if (!targetNode || !sourceEl) {
    return -1;
  }

  // If startContainer is an element node, resolve it to a child text node.
  var textNode = targetNode;
  var textOffset = targetOffset;
  if (targetNode.nodeType !== 3) {
    var child = targetNode.childNodes && targetNode.childNodes[targetOffset];
    if (child && child.nodeType === 3) {
      textNode = child;
      textOffset = 0;
    } else {
      return -1;
    }
  }

  var pos = 0;
  var walker = document.createTreeWalker(sourceEl, 4 /* SHOW_TEXT */, null, false);
  var node;
  while ((node = walker.nextNode())) {
    if (node === textNode) {
      return pos + textOffset;
    }
    pos += node.textContent.length;
  }

  return -1;
}

// Find the sentence whose character range contains the given absolute offset
// within text, using character positions rather than content matching.
function findSentenceAtOffset(text, offset) {
  var regex = /[^.!?。！？\n]+[.!?。！？\n]*/g;
  var match;
  var lastMatch = null;

  while ((match = regex.exec(text)) !== null) {
    lastMatch = match;
    var start = match.index;
    var end = start + match[0].length;
    if (offset >= start && offset < end) {
      return normalizeSelectionText(match[0]);
    }
  }

  // offset fell past the last sentence boundary (e.g. trailing whitespace)
  if (lastMatch) {
    return normalizeSelectionText(lastMatch[0]);
  }

  return normalizeSelectionText(text);
}

function getSelectionSentenceContext(selection, selectionText) {
  if (!selection || !selection.rangeCount) {
    return '';
  }

  var range = selection.getRangeAt(0);
  var sourceEl = findSentenceSourceElement(range.startContainer || selection.anchorNode || null);
  if (!sourceEl || !sourceEl.textContent) {
    return '';
  }

  var offset = getTextNodeOffset(sourceEl, range.startContainer, range.startOffset);
  if (offset >= 0) {
    return findSentenceAtOffset(sourceEl.textContent, offset);
  }

  // Fallback: word-match heuristic if offset resolution failed.
  return findNearestSentenceContext(sourceEl.textContent, selectionText);
}

function readFallbackSelectionLookup() {
  if (typeof window.getSelection !== 'function') {
    return null;
  }

  var rawSelection = window.getSelection();
  var selectionText = normalizeSelectionText(rawSelection);

  if (!selectionText) {
    return null;
  }

  return {
    selectionText: selectionText,
    context: getSelectionSentenceContext(rawSelection, selectionText)
  };
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
