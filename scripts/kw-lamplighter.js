/* The lamplighter theme-transition animation. Exposes
   window.KW.lamplighter.playTransition(elements, target), where `elements`
   are the resolved overlay/veil/char/lamp/fire/glow nodes. Drives the sprite
   frames and hands the actual colour swap to KW.theme.applyAnimated. */
(function () {
  window.KW = window.KW || {};

  // One transition at a time — guards against a second toggle mid-animation.
  var animating = false;

  // The two sprite sheets are laid out as horizontal frame strips.
  function setLampFrame(lamp, frame) { if (lamp) lamp.style.backgroundPosition = (-(frame * 130)) + 'px 0'; }
  function setCharFrame(char, frame) { if (char) char.style.backgroundPosition = (-(frame * 200)) + 'px 0'; }

  function fadeElement(element, from, to, duration, onDone) {
    if (!element) { if (onDone) onDone(); return; }
    var startTime = performance.now();
    var step = function (now) {
      var progress = Math.min(1, (now - startTime) / duration);
      element.style.opacity = String(from + (to - from) * progress);
      if (progress < 1) requestAnimationFrame(step); else if (onDone) onDone();
    };
    requestAnimationFrame(step);
  }

  function playTransition(elements, target) {
    if (animating) return;
    animating = true;

    var toDark = target === 'dark';
    var overlay = elements.overlay, veil = elements.veil, fire = elements.fire;
    var glow = elements.glow, lamp = elements.lamp, char = elements.char;

    // No overlay (e.g. reduced markup) — fall back to an instant swap.
    if (!overlay) { document.documentElement.dataset.theme = target; animating = false; return; }

    setCharFrame(char, 0);
    setLampFrame(lamp, toDark ? 3 : 0);
    if (fire) fire.style.opacity = toDark ? '1' : '0';
    if (glow) glow.style.opacity = toDark ? '0.9' : '0';
    overlay.style.visibility = 'visible';
    overlay.style.opacity = '0';
    fadeElement(overlay, 0, 1, 420);
    fadeElement(veil, 0, 0.55, 420);

    var flickerTimer = null;
    var lampFlickerFrames = [2, 4, 6, 4, 3, 5, 7, 4];
    var startFlicker = function () {
      if (flickerTimer) return;
      var step = 0;
      flickerTimer = setInterval(function () {
        step++;
        setLampFrame(lamp, lampFlickerFrames[step % lampFlickerFrames.length]);
        if (fire) fire.style.backgroundImage = 'url(assets/fire' + ((step % 2) + 1) + '.png)';
      }, 110);
    };
    var stopFlicker = function () { if (flickerTimer) { clearInterval(flickerTimer); flickerTimer = null; } };
    if (toDark) startFlicker();

    var startTime = performance.now();
    var duration = 2000;
    var themeSwitched = false;
    var frame = function (now) {
      var progress = Math.min(1, (now - startTime) / duration);
      // Character walk-up then walk-away across the run.
      var charFrame;
      if (progress < 0.36) charFrame = Math.round((progress / 0.36) * 6);
      else if (progress < 0.6) charFrame = 6;
      else if (progress < 0.9) charFrame = 6 - Math.round(((progress - 0.6) / 0.3) * 6);
      else charFrame = 0;
      setCharFrame(char, Math.max(0, Math.min(10, charFrame)));

      // Swap the page colours partway through, behind the veil.
      if (!themeSwitched && progress >= 0.42) {
        themeSwitched = true;
        KW.theme.applyAnimated(target, 820);
        try { localStorage.setItem('kw-theme', target); } catch (e) {}
        if (toDark) {
          stopFlicker(); setLampFrame(lamp, 0);
          if (fire) fire.style.opacity = '0';
          if (glow) glow.style.opacity = '0';
        } else {
          setLampFrame(lamp, 1); startFlicker();
          if (fire) fire.style.opacity = '1';
          if (glow) glow.style.opacity = '0.95';
        }
      }

      if (progress >= 1) {
        stopFlicker();
        fadeElement(veil, 0.55, 0, 540);
        fadeElement(overlay, 1, 0, 540, function () {
          overlay.style.visibility = 'hidden';
          if (glow) glow.style.opacity = '0';
          animating = false;
        });
        return;
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  KW.lamplighter = { playTransition: playTransition };
})();
