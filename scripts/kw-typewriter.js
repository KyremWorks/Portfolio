/* Hero headline typewriter. Exposes window.KW.startTypewriter(getWordEl),
   which cycles through the words: type out, hold, erase, advance, repeat.
   `getWordEl` is a getter (not the node) so a re-rendered element still works.
   Returns a controller with stop() for cleanup on unmount. */
(function () {
  window.KW = window.KW || {};

  function startTypewriter(getWordEl) {
    var words = ['life', 'energy', 'method'];
    var wordIndex = 0;
    var TYPE_MS = 78, ERASE_MS = 42, HOLD_MS = 2000, GAP_MS = 220;
    var timer = null;

    var erase = function () {
      var word = words[wordIndex];
      var count = word.length;
      var step = function () {
        var el = getWordEl();
        if (!el) return;
        el.textContent = word.slice(0, count);
        count--;
        if (count >= 0) {
          timer = setTimeout(step, ERASE_MS);
        } else {
          wordIndex = (wordIndex + 1) % words.length;
          timer = setTimeout(type, GAP_MS);
        }
      };
      step();
    };

    var type = function () {
      var word = words[wordIndex];
      var count = 1;
      var step = function () {
        var el = getWordEl();
        if (!el) return;
        el.textContent = word.slice(0, count);
        if (count < word.length) {
          count++;
          timer = setTimeout(step, TYPE_MS);
        } else {
          timer = setTimeout(erase, HOLD_MS);
        }
      };
      step();
    };

    var first = getWordEl();
    if (first) first.textContent = words[0];
    timer = setTimeout(erase, HOLD_MS);

    return { stop: function () { if (timer) clearTimeout(timer); } };
  }

  KW.startTypewriter = startTypewriter;
})();
