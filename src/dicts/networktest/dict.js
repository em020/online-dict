"use strict"; // Force Youdao online dict all sections folded on first paint, then release control after their DOM has been initialized.

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

var forcedFoldBlocks = ['web', 'sentence', 'phrase'];
var pendingForcedFoldBlocks = forcedFoldBlocks.reduce(function (map, block) {
  map[block] = true;
  return map;
}, {});

function updateFoldOverrideStyle() {
  var style = document.getElementById('force-fold-web-sentence');

  if (!style) {
    return;
  }

  var selectors = forcedFoldBlocks.filter(function (block) {
    return pendingForcedFoldBlocks[block];
  }).map(function (block) {
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
    return forcedFoldBlocks.some(function (block) {
      return pendingForcedFoldBlocks[block];
    });
  }

  function finalizeAllForcedFoldBlocks() {
    forcedFoldBlocks.forEach(function (block) {
      finalizeForcedFoldBlock(block);
    });
  }

  var observer = new MutationObserver(function () {
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
    window.setTimeout(function () {
      updateNetworkTestGlobalQ(attempt + 1);
    }, 300);
  }
}

var latestSelectionLookup = null;

function readCurrentSelectionLookup() {
  var selectionText = '';
  var context = '';

  if (typeof window.eudicGetSelection === 'function') {
    var selection = window.eudicGetSelection();
    selectionText = selection && selection.selectionText ? String(selection.selectionText).trim() : '';
    context = selection && selection.context ? String(selection.context) : '';
  } else if (typeof window.getSelection === 'function') {
    selectionText = String(window.getSelection()).trim();
  }

  if (!selectionText) {
    return null;
  }

  return {
    selectionText: selectionText,
    context: context
  };
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

function getSelectionLookupCommand() {
  var selection = readCurrentSelectionLookup();

  if (!selection && latestSelectionLookup) {
    selection = latestSelectionLookup;
  }

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

function handleSelectionLookupButtonPress(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  updateLatestSelectionLookup();
  triggerSelectionLookup();
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
  button.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
  });
  updateSelectionLookupButtonState(button);
  document.addEventListener('selectionchange', function () {
    updateLatestSelectionLookup();
    updateSelectionLookupButtonState(button);
  });
  document.addEventListener('mouseup', function () {
    updateLatestSelectionLookup();
    updateSelectionLookupButtonState(button);
  });
  document.addEventListener('touchend', function () {
    window.setTimeout(function () {
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
  }).then(function (response) {
    console.log('[networktest] fetch response', response.status, response.statusText);
    return response.text();
  }).then(function (response) {
    console.log('[networktest] response text length', response.length);
    resultEl.innerText = response;
  })["catch"](function (err) {
    console.log('[networktest] fetch error', err && err.message ? err.message : err);
    resultEl.innerText = 'Error: ' + err.message;
  });
}

injectFoldOverrideStyle();
observeForcedFoldTargets();
updateNetworkTestGlobalQ(0);
injectSelectionLookupButton();

function eudic_onlineDictPlugin_getParameterByName(name, url) {
  name = name.replace(/[\[\]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function eudic_onlineDictPlugin_log() {
  if (typeof console === 'undefined' || typeof console.log !== 'function') {
    return;
  }

  var args = Array.prototype.slice.call(arguments);
  args.unshift('[eudic-dict]');
  console.log.apply(console, args);
}

function eudic_onlineDictPlugin_getCurrentScript() {
  if (document.currentScript) {
    return document.currentScript;
  }

  var scriptList = document.getElementsByTagName('script');

  if (!scriptList || scriptList.length === 0) {
    return null;
  }

  return scriptList[scriptList.length - 1];
}

function eudic_onlineDictPlugin_bindInput(item, func) {
  var lastTouchTime = 0;
  var handlerName = item.getAttribute('eudic-onlinedict-custom-onclick');

  if (item.getAttribute('data-eudic-onlinedict-bound') === '1') {
    eudic_onlineDictPlugin_log('already-bound', handlerName, item.tagName);
    return;
  }

  var invoke = function invoke(event) {
    eudic_onlineDictPlugin_log('invoke', handlerName, event ? event.type : 'unknown');
    return func.call(this, event);
  };

  item.onclick = function (event) {
    eudic_onlineDictPlugin_log('onclick', handlerName, Date.now() - lastTouchTime);

    if (Date.now() - lastTouchTime < 500) {
      eudic_onlineDictPlugin_log('skip-click-after-touch', handlerName);
      return;
    }

    return invoke.call(this, event);
  };

  item.ontouchstart = function (event) {
    lastTouchTime = Date.now();
    eudic_onlineDictPlugin_log('ontouchstart', handlerName);
    return invoke.call(this, event);
  };

  item.ontouchend = function (event) {
    lastTouchTime = Date.now();
    eudic_onlineDictPlugin_log('ontouchend', handlerName);
    return invoke.call(this, event);
  };

  item.setAttribute('data-eudic-onlinedict-bound', '1');
  eudic_onlineDictPlugin_log('bound', handlerName, item.tagName);
}

function eudic_onlineDictPlugin_bindSection(sectionDom, sectionId) {
  if (!sectionDom) {
    eudic_onlineDictPlugin_log('section-missing', sectionId);
    return;
  }

  var itemList = sectionDom.querySelectorAll('[eudic-onlinedict-custom-onclick]');
  eudic_onlineDictPlugin_log('section-found', sectionId || 'unknown', itemList ? itemList.length : 0);

  if (itemList && itemList.length > 0) {
    var _iterator = _createForOfIteratorHelper(itemList),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var item = _step.value;
        var itemFuncName = item.getAttribute('eudic-onlinedict-custom-onclick');
        var func = window[itemFuncName];
        eudic_onlineDictPlugin_log('bind-attempt', itemFuncName, _typeof(func));

        if (typeof func === 'function') {
          eudic_onlineDictPlugin_bindInput(item, func);
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
  }
}

function eudic_onlineDictPlugin_onloadFinish() {
  var currentScript = eudic_onlineDictPlugin_getCurrentScript();

  if (currentScript && currentScript.src) {
    var scriptId = eudic_onlineDictPlugin_getParameterByName('id', currentScript.src);
    eudic_onlineDictPlugin_log('onload', currentScript.src, scriptId);

    if (scriptId) {
      eudic_onlineDictPlugin_bindSection(document.getElementById('eudic-onlinedict-section-' + scriptId), scriptId);
      return;
    }
  } else {
    eudic_onlineDictPlugin_log('current-script-missing');
  }

  var sectionList = document.querySelectorAll('[id^="eudic-onlinedict-section-"]');
  eudic_onlineDictPlugin_log('fallback-scan', sectionList ? sectionList.length : 0);

  if (sectionList && sectionList.length > 0) {
    var _iterator2 = _createForOfIteratorHelper(sectionList),
        _step2;

    try {
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        var sectionDom = _step2.value;
        var sectionId = sectionDom.id ? sectionDom.id.replace('eudic-onlinedict-section-', '') : '';
        eudic_onlineDictPlugin_bindSection(sectionDom, sectionId);
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
  }
}

eudic_onlineDictPlugin_onloadFinish();