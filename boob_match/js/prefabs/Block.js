var Match3 = Match3 || {};

Match3.Block = function(state, x, y, data) {
  Phaser.Sprite.call(this, state.game, x, y, data.asset, 84);

  this.game = state.game;
  this.state = state;
  this.row = data.row;
  this.col = data.col;
  this.animDelay = 0;

  this.anchor.setTo(0.5);
  this.backedScale = this.state.BLOCK_SIZE / this.width * 1.75;
  this.scale.setTo(this.backedScale);

  this.animations.add('top', [84, 71, 45, 32, 19, 19, 31, 57, 109, 148, 148, 148, 109, 71, 45, 45, 58, 71, 97, 110, 110, 97, 84, 70, 57, 57, 57, 70, 70, 84], 30, false);
  this.animations.add('bottom', [84, 96, 109, 122, 122, 109, 58, 19, 6, 6, 58, 97, 110, 110, 84, 58, 58, 58, 71, 84, 84, 84, 84, 71, 84], 30, false);
  this.animations.add('left', [84, 72, 74, 75, 75, 76, 75, 72, 55, 52, 52, 52, 67, 70, 85, 86, 85, 85, 84, 83, 83, 83, 70, 70, 71, 84], 30, false);
  this.animations.add('right', [84, 70, 69, 68, 67, 54, 54, 54, 69, 72, 75, 77, 78, 77, 76, 73, 70, 56, 56, 56, 69, 70, 84], 30, false);

  //listen for input
  this.inputEnabled = true;
  this.events.onInputDown.add(state.pickBlock, this.state);

};

Match3.Block.prototype = Object.create(Phaser.Sprite.prototype);
Match3.Block.prototype.constructor = Match3.Block;

Match3.Block.prototype.reset = function(x, y, data){
  Phaser.Sprite.prototype.reset.call(this, x, y);
  this.loadTexture(data.asset, 84);
  this.scale.setTo(this.backedScale);
  this.row = data.row;
  this.col = data.col;
};

Match3.Block.prototype.kill = function(){
  var del = (this.animDelay || 0) * 20;
  this.row = null;
  this.col = null;
  var self = this;
  var poofAnim = this.game.add.tween(this.scale);
  var emitter = this.game.add.emitter(this.x, this.y, 10);
  var eVel = 60;
  var eLife = 750;
  emitter.makeParticles('cloud');
  emitter.minParticleSpeed.setTo(-eVel,-eVel);
  emitter.maxParticleSpeed.setTo(eVel,eVel);
  emitter.gravity = 0;
  
  this.game.time.events.add(220 + del, () => {
    // this.loadTexture('deadBlock');
  });
  this.game.time.events.add(300 + del, () => {
    emitter.start(true, eLife, null, 10);
  });

  emitter.children.forEach((ptx) => {
    ptx.scale.setTo(.4);
    ptx.alpha = 0;
    var tweenScale = ptx.game.add.tween(ptx.scale);
    var tweenAlpha = ptx.game.add.tween(ptx);
    tweenScale.to({ x: this.backedScale * .5, y: this.backedScale * .5, }, eLife/2)
    .to({ x: 0, y: 0 }, eLife/2).delay(del);
    tweenAlpha.to({ alpha: 1 }, eLife/2).to({ alpha: 0 }, eLife/2).delay(del);
    tweenScale.start();
    tweenAlpha.start();
}, emitter);


  poofAnim.to({x: 0.8, y: .9}, 100)
  .to({x: 1.8, y: 1.65}, 150)
  .to({x: 0, y: 0.1}, 200)
  .delay(del)
  .onComplete.add(() => {
    Phaser.Sprite.prototype.kill.call(this);
    this.animDelay = 0;
  }, self);

  poofAnim.start();
};

