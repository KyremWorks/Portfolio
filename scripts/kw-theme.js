/* Theme tokens and the colour-tween used by the lamplighter transition.
   Exposes window.KW.theme. The token values here must match the :root and
   html[data-theme="dark"] blocks in styles/base.css. */
(function () {
  window.KW = window.KW || {};

  var PALETTE = {
    light: { '--bg':'#ECEDF0','--surface-1':'#F5F6F8','--surface-2':'#ECEDF0','--ink':'#16171C','--muted':'#54585F','--line-rgb':'22,23,28','--nav-bg':'rgba(236,237,240,0.72)','--btn-bg':'#16171C','--btn-fg':'#ECEDF0','--input-focus':'#ffffff','--tl-line':'rgba(22,23,28,0.22)','--tl-node':'#16171C','--tl-hollow':'#ffffff' },
    dark:  { '--bg':'#111019','--surface-1':'#16141f','--surface-2':'#1a1825','--ink':'#ECEDF0','--muted':'#A7AAB6','--line-rgb':'236,237,240','--nav-bg':'rgba(16,15,24,0.74)','--btn-bg':'#ECEDF0','--btn-fg':'#16171C','--input-focus':'#23212e','--tl-line':'rgba(236,237,240,0.26)','--tl-node':'#ECEDF0','--tl-hollow':'#111019' }
  };

  // Parse a CSS colour into a tagged channel array so two colours of the same
  // shape can be interpolated component-by-component.
  function parseColor(input) {
    input = String(input).trim();
    if (input[0] === '#') {
      var hex = input.slice(1);
      if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
      return { type: 'hex', channels: [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)] };
    }
    if (input.indexOf('rgba') === 0 || input.indexOf('rgb') === 0) {
      return { type: 'rgba', channels: (input.match(/[\d.]+/g) || []).map(Number) };
    }
    // Bare comma list (e.g. the --line-rgb token "22,23,28").
    return { type: 'bare', channels: input.split(',').map(Number) };
  }

  function formatColor(color) {
    var round = Math.round;
    if (color.type === 'hex') return 'rgb(' + round(color.channels[0]) + ',' + round(color.channels[1]) + ',' + round(color.channels[2]) + ')';
    if (color.type === 'rgba') {
      var ch = color.channels;
      return 'rgba(' + round(ch[0]) + ',' + round(ch[1]) + ',' + round(ch[2]) + ',' + (ch[3] != null ? ch[3] : 1).toFixed(3) + ')';
    }
    return color.channels.map(round).join(',');
  }

  function lerpColor(fromColor, toColor, progress) {
    var from = parseColor(fromColor), to = parseColor(toColor);
    var channels = from.channels.map(function (value, index) {
      return value + ((to.channels[index] != null ? to.channels[index] : value) - value) * progress;
    });
    return formatColor({ type: from.type, channels: channels });
  }

  // Instant theme swap (used on first load to honour the saved preference).
  function apply(theme) {
    document.documentElement.dataset.theme = (theme === 'dark') ? 'dark' : 'light';
  }

  // Animated swap: tween every token on :root (and the night-sky opacity) over
  // `duration` ms, then drop the inline overrides so the stylesheet rules win.
  function applyAnimated(target, duration) {
    var toDark = target === 'dark';
    var fromPalette = toDark ? PALETTE.light : PALETTE.dark;
    var toPalette = toDark ? PALETTE.dark : PALETTE.light;
    var tokenNames = Object.keys(PALETTE.light);
    var rootStyle = document.documentElement.style;
    var nightSky = document.getElementById('night-sky');
    var skyFrom = nightSky ? (parseFloat(getComputedStyle(nightSky).opacity) || 0) : 0;
    var skyTo = toDark ? 0.96 : 0;
    var startTime = performance.now();
    var easeInOut = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
    var frame = function (now) {
      var progress = Math.min(1, (now - startTime) / duration);
      var eased = easeInOut(progress);
      for (var i = 0; i < tokenNames.length; i++) {
        rootStyle.setProperty(tokenNames[i], lerpColor(fromPalette[tokenNames[i]], toPalette[tokenNames[i]], eased));
      }
      if (nightSky) nightSky.style.opacity = String(skyFrom + (skyTo - skyFrom) * eased);
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        document.documentElement.dataset.theme = target;
        for (var j = 0; j < tokenNames.length; j++) rootStyle.removeProperty(tokenNames[j]);
      }
    };
    requestAnimationFrame(frame);
  }

  KW.theme = { PALETTE: PALETTE, apply: apply, applyAnimated: applyAnimated };
})();
