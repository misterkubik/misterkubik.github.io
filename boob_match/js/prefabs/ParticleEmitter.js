var Match3 = Match3 || {};
// Phaser adaptation of softgames/src/components/particle-emitter.ts:
// a bounded sprite pool, randomized spawn parameters and shared lifetime curves.
Match3.ParticleEmitter = function(game, options) {
  options = options || {};
  this.group = game.add.group();
  this.particles = [];
  this.configs = [];
  this.totalChance = 0;
  this.cursor = 0;
  this.activeCount = 0;
  this.limit = options.maxParticles || 120;
  this.capacity = this.limit;
  this.skipped = 0;
  for (var i = 0; i < this.capacity; i++) {
    var sprite = new Phaser.Sprite(game, 0, 0, 'blocks', 'cloud');
    sprite.anchor.setTo(0.5);
    sprite.visible = false; sprite.exists = false;
    this.group.add(sprite);
    this.particles.push({ sprite: sprite, active: false, age: 0, life: 0, baseScale: 1,
      speed: 0, dx: 0, dy: 0, rotationVelocity: 0, config: null });
  }
};
Match3.ParticleEmitter.range = function(value) {
  return Array.isArray(value) ? value[0] + Math.random() * (value[1] - value[0]) : value;
};
Match3.ParticleEmitter.curve = function(values, t) {
  var index = Math.min(1, Math.max(0, t)) * (values.length - 1);
  var from = Math.floor(index), to = Math.min(from + 1, values.length - 1);
  return values[from] + (values[to] - values[from]) * (index - from);
};
Match3.ParticleEmitter.prototype.add = function(config) {
  this.configs.push({ name: config.name || 'burst', chance: config.chance === undefined ? 1 : config.chance,
    scale: config.scale || [0.2, 2], scaleOverLife: config.scaleOverLife || [1, 0],
    alphaOverLife: config.alphaOverLife || [1, 1], life: config.life || [0.1, 0.3],
    velocity: config.velocity || [80, 280], velocityOverLife: config.velocityOverLife || [1, 1],
    vector: config.vector || { x: [-1, 1], y: [-1, 1] },
    rotation: config.rotation || 0, rotationVelocity: config.rotationVelocity || 0 });
  this.totalChance += this.configs[this.configs.length - 1].chance;
  return this;
};
Match3.ParticleEmitter.prototype.burst = function(x, y, count) {
  var range = Match3.ParticleEmitter.range;
  for (var emitted = 0; emitted < count; emitted++) {
    if (this.activeCount >= this.limit || !this.configs.length) { this.skipped += count - emitted; break; }
    var particle = null;
    for (var searched = 0; searched < this.capacity; searched++) {
      var candidate = this.particles[this.cursor]; this.cursor = (this.cursor + 1) % this.capacity;
      if (!candidate.active) { particle = candidate; break; }
    }
    if (!particle) break;
    var roll = Math.random() * this.totalChance, config = this.configs[this.configs.length - 1];
    for (var i = 0; i < this.configs.length; i++) {
      roll -= this.configs[i].chance;
      if (roll <= 0) { config = this.configs[i]; break; }
    }
    var dx = range(config.vector.x), dy = range(config.vector.y), length = Math.hypot(dx, dy) || 1;
    particle.active = true; particle.config = config; particle.age = 0;
    particle.life = Math.max(0.001, range(config.life)); particle.baseScale = range(config.scale);
    particle.speed = range(config.velocity); particle.dx = dx / length; particle.dy = dy / length;
    particle.rotationVelocity = range(config.rotationVelocity);
    var sprite = particle.sprite;
    sprite.x = x; sprite.y = y; sprite.rotation = range(config.rotation);
    sprite.alpha = config.alphaOverLife[0]; sprite.scale.setTo(particle.baseScale * config.scaleOverLife[0]);
    sprite.visible = true; sprite.exists = true;
    this.activeCount++;
  }
};
Match3.ParticleEmitter.prototype.update = function(dt) {
  if (!this.activeCount) return;
  var curve = Match3.ParticleEmitter.curve;
  for (var i = 0; i < this.capacity; i++) {
    var particle = this.particles[i];
    if (!particle.active) continue;
    particle.age += dt;
    var t = particle.age / particle.life, sprite = particle.sprite, config = particle.config;
    if (t >= 1) { particle.active = false; sprite.visible = false; sprite.exists = false; this.activeCount--; continue; }
    var speed = particle.speed * curve(config.velocityOverLife, t);
    sprite.x += particle.dx * speed * dt; sprite.y += particle.dy * speed * dt;
    sprite.rotation += particle.rotationVelocity * dt;
    sprite.scale.setTo(particle.baseScale * curve(config.scaleOverLife, t));
    sprite.alpha = curve(config.alphaOverLife, t);
  }
};
Match3.ParticleEmitter.prototype.reset = function() {
  this.activeCount = 0;
  for (var i = 0; i < this.capacity; i++) {
    var p = this.particles[i]; p.active = false; p.config = null; p.sprite.visible = false; p.sprite.exists = false;
  }
};
Match3.ParticleEmitter.prototype.destroy = function() { this.reset(); this.group.destroy(); };
