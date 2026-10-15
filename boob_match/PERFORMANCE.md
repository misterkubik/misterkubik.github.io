# Mobile performance

The particle pool adapts the design in `../softgames/src/components/particle-emitter.ts`
to Phaser 2: reusable sprites, weighted configurations, randomized spawn parameters,
and shared scale/alpha/velocity curves. No Pixi or GSAP dependency is added.
Only the burst features used by this game are implemented. Delta time is in seconds.

- Normal effects: 10 particles per burst, at most 120 active particles.
- Low effects: 6 per burst, at most 72 active particles; overflow is skipped.
- `?quality=low` forces low mode. Low-end mobile device hints also enable it.
- After 120 active frames, more than 30 frames over 28 ms lowers particle quality.
  Animations and gameplay rules remain the same. Quality stays low until reload.
- Mobile render size is capped at 960 px on the long edge; low mode uses 720 px.
  Phaser SHOW_ALL preserves display sizing. The cap is selected at page load.
- One 2048x1520 atlas contains all 845 poses plus cell/cloud textures. Transparent
  margins are trimmed, original frame offsets preserved, and borders extruded.
  Base RGBA size is 11.88 MiB versus 32.23 MiB for the five original pose sheets;
  this excludes driver overhead, decoded images, and any GPU copies.
- Original source images are kept for reproducible rebuilding, but not loaded at runtime.
- DOM layout is updated on resize/scroll/Phaser size changes, not each game frame.
- Hint candidates are cached for a stable board. Animation blending uses scalar
  accumulators; spring integration uses substeps of at most 1/120 second.

## Rebuild the atlas

Requires Python and Pillow:

```sh
python3 tools/build_assets.py
```

## Checks

```sh
node tests/performance.unit.cjs
python3 -m http.server 8770 --bind 127.0.0.1
# In another terminal, with Playwright and its Chromium installed:
node tests/game.browser.cjs
node tests/performance.browser.cjs
```

Optional environment variables: `GAME_URL`, `PLAYWRIGHT_MODULE`, `CHROME_BIN`.
The performance browser check uses a mobile viewport, low quality, and CPU throttle
x4. It checks bounded/reused particles, repeated shuffles, stable cells, hints,
and infrequent layout reads. Frame intervals are diagnostic, not a mobile FPS guarantee.
A physical low-end Android/iPhone still needs testing for GPU load and thermal throttling.
