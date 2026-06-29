/* The little pixel character that paces the stage above the work CTA.
   Exposes window.KW.startPlayer(stageElement, playerElement) -> { stop }.

   It runs a tiny platformer state machine (idle / walk / air / grab / flee):
   the sprite walks, hops, can be grabbed and dragged with the pointer, and
   flees when the cursor (the "giant hand") gets close. Positions and sprite
   frames are written straight to the element each animation frame. */
(function () {
  window.KW = window.KW || {};

  function startPlayer(stage, player) {
    if (!stage || !player) return { stop: function () {} };

    var SPRITE = 76;
    // Sprite-sheet frame indices per animation.
    var FRAMES = { idle: [0, 1, 2, 3, 4], run: [7, 8, 9, 10, 11, 12, 13, 14], jump: [15, 16, 17, 18, 19, 20, 21, 22], fall: [23, 24, 25, 26, 27, 28], stand: [29] };
    var setFrame = function (index) { player.style.backgroundPositionX = (-(index * SPRITE)) + 'px'; };

    // --- physics ---
    var APEX = 2.0 * SPRITE;               // apex = twice the player's height
    var GRAV_UP = 1500;                    // gravity while rising (px/s^2) -> "gravity 1"
    var GRAV_DOWN = GRAV_UP * 2;           // gravity while falling -> "gravity x2"
    var JUMP_V = Math.sqrt(2 * GRAV_UP * APEX); // launch velocity to reach apex
    var FLEE_RADIUS = 120;                 // how close the cursor must get to spook it
    var MIN_X = 4;
    var maxX = function () { return Math.max(MIN_X, stage.clientWidth - SPRITE - MIN_X); };
    var walkSpeed = function () { return (stage.clientWidth || 520) / 2.78; }; // full width in ~2.8s

    var state = 'idle', posX = MIN_X, posY = 0, velY = 0, facing = 1, velX = 0, resumeState = 'walkR', jumpedMidWalk = false, grabbing = false;
    var hopTimer = 0, fleeCooldown = 0, cursorX = -9999, cursorY = -9999, escaping = 0, hopGap = 0.6;
    var stateTime = 0, lastTime = performance.now();
    var rafId = null;

    // --- grab with the mouse / touch (only within the stage above the contact box) ---
    var onPointerMove = function (event) {
      if (!grabbing) return;
      var rect = stage.getBoundingClientRect();
      posX = Math.max(MIN_X, Math.min(maxX(), event.clientX - rect.left - SPRITE / 2));
      posY = Math.max(0, Math.min(rect.height, (rect.bottom - event.clientY) - SPRITE / 2));
    };
    var onPointerDown = function (event) {
      grabbing = true; state = 'grab'; velY = 0; velX = 0;
      player.style.cursor = 'grabbing';
      try { player.setPointerCapture(event.pointerId); } catch (_) {}
      onPointerMove(event);
      event.preventDefault();
    };
    var onPointerUp = function (event) {
      if (!grabbing) return;
      grabbing = false;
      player.style.cursor = 'grab';
      try { player.releasePointerCapture(event.pointerId); } catch (_) {}
      velY = 0; velX = 0; resumeState = 'idle';
      state = (posY <= 0) ? 'idle' : 'air';   // falls, then resumes the loop once it lands
      stateTime = 0;
    };
    var onDocPointerMove = function (event) { cursorX = event.clientX; cursorY = event.clientY; };

    player.addEventListener('pointerdown', onPointerDown);
    player.addEventListener('pointermove', onPointerMove);
    player.addEventListener('pointerup', onPointerUp);
    player.addEventListener('pointercancel', onPointerUp);
    document.addEventListener('pointermove', onDocPointerMove);

    var frame = function (now) {
      var deltaTime = Math.min(0.05, (now - lastTime) / 1000); lastTime = now;
      stateTime += deltaTime;
      var walk = walkSpeed(), maxXNow = maxX();
      var frameIndex = FRAMES.idle[0];

      if (state === 'grab') {
        frameIndex = FRAMES.jump[FRAMES.jump.length - 1];   // arms-up while held
        setFrame(frameIndex);
        player.style.left = posX + 'px';
        player.style.transform = 'translateY(' + (-posY) + 'px) scaleX(' + facing + ')';
        rafId = requestAnimationFrame(frame);
        return;
      }

      // react to the cursor as if the giant hand were chasing it
      var rect = stage.getBoundingClientRect();
      var playerCenterX = posX + SPRITE / 2;
      var cursorRelX = cursorX - rect.left;
      var cursorNear = cursorX > rect.left - 40 && cursorX < rect.right + 40 && cursorY > rect.top - 70 && cursorY < rect.bottom + 30;
      var shouldFlee = cursorNear && Math.abs(cursorRelX - playerCenterX) < FLEE_RADIUS;
      if (shouldFlee && state !== 'grab' && state !== 'flee') { state = 'flee'; stateTime = 0; hopTimer = 0; hopGap = 0.5; escaping = 0; if (posY <= 0) velY = JUMP_V; }

      if (state === 'idle') {
        frameIndex = FRAMES.idle[Math.floor(stateTime * 7) % FRAMES.idle.length];
        if (stateTime > 0.8) { state = 'walkR'; facing = 1; jumpedMidWalk = false; stateTime = 0; }
      } else if (state === 'walkR') {
        posX += walk * deltaTime; facing = 1;
        frameIndex = FRAMES.run[Math.floor(stateTime * 12) % FRAMES.run.length];
        if (!jumpedMidWalk && posX >= MIN_X + (maxXNow - MIN_X) * 0.42) { state = 'air'; velY = JUMP_V; velX = walk; resumeState = 'walkR'; jumpedMidWalk = true; stateTime = 0; }
        else if (posX >= maxXNow) { posX = maxXNow; facing = -1; state = 'air'; velY = JUMP_V; velX = -walk; resumeState = 'walkL'; stateTime = 0; }
      } else if (state === 'walkL') {
        posX -= walk * deltaTime; facing = -1;
        frameIndex = FRAMES.run[Math.floor(stateTime * 12) % FRAMES.run.length];
        if (posX <= MIN_X) { posX = MIN_X; state = 'idle'; stateTime = 0; }
      } else if (state === 'air') {
        velY -= (velY > 0 ? GRAV_UP : GRAV_DOWN) * deltaTime;
        posY += velY * deltaTime; posX += velX * deltaTime;
        if (posX > maxXNow) { posX = maxXNow; velX = 0; }
        if (posX < MIN_X) { posX = MIN_X; velX = 0; }
        frameIndex = velY > 0 ? FRAMES.jump[Math.floor(stateTime * 18) % FRAMES.jump.length]
                              : FRAMES.fall[Math.floor(stateTime * 16) % FRAMES.fall.length];
        if (posY <= 0) { posY = 0; state = resumeState; stateTime = 0; }
      } else if (state === 'flee') {
        var onGround = posY <= 0;
        // commit to a single escape leap when backed into a wall (prevents corner jitter)
        if (onGround && !escaping) {
          if (posX >= maxXNow - 2 && playerCenterX >= cursorRelX) { escaping = -1; velY = JUMP_V; hopTimer = 0; }
          else if (posX <= MIN_X + 2 && playerCenterX < cursorRelX) { escaping = 1; velY = JUMP_V; hopTimer = 0; }
        }
        var direction = escaping ? escaping : (playerCenterX >= cursorRelX ? 1 : -1);   // flee away from cursor, unless mid-escape
        facing = direction;
        var fleeSpeed = walkSpeed() * (escaping ? 2.1 : 1.55);
        // alternate running and jumping instead of constant hopping
        if (onGround) {
          hopTimer += deltaTime;
          if (!escaping && hopTimer > hopGap) { velY = JUMP_V * (0.72 + Math.random() * 0.22); hopTimer = 0; hopGap = 0.55 + Math.random() * 0.6; }
        }
        velY -= (velY > 0 ? GRAV_UP : GRAV_DOWN) * deltaTime;
        posY += velY * deltaTime; if (posY < 0) { posY = 0; if (velY < 0) velY = 0; }
        posX += direction * fleeSpeed * deltaTime; posX = Math.max(MIN_X, Math.min(maxXNow, posX));
        if (escaping && posY <= 0) escaping = 0;                          // escape leap finished on landing
        frameIndex = posY > 0 ? (velY > 0 ? FRAMES.jump[Math.floor(stateTime * 18) % FRAMES.jump.length]
                                          : FRAMES.fall[Math.floor(stateTime * 16) % FRAMES.fall.length])
                              : FRAMES.run[Math.floor(stateTime * 15) % FRAMES.run.length];
        if (!shouldFlee) { fleeCooldown += deltaTime; if (fleeCooldown > 0.45 && onGround) { state = 'idle'; resumeState = 'walkR'; escaping = 0; stateTime = 0; fleeCooldown = 0; } }
        else fleeCooldown = 0;
      }

      setFrame(frameIndex);
      player.style.left = posX + 'px';
      player.style.transform = 'translateY(' + (-posY) + 'px) scaleX(' + facing + ')';
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return {
      stop: function () {
        if (rafId) cancelAnimationFrame(rafId);
        document.removeEventListener('pointermove', onDocPointerMove);
      }
    };
  }

  KW.startPlayer = startPlayer;
})();
