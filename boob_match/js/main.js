var Match3 = Match3 || {};

var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
var low = /(?:[?&])quality=low(?:&|$)/.test(location.search) || (mobile &&
  ((navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2)));
Match3.performanceConfig = { low: low, maxParticles: low ? 72 : 120, burstCount: low ? 6 : 10 };
// Keep a bounded pixel budget; SHOW_ALL stretches the logical canvas to the viewport.
var renderFactor = mobile || low ? Math.min(1, (low ? 720 : 960) / Math.max(window.innerWidth, window.innerHeight)) : 1;
Match3.game = new Phaser.Game(Math.round(window.innerWidth * renderFactor), Math.round(window.innerHeight * renderFactor), Phaser.AUTO);

Match3.game.state.add('Boot', Match3.BootState);
Match3.game.state.add('Preload', Match3.PreloadState);
Match3.game.state.add('Game', Match3.GameState);

Match3.game.state.start('Boot');
