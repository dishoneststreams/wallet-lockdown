(function(){
"use strict";
var KEY="walletLockdownRPGv11";
var state=null;
function load(){
  var keys=[KEY,"walletLockdownRPGv10","walletLockdownRPGv9","walletLockdownRPGv8","walletLockdownRPGv7","walletLockdownRPGv6"];
  for(var i=0;i<keys.length;i++){try{var raw=localStorage.getItem(keys[i]);if(raw){state=JSON.parse(raw);if(state)break;}}catch(e){}}
  if(!state||typeof state!=="object")state={start:null,tx:[],checks:{},goal:500,xp:0,savings:0,rewards:[],lastLevel:1};
  if(!Array.isArray(state.tx))state.tx=[]; if(!state.checks||typeof state.checks!=="object")state.checks={};
  if(!(state.goal>0))state.goal=500; if(!(state.xp>=0))state.xp=0; if(!(typeof state.savings==="number"))state.savings=0;
  if(!Array.isArray(state.rewards))state.rewards=[]; if(!Array.isArray(state.loot))state.loot=[]; if(!state.rank)state.rank="WALLET NOVICE"; if(!(state.lastLevel>=1))state.lastLevel=Math.floor(state.xp/100)+1;
}
load();
function $(id){return document.getElementById(id)}
function sfx(type){
  try{
    var C=window.AudioContext||window.webkitAudioContext;
    if(!C)return;
    var ctx=new C(),o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type==="bad"?"sawtooth":"square";
    var f=type==="level"?660:type==="bad"?150:type==="save"?880:520;
    o.frequency.setValueAtTime(f,ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(f*(type==="level"?1.6:.75),ctx.currentTime+.16);
    g.gain.setValueAtTime(.045,ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.2);
    o.connect(g);g.connect(ctx.destination);o.start();o.stop(ctx.currentTime+.21);
  }catch(e){}
}
function toast(text){
  var old=document.querySelector(".toast"); if(old)old.remove();
  var t=document.createElement("div");t.className="toast";t.textContent=text;
  document.body.appendChild(t);setTimeout(function(){if(t.parentNode)t.remove()},2500);
}
function coins(n){
  for(var i=0;i<Math.min(n,10);i++){
    var c=document.createElement("div");c.className="coin";c.textContent="🪙";
    c.style.left=(35+Math.random()*30)+"vw";c.style.top=(42+Math.random()*20)+"vh";
    c.style.setProperty("--dx",(Math.random()*220-110)+"px");
    c.style.setProperty("--dy",(-180-Math.random()*180)+"px");
    document.body.appendChild(c);setTimeout(function(x){return function(){if(x.parentNode)x.remove()}}(c),950);
  }
}
function flash(id){
  var e=$(id);if(!e)return;e.classList.remove("flash");void e.offsetWidth;e.classList.add("flash");
}
function dayComplete(dayNum, clean, reward){
  var m=$("dayCompleteModal"),t=$("dayCompleteTitle"),b=$("dayCompleteBody"),r=$("dayCompleteReward");
  if(!m)return;
  t.textContent=clean?"DAY "+dayNum+" CLEARED!":"DAY "+dayNum+" SURVIVED";
  b.textContent=clean?"⭐ Clean day! +25 XP. The wallet takes no damage.":"💪 You kept going. The quest is still alive.";
  r.textContent=reward?("🎁 "+reward+" UNLOCKED!"):"🎁 Keep the streak alive for the next reward.";
  m.style.display="flex";coins(clean?5:1);sfx(clean?"save":"bad");
}

function persist(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
function save(){persist();render()}
function day(){return state.start?Math.min(30,Math.floor((Date.now()-new Date(state.start).getTime())/86400000)+1):0}
function cleanCount(){return Object.keys(state.checks).filter(function(k){return state.checks[k]==="clean"}).length}
function streak(){var best=0,cur=0;for(var i=1;i<=30;i++){if(state.checks[String(i)]==="clean"){cur++;if(cur>best)best=cur}else if(state.checks[String(i)]==="failed")cur=0}return best}
function currentStreak(){var n=day(),cur=0;for(var i=n;i>=1;i--){if(state.checks[String(i)]==="clean")cur++;else break}return cur}
function damageTotal(){return state.tx.filter(function(x){return x.c==="Other"}).reduce(function(q,x){return q+x.a},0)}
function level(){return Math.floor(state.xp/100)+1}
function xpInLevel(){return state.xp%100}
function awardXP(amount,msg){var before=level();state.xp+=amount;var after=level();if(after>before){state.lastLevel=after;showLevelUp(after,amount)} if(msg)$('msg').textContent=msg;save()}
function showLevelUp(lvl,amount){
  var title=$('levelUpTitle'),body=$('levelUpBody'),modal=$('levelUpModal');
  if(title&&body&&modal){
    title.textContent="LEVEL "+lvl+" UNLOCKED!";
    body.textContent="⭐ +"+amount+" XP  •  Your wallet powers grow stronger.";
    modal.style.display="flex"; coins(10); sfx("level"); toast("🆙 LEVEL UP! "+lvl+" • New wallet power unlocked.");
  }
}
function closeLevel(){if($('levelUpModal'))$('levelUpModal').style.display="none"}
function openStart(){if(!state.start)$('startModal').style.display="flex"}
function closeStart(){$('startModal').style.display="none"}
function start(){if(state.start)return;state.start=new Date().toISOString();state.tx=[];state.checks={};state.xp=10;state.savings=0;state.rewards=[];state.loot=[];state.rank="WALLET NOVICE";state.lastLevel=1;persist();closeStart();$('msg').textContent="🔥 QUEST STARTED! +10 XP. Protect the wallet.";render()}
function reset(){if(confirm("Reset the quest, XP, rewards, savings, and purchase log?")){state={start:null,tx:[],checks:{},goal:500,xp:0,savings:0,rewards:[],lastLevel:1};persist();render();$('msg').textContent="🎮 Quest reset. Ready when you are."}}
function add(){
  if(!state.start){openStart();return}
  var a=parseFloat($('amt').value);if(!(a>=0)){alert("Enter a valid amount.");return}
  var c=$('cat').value,d=$('desc').value.trim()||"Purchase";
  state.tx.unshift({d:d,a:a,c:c,t:new Date().toLocaleString()});$('desc').value="";$('amt').value="";
  if(c==="Other"){$('msg').textContent="🚨 WALLET DAMAGE! The raccoon noticed.";sfx("bad");flash("damage");toast("🚨 WALLET DAMAGE!")}
  else {$('msg').textContent="🪙 Allowed purchase logged. Quest continues.";state.xp+=2;coins(2);sfx("save");flash("essential");}
  persist();render();
}
function checkIn(){if(!state.start){openStart();return}$('checkModal').style.display="flex"}
function answer(ok){
  var d=day(),k=String(d);if(state.checks[k]){$('checkModal').style.display="none";$('msg').textContent="📜 Today's check-in is already recorded.";return}
  state.checks[k]=ok?"clean":"failed";var gained=ok?25:5;var before=level();state.xp+=gained;$('checkModal').style.display="none";
  $('msg').textContent=ok?"🏆 CLEAN DAY! +25 XP. The wallet lives another day.":"💪 Honest run. +5 XP. One bad day doesn't end the quest.";
  var reward=rewardForDay(d);
  if(level()>before)showLevelUp(level(),gained);
  persist();render();
  setTimeout(function(){dayComplete(d,ok,reward)},180);
}
function roast(){ sfx("bad"); 
  var damage=damageTotal(),s=currentStreak(),x;
  if(damage>=100)x="🦝 I have contacted the financial authorities. Please stop.";
  else if(damage>=50)x="🦝 BRO. The wallet is sending a distress signal.";
  else if(damage>=20)x="🦝 Legendary side-eye deployed. Your wallet knows what you did.";
  else if(damage>0)x="🦝 You bonked the wallet a little. Let it heal, legend.";
  else if(s>=7)x="🦝 SEVEN-DAY STREAK?! Put the credit card in a museum.";
  else if(s>=3)x="🦝 Three clean days. You are becoming dangerously responsible.";
  else x="🦝 APPROVED: Keep the money. Future You sends a high-five.";
  $('msg').textContent=x;window.setTimeout(function(){alert(x)},10)
}
function setGoal(){var g=parseFloat($('goal').value);if(!(g>0)){alert("Enter a savings goal.");return}state.goal=g;$('goal').value="";persist();render();$('msg').textContent="🎯 New savings quest accepted: $"+g.toFixed(0)+"."}
function logSaved(){if(!state.start){openStart();return}var a=parseFloat($('saveAmt').value);if(!(a>0)){alert("Enter how much money you actually saved.");return}var before=level();state.savings+=a;state.xp+=10;$('saveAmt').value="";$('msg').textContent="💰 $"+a.toFixed(2)+" banked! +10 XP. Future You approves.";coins(5);sfx("save");flash("saved");toast("💰 MONEY BANKED! +10 XP");if(level()>before)showLevelUp(level(),10);persist();render()}
function dismissLevel(){closeLevel()}
function esc(x){return String(x).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function raccoonStatus(damage,s){if(damage>=100)return"PANIC MODE";if(damage>=50)return"DISTRESSED";if(damage>=20)return"SIDE-EYE MODE";if(s>=7)return"PROUD";if(s>=3)return"WATCHING";return damage>0?"SUSPICIOUS":"CALM"}
function rewardForDay(i){var r={1:"STARTER",3:"STREAK BOOST",7:"SURVIVOR",15:"HALFWAY HERO",21:"FINAL STRETCH",30:"WALLET LEGEND"};return r[i]||""}
function rankFor(lvl,saved,st){if(lvl>=10||saved>=500)return"WALLET LEGEND";if(lvl>=7||saved>=300)return"FINANCIAL WIZARD";if(lvl>=5||saved>=200)return"SAVINGS KNIGHT";if(lvl>=3||saved>=100||st>=7)return"BUDGET WARRIOR";return"WALLET NOVICE"}
function updateLoot(n,lvl,saved,st){var candidates=[];if(n>=1)candidates.push(["🪙","Quest Accepted","Day 1 cleared"]);if(st>=3)candidates.push(["🔥","Streak Spark","3 clean days"]);if(st>=7)candidates.push(["🛡️","Survivor Shield","7 clean days"]);if(n>=15)candidates.push(["⚔️","Halfway Blade","Reach Day 15"]);if(saved>=100)candidates.push(["💰","Banker Badge","Save $100"]);if(lvl>=5)candidates.push(["👑","Gold Crown","Reach Level 5"]);if(n>=30)candidates.push(["🏆","Wallet Legend","Finish all 30 days"]);candidates.forEach(function(r){var key=r[1];if(state.loot.indexOf(key)<0)state.loot.push(key)});state.rank=rankFor(lvl,saved,st)}
function render(){
  var n=day(),essential=state.tx.filter(function(x){return x.c!=="Other"}).reduce(function(q,x){return q+x.a},0),damage=damageTotal(),clean=cleanCount(),lvl=level(),within=xpInLevel(),st=currentStreak(),best=streak();
  updateLoot(n,lvl,state.savings,st);$('day').textContent=state.start?(n>=30?"QUEST COMPLETE!":"DAY "+n+" / 30"):"DAY 1 / 30";
  $('fill').style.width=(state.start?(n/30*100):0)+"%";$('hp').textContent="WALLET HP: "+Math.max(0,100-damage).toFixed(0)+"%";
  $('startBtn').disabled=!!state.start;$('essential').textContent="$"+essential.toFixed(2);$('damage').textContent="$"+damage.toFixed(2);
  $('level').textContent="LVL "+lvl;$('xptxt').textContent=within+" / 100 XP";$('xpfill').style.width=within+"%";$('clean').textContent=clean;$('streak').textContent=st+" DAY"+(st===1?"":"S");$('best').textContent=best+" DAY"+(best===1?"":"S");$('racStatus').textContent=raccoonStatus(damage,st);
  var pct=Math.max(0,Math.min(100,state.savings/state.goal*100));$('goalText').textContent="$"+state.goal.toFixed(0)+" GOAL";$('goalFill').style.width=pct+"%";$('saved').textContent="$"+state.savings.toFixed(2);var pctEl=$('goalPct');if(pctEl)pctEl.textContent=pct.toFixed(0)+"%";
  var ds="";for(var i=1;i<=30;i++){var cl="";if(state.checks[String(i)]==="failed")cl="failed";else if(state.start&&i<n)cl="done";else if(state.start&&i===n)cl="current";if(rewardForDay(i))cl+=" milestone";ds+='<div class="daybox '+cl+'"><b>'+i+'</b>'+(rewardForDay(i)?'<small>'+esc(rewardForDay(i))+'</small>':'')+'</div>'}$('days').innerHTML=ds;
  var badges=[["FIRST STEP","Start the quest",!!state.start],["3-DAY STREAK","3 clean check-ins",clean>=3],["7-DAY SURVIVOR","7 clean check-ins",clean>=7],["HALFWAY","Reach Day 15",n>=15],["CLEAN WALLET","Keep damage at $0",damage===0&&!!state.start],["30-DAY LEGEND","Complete the quest",n>=30],["BANKER","Save $100",state.savings>=100],["LEVEL 5","Reach level 5",lvl>=5]];
  $('ach').innerHTML=badges.map(function(b){return'<div class="badge '+(b[2]?"unlocked":"")+'"><b>'+(b[2]?"🏆 ":"🔒 ")+esc(b[0])+'</b><span>'+esc(b[1])+"</span></div>"}).join("");
  $('rank').textContent=state.rank; $('loot').innerHTML=state.loot.length?state.loot.map(function(x){return '<div class="lootitem"><b>🎁 '+esc(x)+'</b><span>UNLOCKED</span></div>'}).join(''):'No rewards claimed yet.';
  $('list').innerHTML=state.tx.length?state.tx.map(function(x){return'<div class="tx"><span><b>'+esc(x.d)+'</b><br><small>'+esc(x.t)+" · "+esc(x.c)+"</small></span><b>$"+x.a.toFixed(2)+"</b></div>"}).join(""):"Nothing logged yet.";
}
function bind(id,fn){var el=$(id);if(el)el.addEventListener("click",fn)}
bind("startBtn",openStart);bind("goBtn",start);bind("laterBtn",closeStart);bind("checkBtn",checkIn);bind("yesBtn",function(){answer(true)});bind("noBtn",function(){answer(false)});bind("addBtn",add);bind("goalBtn",setGoal);bind("saveBtn",logSaved);bind("roastBtn",roast);bind("levelClose",dismissLevel);bind("dayCompleteClose",function(){$("dayCompleteModal").style.display="none";});
var host=$('startBtn');if(host&&host.parentNode&&host.parentNode.parentNode){var resetBtn=document.createElement("button");resetBtn.textContent="RESET QUEST";resetBtn.className="secondary";resetBtn.style.width="100%";resetBtn.style.marginTop="9px";resetBtn.addEventListener("click",reset);host.parentNode.parentNode.appendChild(resetBtn)}
render();

function v13Money(n){return "$"+Number(n||0).toFixed(2)}
function v13Render(){try{
var cats={Food:0,Gas:0,Bills:0,Other:0};state.tx.forEach(function(x){cats[x.c]=(cats[x.c]||0)+x.a});
if($("v13Saved"))$("v13Saved").textContent=v13Money(state.savings);if($("v13Essential"))$("v13Essential").textContent=v13Money(cats.Food+cats.Gas+cats.Bills);if($("v13Damage"))$("v13Damage").textContent=v13Money(cats.Other);if($("v13Goal"))$("v13Goal").textContent=v13Money(state.goal);
if($("v13StatsText"))$("v13StatsText").textContent=state.start?("Day "+day()+" / 30 • "+cleanCount()+" clean days • Level "+level()+" • "+currentStreak()+" day streak"):"Start the quest to begin.";
if($("v13Cats"))$("v13Cats").innerHTML=["Food","Gas","Bills","Other"].map(function(c){return '<div class="minirow"><b>'+c.toUpperCase()+'</b><span>'+v13Money(cats[c])+'</span></div>'}).join("");
if($("v13Calendar")){var n=day();$("v13Calendar").innerHTML=Array.from({length:30},function(_,i){var d=i+1,k=String(d),cl=d>n?"upcoming":(state.checks[k]==="clean"?"completed":(state.checks[k]==="failed"?"missed":"current"));return '<div class="daybox '+cl+'">'+d+'</div>'}).join("")}
}catch(e){}}
function v13ShowView(id){document.querySelectorAll(".view").forEach(function(v){v.classList.remove("active")});var v=$(id);if(v)v.classList.add("active");document.querySelectorAll(".bottomnav button").forEach(function(b){b.classList.toggle("active",b.getAttribute("data-view")===id)});window.scrollTo({top:0,behavior:"smooth"});v13Render()}
document.querySelectorAll(".bottomnav button").forEach(function(b){b.addEventListener("click",function(){v13ShowView(b.getAttribute("data-view"))})});
var oldRender=render;render=function(){oldRender();v13Render()};
if($("installDismiss"))$("installDismiss").addEventListener("click",function(){$("installBanner").classList.remove("show");try{localStorage.setItem("wlr_install_seen","1")}catch(e){}});
if($("v13GoalBtn"))$("v13GoalBtn").addEventListener("click",function(){v13ShowView("homeView");setTimeout(function(){var g=$("goal");if(g){g.focus();g.scrollIntoView({behavior:"smooth",block:"center"})}},50)});
if($("v13ResetBtn"))$("v13ResetBtn").addEventListener("click",reset);
try{if(!localStorage.getItem("wlr_install_seen")&&!window.matchMedia("(display-mode: standalone)").matches&&!navigator.standalone)$("installBanner").classList.add("show")}catch(e){}
v13Render();

})();

if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('./sw.js').catch(function(){})})}
