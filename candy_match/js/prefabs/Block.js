var Match3 = Match3 || {};

Match3.Block = function(state, x, y, data) {
  Phaser.Sprite.call(this, state.game, x, y, data.asset);

  this.game = state.game;
  this.state = state;
  this.row = data.row;
  this.col = data.col;
  this.animDelay = 0;

  this.anchor.setTo(0.5);

  //listen for input
  this.inputEnabled = true;
  this.events.onInputDown.add(state.pickBlock, this.state);

};

Match3.Block.prototype = Object.create(Phaser.Sprite.prototype);
Match3.Block.prototype.constructor = Match3.Block;

Match3.Block.prototype.reset = function(x, y, data){
  Phaser.Sprite.prototype.reset.call(this, x, y);
  this.loadTexture(data.asset);
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
    this.loadTexture('deadBlock');
  });
  this.game.time.events.add(300 + del, () => {
    emitter.start(true, eLife, null, 10);
  });

  emitter.children.forEach((ptx) => {
    ptx.scale.setTo(.4);
    ptx.alpha = 0;
    var tweenScale = ptx.game.add.tween(ptx.scale);
    var tweenAlpha = ptx.game.add.tween(ptx);
    tweenScale.to({ x: .5, y: .5 }, eLife/2).to({ x: 0, y: 0 }, eLife/2).delay(del);
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

