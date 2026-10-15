var Match3 = Match3 || {};
Match3.Block = function(state, x, y, data) {
  Phaser.Sprite.call(this, state.game, x, y, 'blocks', data.asset + '_84');
  this.state = state;
  this.anchor.setTo(0.5);
  this.backedScale = state.BLOCK_SIZE / 100 * 1.75;
  this.reset(x, y, data);
};
Match3.Block.prototype = Object.create(Phaser.Sprite.prototype);
Match3.Block.prototype.constructor = Match3.Block;
Match3.Block.prototype.reset = function(x, y, data) {
  Phaser.Sprite.prototype.reset.call(this, x, y);
  this.asset = data.asset;
  this.loadTexture('blocks', data.asset + '_84');
  this.row = data.row;
  this.col = data.col;
  this.origin = this.state.getBlockPositionRowCol(data);
  this.poseFrame = 84;
  this.scale.setTo(this.backedScale);
  this.alpha = 1;
  this.inputEnabled = false;
  this.spring = null;
  this.motion = null;
  this.tapRing = null; this.shake = null;
};
Match3.Block.prototype.pose = function(dx, dy) {
  var extent = this.state.PITCH;
  var col = Math.max(0, Math.min(12, Math.round(6 + dx / extent * 6)));
  var row = Math.max(0, Math.min(12, Math.round(6 + dy / extent * 6)));
  var frame = row * 13 + col;
  if (frame !== this.poseFrame) { this.poseFrame = frame; this.frameName = this.asset + '_' + frame; }
};
