"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function eudic_onCambridgeDictClick(e) {
  var target = e.target;

  if (target && target.classList) {
    if (target.classList.contains('js-accord')) {
      target.classList.toggle('open');
      e.stopPropagation();
      e.preventDefault();
    }

    if (target.classList.contains('daccord_h')) {
      target.parentElement.classList.toggle('open');
      e.stopPropagation();
      e.preventDefault();
    }
  }
}

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