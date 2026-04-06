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

(function(global) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Text helpers
  // ---------------------------------------------------------------------------

  function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  // Abbreviations whose trailing dot must never be treated as a sentence
  // boundary.  Built once at module load time.
  var ABBREV_RE = (function() {
    var list = [
      // Titles
      'Mr', 'Mrs', 'Ms', 'Dr', 'Prof', 'Rev',
      'Sr', 'Jr', 'Lt', 'Sgt', 'Cpl', 'Col', 'Gen', 'Capt', 'Gov', 'Sen', 'Rep',
      // Address
      'St', 'Ave', 'Blvd', 'Rd', 'Ln',
      // Common prose
      'vs', 'etc', 'approx', 'dept', 'est', 'vol', 'fig', 'no',
      // Calendar
      'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return new RegExp('\\b(' + list.join('|') + ')\\.', 'g');
  }());

  // Placeholder replaces abbreviation dots so the sentence regex never sees them.
  // \x00 (null byte) won't appear in normal prose and is exactly 1 character,
  // so character offsets in the results stay valid against the original string.
  var ABBREV_DOT = '\x00';

  // Split text into sentences, preserving the start/end character position of
  // each segment so callers can do position-based lookup.
  function splitSentencesWithPositions(text) {
    // Hide abbreviation dots before splitting, restore them in the output.
    var processed = text
      .replace(/\be\.g\./g, 'e' + ABBREV_DOT + 'g' + ABBREV_DOT)
      .replace(/\bi\.e\./g, 'i' + ABBREV_DOT + 'e' + ABBREV_DOT)
      .replace(ABBREV_RE, '$1' + ABBREV_DOT);

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
  }

  // ---------------------------------------------------------------------------
  // DOM helpers
  // ---------------------------------------------------------------------------

  // Tags whose textContent is a reasonable sentence container. We stop
  // walking up at the first match (or at body/html if none matches).
  var BLOCK_TAGS = {
    P: 1, LI: 1, DIV: 1, SPAN: 1,
    TD: 1, TH: 1, ARTICLE: 1, SECTION: 1,
    DD: 1, DT: 1
  };

  // Walk up the DOM from node to find the nearest block-like ancestor that
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
  }

  // Walk text nodes under sourceEl in DOM order and return the absolute
  // character offset of (targetNode, targetOffset) within sourceEl's full
  // textContent. Returns -1 when targetNode is not a descendant of sourceEl.
  function getTextNodeOffset(sourceEl, targetNode, targetOffset) {
    if (!targetNode || !sourceEl) {
      return -1;
    }

    // When startContainer is an element (rare but possible), resolve it to
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

  // ---------------------------------------------------------------------------
  // Sentence lookup
  // ---------------------------------------------------------------------------

  // Return the sentence whose character range contains absoluteOffset.
  // Falls back to a word-match scan (fallbackWord) when the offset lands
  // between sentence boundaries, and to the first sentence otherwise.
  function findSentenceAtOffset(text, absoluteOffset, fallbackWord) {
    var sentences = splitSentencesWithPositions(text);
    if (sentences.length === 0) {
      return normalizeText(text);
    }

    // Primary: position-based lookup.
    for (var i = 0; i < sentences.length; i++) {
      var s = sentences[i];
      if (absoluteOffset >= s.start && absoluteOffset < s.end) {
        return normalizeText(s.text);
      }
    }

    // Offset sits at or past the last sentence's end (e.g. trailing whitespace).
    var last = sentences[sentences.length - 1];
    if (absoluteOffset >= last.end) {
      return normalizeText(last.text);
    }

    // Secondary: word-match fallback (used when offset resolution failed).
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
  }

  // Given a Selection object and the already-normalized selectionText, return
  // the sentence in which the cursor (range start) sits.
  function getSentenceContext(selection, selectionText) {
    if (!selection || !selection.rangeCount) {
      return '';
    }

    var range = selection.getRangeAt(0);
    var sourceEl = findSentenceSourceElement(
      range.startContainer || selection.anchorNode || null
    );
    if (!sourceEl || !sourceEl.textContent) {
      return '';
    }

    var absoluteOffset = getTextNodeOffset(
      sourceEl,
      range.startContainer,
      range.startOffset
    );

    if (absoluteOffset >= 0) {
      // Happy path: precise position-based sentence lookup.
      return findSentenceAtOffset(sourceEl.textContent, absoluteOffset, null);
    }

    // Offset resolution failed (e.g. startContainer not under sourceEl).
    // Fall back to word-match heuristic.
    return findSentenceAtOffset(sourceEl.textContent, 0, selectionText);
  }

  // ---------------------------------------------------------------------------
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

})(typeof window !== 'undefined' ? window : this);

