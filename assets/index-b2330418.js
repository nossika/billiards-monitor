(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const l of r.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&i(l)}).observe(document,{childList:!0,subtree:!0});function e(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(s){if(s.ep)return;s.ep=!0;const r=e(s);fetch(s.href,r)}})();const x={isEqual(n,t){return Math.abs(n-t)<Number.EPSILON*100},formatNum(n,t=.001){return Math.abs(n)<t?0:n},distance(n,t,e,i){return Math.sqrt((e-n)**2+(i-t)**2)},create2DCanvas(n){const{container:t,width:e,height:i,origin:s,style:r}=n,l=document.createElement("canvas");l.width=e,l.height=i,Object.assign(l.style,r),t.appendChild(l);const o=l.getContext("2d");return s&&o.translate(s[0],s[1]),o}};class d{constructor(t,e){this.x=t,this.y=e}get length(){return Math.sqrt(this.x**2+this.y**2)}normalize(){return this.length?this.scaleBy(1/this.length):this}add(t){return new d(this.x+t.x,this.y+t.y)}scaleBy(t=1){return new d(this.x*t,this.y*t)}rotate(t){const e=t*Math.PI/180;return new d(this.x*Math.cos(e)-this.y*Math.sin(e),this.x*Math.sin(e)+this.y*Math.cos(e))}dotProduct(t){return this.x*t.x+this.y*t.y}projectOn(t){const e=t.normalize();return e.scaleBy(this.dotProduct(e))}isSameDirection(t){return x.isEqual(this.normalize().dotProduct(t.normalize()),1)}}class y{constructor({x:t,y:e,r:i=10,m:s=i**2,vx:r=0,vy:l=0,color:o="black",elastic:h=1}){this.x=t,this.y=e,this.r=i,this.m=s,this.vx=r,this.vy=l,this.color=o,this.elastic=h}update(t=1){this.x+=this.vx*t,this.y+=this.vy*t}collideEdgeMaybe(t){return this.x-this.r<t.left&&this.vx<0||this.x+this.r>t.right&&this.vx>0?(this.collideEdge("x",t.edgeElastic),!0):this.y-this.r<t.top&&this.vy<0||this.y+this.r>t.bottom&&this.vy>0?(this.collideEdge("y",t.edgeElastic),!0):!1}collideBallMaybe(t){return this.r+t.r<=x.distance(this.x,this.y,t.x,t.y)?!1:(this.collideBall(t),!0)}fallInHoleMaybe(t){if(t.r<this.r)return!1;const e=x.distance(this.x,this.y,t.x,t.y);return e<t.r-this.r||!this.vx&&!this.vy&&e<t.r}collideEdge(t,e){t==="x"?this.vx=-this.vx*Math.min(e,this.elastic):t==="y"&&(this.vy=-this.vy*Math.min(e,this.elastic))}collideBall(t){const e=new d(this.x-t.x,this.y-t.y).normalize(),i=e.rotate(90).normalize(),s=new d(this.vx,this.vy),r=s.projectOn(e),l=s.projectOn(i),o=r.isSameDirection(e)?r.length:-r.length,h=new d(t.vx,t.vy),c=h.projectOn(e),a=h.projectOn(i),f=c.isSameDirection(e)?c.length:-c.length;if(o-f>=0)return;const u=Math.min(this.elastic,t.elastic),p=y.velocityAfterCollide(o,f,this.m,t.m),C=e.normalize().scaleBy(p),m=l.add(C);this.vx=m.x*u,this.vy=m.y*u;const M=y.velocityAfterCollide(f,o,t.m,this.m),V=e.normalize().scaleBy(M),b=a.add(V);t.vx=b.x*u,t.vy=b.y*u}static velocityAfterCollide(t,e,i,s){return(t*(i-s)+2*s*e)/(i+s)}get isStatic(){return this.vx===0&&this.vy===0}}class S{constructor(t,e,i,s="black"){this.x=t,this.y=e,this.r=i,this.color=s}}class w{constructor(t,e){this.ctx=t,this.x=e.x,this.y=e.y,this.w=e.w,this.h=e.h}clear(){this.ctx.clearRect(this.x,this.y,this.w,this.h)}fill(t){this.ctx.fillStyle=t,this.ctx.fillRect(this.x,this.y,this.w,this.h)}renderBall(t,e,i,s="black"){const{ctx:r}=this;r.beginPath(),r.fillStyle=s,r.arc(t,e,i,0,Math.PI*2),r.fill()}renderStick(t,e,i,s,r="black"){const{ctx:l}=this;l.beginPath(),l.moveTo(t,e),l.lineTo(i,s),l.closePath(),l.setLineDash([5,10]),l.strokeStyle=r,l.stroke();const o=new d(i-t,s-e),h=o.rotate(180).normalize(),c=h.scaleBy(50),a=h.scaleBy(o.length/3);l.beginPath(),l.moveTo(t+a.x,e+a.y),l.lineTo(t+a.x+c.x,e+a.y+c.y),l.closePath(),l.setLineDash([]),l.strokeStyle=r,l.stroke()}renderBorder(t,e="gray"){const{ctx:i}=this;i.fillStyle=e,i.fillRect(this.x,this.y,this.w,t),i.fillRect(this.x,this.y,t,this.h),i.fillRect(this.x,this.y+this.h-t,this.w,t),i.fillRect(this.x+this.w-t,this.y,t,this.h)}renderHole(t,e,i,s="black"){const{ctx:r}=this;r.beginPath(),r.fillStyle=s,r.arc(t,e,i,0,Math.PI*2),r.fill()}}class R{constructor({width:t,height:e,border:i=10,scrollFriction:s=.01,edgeElastic:r=.9,renderNextFrame:l=window.requestAnimationFrame.bind(window),styles:o}){this.balls=new Set,this.holes=new Set;const h=t+i*2,c=e+i*2,a=document.createElement("div");Object.assign(a.style,o==null?void 0:o.containerStyle),a.style.width=`${h}px`,a.style.height=`${c}px`,a.style.position="relative",this.container=a;const f=x.create2DCanvas({container:a,width:h,height:c,origin:[i,i]});this.tableRenderer=new w(f,{x:-i,y:-i,w:h,h:c});const u=x.create2DCanvas({container:a,width:h,height:c,origin:[i,i],style:{position:"absolute",top:"0",left:"0"}});this.controlRenderer=new w(u,{x:-i,y:-i,w:h,h:c}),this.width=t,this.height=e,this.border=i,this.scrollFriction=s,this.edgeElastic=r,this.renderNextFrame=l,this.styles=o}mount(t){return t.appendChild(this.container),this.parentNode=t,this}unmount(){var t;(t=this.parentNode)==null||t.removeChild(this.container)}init({cueBall:t,balls:e=[],holes:i=[]}){this.balls=new Set,this.holes=new Set,this.cueBall=t,this.addBall(t),this.addBall(...e),this.addHole(...i)}start(t){if(!this.cueBall)throw new Error("can not start without a cue ball");this.go(()=>{var e;return(e=t==null?void 0:t.onReady)==null?void 0:e.call(t,this.balls)}),this.onClick(e=>{var s;if(!this.status.isStatic)return;const i=()=>{var r,l,o;if(!this.balls.has(this.cueBall)){(r=t==null?void 0:t.onCueBallFall)==null||r.call(t);return}if(this.balls.size<=1){(l=t==null?void 0:t.onClear)==null||l.call(t);return}(o=t==null?void 0:t.onReady)==null||o.call(t,this.balls)};(s=t==null?void 0:t.onStrike)==null||s.call(t,e.relativeX,e.relativeY),this.strikeBall(new d(e.relativeX/10,e.relativeY/10),this.cueBall,i)}),this.onMousemove(e=>{var i;this.status.isStatic&&(this.renderer.controlRenderer.clear(),this.renderer.controlRenderer.renderStick(e.ballX,e.ballY,e.targetX,e.targetY,(i=this.styles)==null?void 0:i.stickColor))})}get config(){return{width:this.width,height:this.height,border:this.border,scrollFriction:this.scrollFriction,edgeElastic:this.edgeElastic,styles:this.styles}}get status(){return{isStatic:this.isStatic}}get renderer(){return{tableRenderer:this.tableRenderer,controlRenderer:this.controlRenderer}}go(t){this.renderNextFrame(()=>{if(this.render(),this.isStatic){t==null||t();return}this.go(t)})}addBall(...t){t.forEach(e=>this.balls.add(e))}removeBall(t){return this.balls.delete(t)}strikeBall(t,e=this.cueBall,i){e&&(e.vx=t.x,e.vy=t.y,this.go(i))}addHole(...t){t.forEach(e=>this.holes.add(e))}onClick(t,e=this.cueBall){return this.container.addEventListener("click",i=>{const s=i.offsetX,r=i.offsetY,l=e==null?void 0:e.x,o=e==null?void 0:e.y,h=s-l,c=r-o;t({targetX:s,targetY:r,ballX:l,ballY:o,relativeX:h,relativeY:c})})}onMousemove(t,e=this.cueBall){return this.container.addEventListener("mousemove",i=>{const s=i.offsetX,r=i.offsetY,l=e==null?void 0:e.x,o=e==null?void 0:e.y,h=s-l,c=r-o;t({targetX:s,targetY:r,ballX:l,ballY:o,relativeX:h,relativeY:c})})}get isStatic(){for(const t of this.balls)if(!t.isStatic)return!1;return!0}render(){var e;const t=this.getMaxRenderSteps();for(let i=0;i<t;i+=1)this.updateBalls(1/t),this.handleCollideBalls(),this.HandleFallInHoles();this.tableRenderer.clear(),this.tableRenderer.fill((e=this.styles)==null?void 0:e.tableColor),this.renderBorder(),this.renderHoles(),this.renderBalls()}getMaxRenderSteps(){let t=1;for(const e of this.balls){const i=Math.sqrt(e.vx**2+e.vy**2);t=Math.max(t,Math.ceil(i/(e.r/5)))}return t}updateBalls(t=1){for(const e of this.balls){e.update(t);const i=new d(e.vx,e.vy),s=i.normalize().scaleBy(Math.max(i.length-this.scrollFriction,0));e.vx=s.x,e.vy=s.y}}handleCollideBalls(){const t=new Set;for(const e of this.balls){e.collideEdgeMaybe({top:0,left:0,bottom:this.height,right:this.width,edgeElastic:this.edgeElastic});for(const i of this.balls){if(e===i||t.has(e)||t.has(i))continue;e.collideBallMaybe(i)&&(t.add(e),t.add(i))}}}HandleFallInHoles(){for(const t of this.balls)for(const e of this.holes)t.fallInHoleMaybe(e)&&this.removeBall(t)}renderBalls(){for(const t of this.balls)this.renderer.tableRenderer.renderBall(t.x,t.y,t.r,t.color)}renderBorder(){var t;this.renderer.tableRenderer.renderBorder(this.border,(t=this.styles)==null?void 0:t.borderColor)}renderHoles(){for(const t of this.holes)this.renderer.tableRenderer.renderHole(t.x,t.y,t.r,t.color)}}const g=()=>{const n=new R({width:762,height:381,styles:{tableColor:"olivedrab",borderColor:"green"}}).mount(document.body);n.init({cueBall:new y({color:"white",x:150,y:50,vx:10,vy:10}),balls:[new y({x:300,y:200}),new y({x:300,y:220}),new y({x:300,y:240}),new y({x:300,y:260})],holes:[new S(100,100,30,"#333")]}),n.start({onStrike(t,e){console.log(`strike!!! x: ${t} , y: ${e}`)},onReady(t){console.log(`remain balls: ${t.size-1}`)},onClear(){alert("win"),n.unmount(),g()},onCueBallFall(){alert("lose"),n.unmount(),g()}})};g();
