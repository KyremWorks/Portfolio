/* Card content + media for the Work and Pixel-art sections.
   ============================================================================
   TO ADD A CARD: append an entry to KW.content.projects or .commissions below.
   Each one is rendered by the <sc-for> loops in index.html; the media element
   (hover-to-play video/gif or a static image) is built by the matching
   build*Media() function, so no template changes are needed.
   ============================================================================
   Exposes window.KW.content, KW.buildProjectMedia(project),
   KW.buildCommissionMedia(commission). React is read at call time because the
   UMD bundle loads after these deferred scripts. */
(function () {
  window.KW = window.KW || {};

  // Project card fields: title, kind (corner badge), desc, tags[], link, img
  // (poster). previewGif (or `preview` video) plays on hover.
  // Commission fields: src, isVideo, label (corner badge), title; videos add a
  // poster shown until hover.
  KW.content = {
    projects: [
      {
        title: "A Lamplighter's Destiny",
        kind: "Game Jam",
        desc: "A short stealth platformer I made for the Brackeys 2026.1 Jam, with a bit of The Little Prince in it. You hide in the shadows while the Lamplighter's light is on and run when it goes dark. The goal is simple: get home.",
        tags: ["Brackeys 2026.1", "#264 / 1320", "Pixel art"],
        link: "https://kyremworks.itch.io/a-lamplighters-destiny",
        img: "assets/lamplighter.png",
        previewGif: "assets/gameplay-lamplighter.gif"
      },
      {
        title: "Grand Theft Hotdog",
        kind: "Long-term",
        desc: "You stole a hotdog and now a giant hand wants it back. It's fast. You play Frank, a truck driver running and jumping past traps to get away. It's still a prototype, and I keep adding to it with every devlog.",
        tags: ["In development", "Long-term"],
        link: "https://kyremworks.itch.io/grand-theft-hotdog",
        img: "assets/gth.png",
        previewGif: "assets/gameplay-gth.gif"
      }
    ],
    commissions: [
      { src: "assets/px-tavern.png", isVideo: false, label: "Final result", title: "Tavern interior" },
      { src: "assets/px-lab-lapse.mp4", poster: "assets/px-lab-poster.png", isVideo: true, label: "Timelapse", title: "Abandoned laboratory" },
      { src: "assets/px-forest-lapse.mp4", poster: "assets/px-forest-poster.png", isVideo: true, label: "Timelapse", title: "Parallax Forest" }
    ]
  };

  var FILL = { width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated', display: 'block' };
  var HOVER_BADGE = { fontFamily: "'Hanken Grotesk',sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em', padding: '6px 12px', borderRadius: '100px', pointerEvents: 'none' };

  // ---- Project media: poster + badge over a hover-played gif/video ----
  function buildProjectMedia(project) {
    var React = window.React;
    var badgeStyle = Object.assign({ position: 'absolute', bottom: 14, right: 16, zIndex: 3, background: 'rgba(15,16,20,0.78)', backdropFilter: 'blur(4px)', color: '#ECEDF0', transition: 'opacity .25s ease' }, HOVER_BADGE);

    var play = function (event) {
      var wrap = event.currentTarget;
      var video = wrap.querySelector('video');
      var gif = wrap.querySelector('[data-gif]');
      if (video) { if (!video.getAttribute('src') && video.dataset.src) { video.setAttribute('src', video.dataset.src); } video.play().catch(function () {}); }
      if (gif) { var poster = wrap.querySelector('[data-poster]'); var badge = wrap.querySelector('[data-badge]'); if (poster) poster.style.opacity = '0'; if (badge) badge.style.opacity = '0'; }
    };
    var stop = function (event) {
      var wrap = event.currentTarget;
      var video = wrap.querySelector('video');
      var poster = wrap.querySelector('[data-poster]');
      var badge = wrap.querySelector('[data-badge]');
      if (video) { video.pause(); video.currentTime = 0; }
      if (poster) poster.style.opacity = '1';
      if (badge) badge.style.opacity = '1';
    };
    // Lazy-loaded videos reveal the poster the moment they actually start.
    var onPlaying = function (event) {
      var wrap = event.currentTarget.parentElement;
      var poster = wrap.querySelector('[data-poster]');
      var badge = wrap.querySelector('[data-badge]');
      if (poster) poster.style.opacity = '0';
      if (badge) badge.style.opacity = '0';
    };

    var underlay = project.previewGif
      ? React.createElement('img', { key: 'v', 'data-gif': true, src: project.previewGif, alt: project.title + ' gameplay', style: Object.assign({}, FILL, { position: 'absolute', inset: 0 }) })
      : React.createElement('video', { key: 'v', 'data-src': project.preview, loop: true, muted: true, playsInline: true, preload: 'none', onPlaying: onPlaying, style: Object.assign({}, FILL, { position: 'absolute', inset: 0 }) });

    return React.createElement('div', { onMouseEnter: play, onMouseLeave: stop, style: { position: 'relative', width: '100%', height: '100%', cursor: 'pointer' } },
      underlay,
      React.createElement('img', { key: 'p', 'data-poster': true, src: project.img, alt: project.title, style: Object.assign({}, FILL, { position: 'absolute', inset: 0, transition: 'opacity .3s ease', zIndex: 2 }) }),
      React.createElement('div', { key: 'h', 'data-badge': true, style: badgeStyle }, '▶  Hover to play')
    );
  }

  // ---- Commission media: static image, or a hover-played video with poster ----
  function buildCommissionMedia(commission) {
    var React = window.React;
    var enter = function (event) { var video = event.currentTarget.querySelector('video'); var poster = event.currentTarget.querySelector('img'); if (video) { video.play(); } if (poster) { poster.style.opacity = '0'; } };
    var leave = function (event) { var video = event.currentTarget.querySelector('video'); var poster = event.currentTarget.querySelector('img'); if (video) { video.pause(); video.currentTime = 0; } if (poster) { poster.style.opacity = '1'; } };

    if (!commission.isVideo) {
      return React.createElement('img', { src: commission.src, alt: commission.title, style: FILL });
    }
    return React.createElement('div', { onMouseEnter: enter, onMouseLeave: leave, style: { position: 'relative', width: '100%', height: '100%', cursor: 'pointer' } },
      React.createElement('video', { key: 'v', src: commission.src, loop: true, muted: true, playsInline: true, preload: 'auto', style: Object.assign({}, FILL, { position: 'absolute', inset: 0 }) }),
      React.createElement('img', { key: 'p', src: commission.poster, alt: commission.title, style: Object.assign({}, FILL, { position: 'absolute', inset: 0, transition: 'opacity .25s ease', zIndex: 2 }) }),
      React.createElement('div', { key: 'h', style: Object.assign({ position: 'absolute', bottom: 12, right: 14, zIndex: 3, background: 'rgba(15,16,20,0.78)', backdropFilter: 'blur(4px)', color: '#ECEDF0' }, HOVER_BADGE) }, '▶  Hover to play')
    );
  }

  KW.buildProjectMedia = buildProjectMedia;
  KW.buildCommissionMedia = buildCommissionMedia;
})();
