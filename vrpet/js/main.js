//this game will have only 1 state
var GameState = {

  //initiate some game-level settings
  init: function() {
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
  },
  preload: function() {
    this.load.image('backyard', 'assets/images/backyard.png');
    this.load.image('apple', 'assets/images/apple.png');
    this.load.image('candy', 'assets/images/candy.png');
    this.load.image('rotate', 'assets/images/rotate.png');
    this.load.image('toy', 'assets/images/rubber_duck.png');
    this.load.image('arrow', 'assets/images/arrow.png');
    this.load.spritesheet('pet', 'assets/images/pet.png', 97, 83, 5, 1, 1);
  },
  create: function() {     
    this.background = this.game.add.sprite(this.game.width/2 - 100, this.game.height/2, 'backyard');
    this.background.anchor.setTo(0.5);

    this.background.inputEnabled = true;
    this.background.events.onInputDown.add(this.placeItem, this);

    this.pet = this.game.add.sprite(this.game.width/2, this.game.height - 300, 'pet');
    this.pet.anchor.setTo(.5);

    //add some extra params
    this.pet.customParams = {health: 100, fun: 100};

    //draggable pet
    this.pet.inputEnabled = true;
    this.pet.input.enableDrag();

    //add some UI
    var uiElements = [
      {key: 'apple', action: this.pickItem, health: 20},
      {key: 'candy', action: this.pickItem, health: -10, fun: 10},
      {key: 'toy', action: this.pickItem, fun: 20},
      {key: 'rotate', action: this.rotateItem, fun: 10}
    ];

    this.buttons = this.game.add.group();
    var self = this;

    uiElements.forEach(function(item, i){
      self[item.key] = self.buttons.create(self.game.width / uiElements.length * (i + .5), self.game.height - 40, item.key, 0);
      //set anchor and scale
      self[item.key].anchor.setTo(0.5);
      self[item.key].scale.setTo(1, 1);
      //enable input
      self[item.key].inputEnabled = true;
      self[item.key].events.onInputDown.add(item.action, self);

      // self[item.key].customParams = {};    
      // if(item.health) { self[item.key].customParams.health = item.health; }
      // if(item.fun) { self[item.key].customParams.fun = item.fun; }

      self[item.key].customParams = {health: item.health || 0, fun: item.fun || 0};

    });

    //nothing selected
    this.selectedItem = null;
    this.uiBlocked = false;
  },

  pickItem: function(sprite, event){
    if(!this.uiBlocked){
      this.clearSelection();
      sprite.alpha = 1;
      sprite.scale.setTo(1.2);
      this.selectedItem = sprite;
    }
  },

  clearSelection: function(allEnabled) {
    this.buttons.forEach(function(item, index){
      item.alpha = allEnabled ? 1 : 0.4;
      item.scale.setTo(allEnabled ? 1 : 0.9);
    });
    this.selectedItem = null;
  },

  rotateItem: function(sprite, event){
    if(!this.uiBlocked){

      this.uiBlocked = true;

      this.clearSelection();
      sprite.alpha = 1;
      sprite.scale.setTo(1.1);

      this.selectedItem = sprite;

      var petRotation = this.game.add.tween(this.pet);
      petRotation.to({angle: '+720'}, 1000);

      petRotation.onComplete.add(function(){
        this.uiBlocked = false;
        this.clearSelection(true);
        this.pet.customParams.fun += sprite.customParams.fun;

        console.log('Pet fun is: ' + this.pet.customParams.fun);
      }, this);

      petRotation.start();

    }
  },

  placeItem: function(sprite, event) {
    if(this.selectedItem && !this.uiBlocked){
      var x = event.position.x;
      var y = event.position.y;

      var newItem = this.game.add.sprite(x, y, this.selectedItem.key);
      newItem.anchor.setTo(0.5);
      newItem.scale.setTo(0);
      var newItemMove = this.game.add.tween(newItem.scale);
      newItemMove.to({x: 1, y: 1}, 200);
      newItemMove.start();
      
      newItem.customParams = this.selectedItem.customParams;

      this.uiBlocked = true;

      var petMove = this.game.add.tween(this.pet);
      petMove.to({x: x, y: y}, 500);
      petMove.onComplete.add(function(){
        newItem.destroy();
        this.uiBlocked = false;
        // this.clearSelection(true);

        var stat;
        for(stat in newItem.customParams) {
          if(newItem.customParams.hasOwnProperty(stat)) {
            this.pet.customParams[stat] += newItem.customParams[stat];
            console.log(stat +': ' + this.pet.customParams[stat]);
          }
        }

      }, this);
      petMove.start();
    }
  },

};

//initiate the Phaser framework
var game = new Phaser.Game(360, 640, Phaser.AUTO);

game.state.add('GameState', GameState);
game.state.start('GameState');