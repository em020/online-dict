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
    const scriptList = document.getElementsByTagName('script');
    if (!scriptList || scriptList.length === 0) {
        return null;
    }
    return scriptList[scriptList.length - 1];
}

function eudic_onlineDictPlugin_bindInput(item, func) {
    let lastTouchTime = 0;
    const handlerName = item.getAttribute('eudic-onlinedict-custom-onclick');

    if (item.getAttribute('data-eudic-onlinedict-bound') === '1') {
        eudic_onlineDictPlugin_log('already-bound', handlerName, item.tagName);
        return;
    }

    const invoke = function (event) {
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
        for (const item of itemList) {
            const itemFuncName = item.getAttribute('eudic-onlinedict-custom-onclick');
            const func = window[itemFuncName];
            eudic_onlineDictPlugin_log('bind-attempt', itemFuncName, typeof func);
            if (typeof func === 'function') {
                eudic_onlineDictPlugin_bindInput(item, func);
            }
        }
    }
}

function eudic_onlineDictPlugin_onloadFinish() {
    const currentScript = eudic_onlineDictPlugin_getCurrentScript();
    if (currentScript && currentScript.src) {
        const scriptId = eudic_onlineDictPlugin_getParameterByName('id', currentScript.src);
        eudic_onlineDictPlugin_log('onload', currentScript.src, scriptId);
        if (scriptId) {
            eudic_onlineDictPlugin_bindSection(
                document.getElementById('eudic-onlinedict-section-' + scriptId),
                scriptId
            );
            return;
        }
    } else {
        eudic_onlineDictPlugin_log('current-script-missing');
    }

    var sectionList = document.querySelectorAll('[id^="eudic-onlinedict-section-"]');
    eudic_onlineDictPlugin_log('fallback-scan', sectionList ? sectionList.length : 0);
    if (sectionList && sectionList.length > 0) {
        for (const sectionDom of sectionList) {
            const sectionId = sectionDom.id ? sectionDom.id.replace('eudic-onlinedict-section-', '') : '';
            eudic_onlineDictPlugin_bindSection(sectionDom, sectionId);
        }
    }
}

eudic_onlineDictPlugin_onloadFinish();
