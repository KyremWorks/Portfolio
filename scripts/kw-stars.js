/* Decorative star field for the hero. Exposes window.KW.makeStars(count, seed),
   returning an array of React <span> elements. A seeded PRNG keeps the layout
   stable across re-renders so the stars don't jump around. */
(function () {
  window.KW = window.KW || {};

  function makeStars(count, seed) {
    var state = seed || 1;
    // Linear congruential generator — deterministic for a given seed.
    var random = function () { state = (state * 9301 + 49297) % 233280; return state / 233280; };
    var stars = [];
    for (var index = 0; index < count; index++) {
      var size = 1.5 + random() * 2.5;
      stars.push(window.React.createElement('span', { key: index, style: {
        position: 'absolute',
        left: (random() * 100) + '%',
        top: (random() * 100) + '%',
        width: size + 'px', height: size + 'px',
        borderRadius: '50%',
        background: '#C2942B',
        opacity: 0.3,
        animation: 'kw-twinkle ' + (3 + random() * 4) + 's ease-in-out ' + (random() * 4) + 's infinite'
      } }));
    }
    return stars;
  }

  KW.makeStars = makeStars;
})();
