const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
function Sprite(){this.anchor={setTo(){}};this.scale={setTo(x){this.x=this.y=x}};this.rotation=0;}
const context={Phaser:{Sprite},console};vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(root,'js/prefabs/ParticleEmitter.js'),'utf8'),context);vm.runInContext(fs.readFileSync(path.join(root,'js/states/Game.js'),'utf8'),context);
const group={children:[],add(s){this.children.push(s)},destroy(){this.destroyed=true}};
const emitter=new context.Match3.ParticleEmitter({add:{group:()=>group}},{maxParticles:12}).add({scale:[1,2],life:.45});
const sprites=group.children.slice();emitter.burst(5,7,100);assert.equal(emitter.activeCount,12);assert.equal(emitter.skipped,88);const p=emitter.particles[0],scale=p.sprite.scale.x;emitter.update(.225);assert(Math.abs(p.sprite.scale.x-scale/2)<1e-9);emitter.update(.23);assert.equal(emitter.activeCount,0);emitter.burst(2,3,12);assert(group.children.every((s,i)=>s===sprites[i]));emitter.reset();assert.equal(emitter.activeCount,0);
const methods=context.Match3.GameState;
function simulate(hz){let block={alive:true,x:0,y:0,origin:{x:0,y:0},spring:{x:0,y:0,vx:500,vy:-200},pose(){}};let game={BLOCK_SIZE:100,time:{elapsedMS:1000/hz,now:0},uiBlocked:false,gesture:null,shuffleButton:{disabled:false},updateHints(){},particles:{activeCount:0,update(){}},observePerformance(){},blocks:{forEachAlive(f){f(block)}}};for(let i=0;i<hz/2;i++){game.time.now+=1000/hz;methods.update.call(game)}return block;}
let a=simulate(60),b=simulate(30);assert(Math.hypot(a.x-b.x,a.y-b.y)<.01);
for(const points of [[{x:0,y:0},{x:100,y:200},{x:200,y:0}],[{x:0,y:0},{x:100,y:200},{x:0,y:0}]]){[0,.5,1].forEach((t,i)=>{const p=methods.shufflePathPoint(points,t);assert(Math.hypot(p.x-points[i].x,p.y-points[i].y)<1e-8)});}
const quality={uiBlocked:true,gesture:null,particles:{activeCount:0,limit:120},burstCount:10,performanceWindow:{frames:0,slow:0}};for(let i=0;i<120;i++)methods.observePerformance.call(quality,34);assert.equal(quality.particles.limit,72);assert.equal(quality.burstCount,6);
console.log('Pool reuse/limit/lifetime, 30-vs-60 FPS inertia, spline points and adaptive quality passed');
