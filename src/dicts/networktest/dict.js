"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

// selection-context.js
// Standalone browser utility: reads the current window selection and finds
// the surrounding sentence using DOM position rather than word matching.
//
// No external dependencies. Works as a plain <script> tag in any browser
// environment, or gets concatenated into a larger bundle via a build step.
//
// Public API
// ----------
//   SelectionContext.read()
//     Returns { selectionText: string, context: string } or null when nothing
//     is selected.
(function (global) {
  'use strict'; // ---------------------------------------------------------------------------
  // Text helpers
  // ---------------------------------------------------------------------------

  function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  } // Abbreviations whose trailing dot must never be treated as a sentence
  // boundary.  Built once at module load time.


  var ABBREV_RE = function () {
    var list = [// Titles
    'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Rev', 'Sr', 'Jr', 'Lt', 'Sgt', 'Cpl', 'Col', 'Gen', 'Capt', 'Gov', 'Sen', 'Rep', // Address
    'St', 'Ave', 'Blvd', 'Rd', 'Ln', // Common prose
    'vs', 'etc', 'approx', 'dept', 'est', 'vol', 'fig', 'no', // Calendar
    'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return new RegExp('\\b(' + list.join('|') + ')\\.', 'g');
  }(); // Placeholder replaces abbreviation dots so the sentence regex never sees them.
  // \x00 (null byte) won't appear in normal prose and is exactly 1 character,
  // so character offsets in the results stay valid against the original string.


  var ABBREV_DOT = '\x00'; // Split text into sentences, preserving the start/end character position of
  // each segment so callers can do position-based lookup.

  function splitSentencesWithPositions(text) {
    // Hide abbreviation dots before splitting, restore them in the output.
    var processed = text.replace(/\be\.g\./g, 'e' + ABBREV_DOT + 'g' + ABBREV_DOT).replace(/\bi\.e\./g, 'i' + ABBREV_DOT + 'e' + ABBREV_DOT).replace(ABBREV_RE, '$1' + ABBREV_DOT);
    var regex = /(?:\d+(?:\.\d+)+|[A-Z]\.|[^.!?。！？\n])+[.!?。！？\n]*/g;
    var results = [];
    var match;

    while ((match = regex.exec(processed)) !== null) {
      results.push({
        text: match[0].replace(/\x00/g, '.'),
        start: match.index,
        end: match.index + match[0].length
      });
    }

    return results;
  } // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------
  // Tags whose textContent is a reasonable sentence container. We stop
  // walking up at the first match (or at body/html if none matches).


  var BLOCK_TAGS = {
    P: 1,
    LI: 1,
    DIV: 1,
    SPAN: 1,
    TD: 1,
    TH: 1,
    ARTICLE: 1,
    SECTION: 1,
    DD: 1,
    DT: 1
  }; // Walk up the DOM from node to find the nearest block-like ancestor that
  // can serve as a sentence boundary container.

  function findSentenceSourceElement(node) {
    var current = node;

    if (!current) {
      return document.body || document.documentElement;
    }

    if (current.nodeType === 3) {
      current = current.parentNode;
    }

    while (current && current.nodeType === 1) {
      if (BLOCK_TAGS[(current.tagName || '').toUpperCase()]) {
        return current;
      }

      if (current === document.body || current === document.documentElement) {
        return current;
      }

      current = current.parentNode;
    }

    return document.body || document.documentElement;
  } // Walk text nodes under sourceEl in DOM order and return the absolute
  // character offset of (targetNode, targetOffset) within sourceEl's full
  // textContent. Returns -1 when targetNode is not a descendant of sourceEl.


  function getTextNodeOffset(sourceEl, targetNode, targetOffset) {
    if (!targetNode || !sourceEl) {
      return -1;
    } // When startContainer is an element (rare but possible), resolve it to
    // the child text node indicated by the offset index.


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
    var walker = document.createTreeWalker(sourceEl, 4
    /* SHOW_TEXT */
    , null, false);
    var node;

    while (node = walker.nextNode()) {
      if (node === textNode) {
        return pos + textOffset;
      }

      pos += node.textContent.length;
    }

    return -1;
  } // ---------------------------------------------------------------------------
  // Sentence lookup
  // ---------------------------------------------------------------------------
  // Return the sentence whose character range contains absoluteOffset.
  // Falls back to a word-match scan (fallbackWord) when the offset lands
  // between sentence boundaries, and to the first sentence otherwise.


  function findSentenceAtOffset(text, absoluteOffset, fallbackWord) {
    var sentences = splitSentencesWithPositions(text);

    if (sentences.length === 0) {
      return normalizeText(text);
    } // Primary: position-based lookup.


    for (var i = 0; i < sentences.length; i++) {
      var s = sentences[i];

      if (absoluteOffset >= s.start && absoluteOffset < s.end) {
        return normalizeText(s.text);
      }
    } // Offset sits at or past the last sentence's end (e.g. trailing whitespace).


    var last = sentences[sentences.length - 1];

    if (absoluteOffset >= last.end) {
      return normalizeText(last.text);
    } // Secondary: word-match fallback (used when offset resolution failed).


    if (fallbackWord) {
      var normalized = normalizeText(fallbackWord);

      for (var j = 0; j < sentences.length; j++) {
        var candidate = normalizeText(sentences[j].text);

        if (candidate.indexOf(normalized) !== -1) {
          return candidate;
        }
      }
    }

    return normalizeText(sentences[0].text);
  } // Given a Selection object and the already-normalized selectionText, return
  // the sentence in which the cursor (range start) sits.


  function getSentenceContext(selection, selectionText) {
    if (!selection || !selection.rangeCount) {
      return '';
    }

    var range = selection.getRangeAt(0);
    var sourceEl = findSentenceSourceElement(range.startContainer || selection.anchorNode || null);

    if (!sourceEl || !sourceEl.textContent) {
      return '';
    }

    var absoluteOffset = getTextNodeOffset(sourceEl, range.startContainer, range.startOffset);

    if (absoluteOffset >= 0) {
      // Happy path: precise position-based sentence lookup.
      return findSentenceAtOffset(sourceEl.textContent, absoluteOffset, null);
    } // Offset resolution failed (e.g. startContainer not under sourceEl).
    // Fall back to word-match heuristic.


    return findSentenceAtOffset(sourceEl.textContent, 0, selectionText);
  } // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------
  // Read the current window selection.
  // Returns { selectionText: string, context: string } or null.


  function read() {
    if (typeof window.getSelection !== 'function') {
      return null;
    }

    var sel = window.getSelection();
    var selectionText = normalizeText(sel);

    if (!selectionText) {
      return null;
    }

    return {
      selectionText: selectionText,
      context: getSentenceContext(sel, selectionText)
    };
  }

  global.SelectionContext = {
    read: read
  };
})(typeof window !== 'undefined' ? window : void 0);

"use strict"; // Force Youdao online dict all sections folded on first paint, then release control after their DOM has been initialized.


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
  document.addEventListener('dblclick', function () {
    window.setTimeout(function () {
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

  updateLatestSelectionLookup(); // triggerSelectionLookup();

  logSelectionDump('lookup_fab');
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
} // injectFoldOverrideStyle();
// observeForcedFoldTargets();
// updateNetworkTestGlobalQ(0);


injectGlobalDoubleClickListener();
injectSelectionLookupButton(); // window.eudic_clientCallback = () => {}

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

function eudic_onlineDictPlugin_injectGlobalStyles() {
  if (document.getElementById('eudic-online-dict-global-overrides')) {
    return;
  }

  var style = document.createElement('style');
  style.id = 'eudic-online-dict-global-overrides';
  style.textContent = "\n        .eudic_head_sentence {\n            white-space: nowrap !important;\n            overflow: hidden !important;\n            text-overflow: ellipsis !important;\n            display: block !important;\n            max-width: 100% !important;\n        }\n    ";
  (document.head || document.documentElement).appendChild(style);
  eudic_onlineDictPlugin_log('global-styles-injected');
}

eudic_onlineDictPlugin_injectGlobalStyles();

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