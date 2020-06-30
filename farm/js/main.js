var GameState = {
  preload: function(){
    this.load.image('background', 'assets/images/background.png');
    this.load.image('arrow', 'assets/images/arrow.png');


    this.load.spritesheet('horse', 'assets/images/horse_spritesheet.png', 212, 200, 3);
    this.load.spritesheet('pig', 'assets/images/pig_spritesheet.png', 297, 200, 3);
    this.load.spritesheet('chicken', 'assets/images/chicken_spritesheet.png', 131, 200, 3);
    this.load.spritesheet('sheep', 'assets/images/sheep_spritesheet.png', 244, 200, 3);

    this.load.audio('chickenSFX', ['assets/audio/chicken.mp3', 'assets/audio/chicken.ogg']);
    this.load.audio('horseSFX', ['assets/audio/horse.mp3', 'assets/audio/horse.ogg']);
    this.load.audio('pigSFX', ['assets/audio/pig.mp3', 'assets/audio/pig.ogg']);
    this.load.audio('sheepSFX', ['assets/audio/sheep.mp3', 'assets/audio/sheep.ogg']);
  },
  create: function(){

    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;

    //create background sprite
    this.background = this.game.add.sprite(0, 0, 'background');


    //group for animals
    var animalData = [
      {key: 'chicken', text: 'CHICKEN', audio: 'chickenSFX'},
      {key: 'horse', text: 'HORSE', audio: 'horseSFX'},
      {key: 'pig', text: 'PIG', audio: 'pigSFX'},
      {key: 'sheep', text: 'SHEEP', audio: 'sheepSFX'},
    ];

    this.animals = this.game.add.group();

    var self = this;
    var animal;

    animalData.forEach(function(element){
      animal = self.animals.create(-1000, self.game.world.centerY, element.key, 0);

      animal.customParams = {text: element.text, sound: self.game.add.audio(element.audio)};

      //set anchor and scale
      animal.anchor.setTo(0.5);
      animal.scale.setTo(1, 1);

      //add some animation
      animal.animations.add('anim', [0, 1, 2, 1, 0, 1], 3, false);
      
      //enable input
      animal.inputEnabled = true,
      animal.input.pixelPerfectClick = true,
      animal.events.onInputDown.add(self.animateAnimal, self);
    });

    //place animal in the middle
    this.curentAnimal = this.animals.next();
    this.curentAnimal.position.x = this.game.world.centerX;

    //show animal name text
    this.showText(this.curentAnimal);

    //rigth arrow
    this.rightArrow = this.game.add.sprite(580, this.game.world.centerY, 'arrow');
    this.rightArrow.anchor.setTo(0.5);
    this.rightArrow.customParams = {direction: 1};

    //right arrow allow user input
    this.rightArrow.inputEnabled = true;
    this.rightArrow.input.pixelPerfectClick = true;
    this.rightArrow.events.onInputDown.add(this.switchAnimal, this);

    //left arrow
    this.leftArrow = this.game.add.sprite(60, this.game.world.centerY, 'arrow');
    this.leftArrow.anchor.setTo(0.5);
    this.leftArrow.scale.x = -1;
    this.leftArrow.customParams = {direction: -1};

    //left arrow allow user input
    this.leftArrow.inputEnabled = true;
    this.leftArrow.input.pixelPerfectClick = true;
    this.leftArrow.events.onInputDown.add(this.switchAnimal, this);
  },
  update: function(){
    
  },

  switchAnimal: function(sprite, event){
    if(this.isMoving){
      return false;
    }

    this.isMoving = true;

    //hide the text
    this.animalText.visible = false;

    var dir = sprite.customParams.direction;
    var newAnimal, endX;

    if (dir > 0){
      newAnimal = this.animals.next();
      newAnimal.position.x = this.game.width;
      newAnimal.alpha = 0;
      endX = 0;
    }else{
      newAnimal = this.animals.previous();
      newAnimal.position.x = 0;    
      endX = this.game.width;  
      newAnimal.alpha = 0;
    }

    var newAnimalMove = this.game.add.tween(newAnimal);
    newAnimalMove.to({x: this.game.world.centerX, alpha: 1}, 1000);
    newAnimalMove.onComplete.add(function(){
      this.isMoving = false;
      this.showText(newAnimal);
    }, this)
    newAnimalMove.start();

    var curentAnimalMove = this.game.add.tween(this.curentAnimal);
    curentAnimalMove.to({x: endX, alpha: 0}, 1000);
    curentAnimalMove.start();


    this.curentAnimal = newAnimal;
  },

  animateAnimal: function(sprite, event){
    sprite.play('anim');
    sprite.customParams.sound.play();
  },
  showText: function(animal){
    if(!this.animalText){
      var style = {
        font: 'bold 30pt Neuron',
        fill:  '#d0171b',
        align: 'center',
      }
      this.animalText = this.game.add.text(this.game.width/2, this.game.height * 0.92, '', style);
      this.animalText.anchor.setTo(0.5); 
    }
    this.animalText.setText(animal.customParams.text); 
    this.animalText.visible = true;
  },
};

var game = new Phaser.Game(640, 360, Phaser.AUTO);

game.state.add('GameState', GameState);
game.state.start('GameState');