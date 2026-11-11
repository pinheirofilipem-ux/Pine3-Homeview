// Pine3 Homeview - panel styles. Colours come from the tokens in tokens.js (dark and light).
import { tokens } from "./tokens.js";

export const css = `${tokens}
*,*::before,*::after{box-sizing:border-box}
:host{display:block;position:relative;min-height:100vh;color:rgb(var(--fg));font-family:"Pine3 Figtree",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;
  --display:"Pine3 Outfit","Pine3 Figtree",sans-serif;
  --glass:rgba(255,255,255,min(var(--glass-max),calc(.09 * var(--glass-k) + var(--glass-b))));--glass-hi:rgba(255,255,255,min(var(--glass-max),calc(.14 * var(--glass-k) + var(--glass-b))));--glass-strong:rgba(var(--deep-rgb, 30,24,36),min(var(--deep-max),calc(.72 + var(--deep-add))));--line:rgba(var(--fg),min(1,calc(.12 * var(--fg-k))));--muted:rgba(var(--fg),min(1,calc(.66 * var(--fg-k))));
  --cream:#f5efe1;--ink:#2a221f;--ink-soft:rgba(42,34,31,.6);--amber:#f6b83f;--r:28px;
  --ring-bg:#202329;--ring-dim:rgba(var(--fg),min(1,calc(.12 * var(--fg-k))));--ring-off:rgba(var(--fg),min(1,calc(.2 * var(--fg-k))));--ring-idle:rgba(var(--fg),min(1,calc(.4 * var(--fg-k))));
  --sheen:linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.025) 45%,rgba(255,255,255,0) 70%);
  --edge:inset 0 1px 0 rgba(255,255,255,.16),inset 0 0 0 1px rgba(255,255,255,.02);--lift:0 18px 44px -22px rgba(0,0,0,.55)}
.bg{position:fixed;inset:0;z-index:0;transition:background .6s}
.bg::after{content:"";position:absolute;inset:0;background:radial-gradient(transparent 45%,rgba(var(--deep-rgb, 0,0,0),min(var(--deep-max),calc(.28 + var(--deep-add)))))}
.wrap{position:relative;z-index:1;max-width:1500px;margin:0 auto;padding:0 40px calc(var(--dock-space,108px) + 14px)}
.glass{background:var(--sheen),var(--glass);backdrop-filter:blur(26px) saturate(170%);-webkit-backdrop-filter:blur(26px) saturate(170%);border:1px solid var(--line);box-shadow:var(--edge),var(--lift)}
.hero .t,h2,.rc .nm,.clock,.status,.tile .nm,.tile.sensor .val,.ring .tgt,.sheet .hd .nm,.wpill b,.big-num,.media .ttl{font-family:var(--display)}
header{display:flex;align-items:center;gap:10px;padding:22px 0 0}
header .sp{flex:1}
.iconbtn{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;color:rgb(var(--fg));cursor:pointer;border:1px solid var(--line);background:var(--glass);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);flex:none}
.iconbtn ha-icon{--mdc-icon-size:22px}
.eyebrow{font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:10px}
.badge{display:inline-grid;place-items:center;min-width:22px;height:22px;padding:0 6px;border-radius:999px;background:var(--glass-hi);font-size:11px;letter-spacing:0;color:rgb(var(--fg))}
.top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding-top:36px;flex-wrap:wrap}
.clock{font-variant-numeric:tabular-nums;font-weight:300;font-size:clamp(52px,7vw,76px);letter-spacing:-.02em;line-height:1;margin-top:8px}
.right{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
.wpill{display:flex;align-items:center;gap:12px;height:56px;padding:0 22px 0 18px;border-radius:999px}
.wpill ha-icon{--mdc-icon-size:26px}
.wpill b{font-size:26px;font-weight:400}
.wpill span{color:var(--muted);font-size:16px}
.people{display:flex}
.av{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;font-family:var(--display);font-weight:600;font-size:20px;color:var(--ink);border:2px solid rgba(var(--fg),min(1,calc(.35 * var(--fg-k))));position:relative;margin-left:-12px;background-size:cover;background-position:center}
.av:first-child{margin-left:0}
.av i{position:absolute;right:-1px;bottom:-1px;width:14px;height:14px;border-radius:50%;border:2px solid #3a2238;background:#6b6b6b}
.av.home i{background:#34c759}
.statusrow{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-top:36px;flex-wrap:wrap}
.status{font-size:clamp(30px,4vw,40px);font-weight:300;letter-spacing:-.01em;margin-top:8px}
.actions{display:flex;gap:12px;flex-wrap:wrap}
.pill{all:unset;cursor:pointer;height:46px;padding:0 20px;border-radius:999px;background:var(--glass-hi);font-weight:600;font-size:16px;display:inline-flex;align-items:center;gap:8px;border:1px solid var(--line);transition:transform .12s}
.pill:active{transform:scale(.96)}
.pill ha-icon{--mdc-icon-size:20px}
.pill.act,.pill.solid{background:var(--cream);color:var(--ink);border-color:transparent}
.sect{margin-top:30px}
.scenes{display:flex;gap:12px;overflow-x:auto;padding:14px 0 4px;scrollbar-width:none}
.scenes::-webkit-scrollbar{display:none}
.scene{flex:none;display:flex;align-items:center;gap:10px;height:52px;padding:0 24px 0 20px;border-radius:999px;cursor:pointer;font-weight:600;font-size:17px;transition:transform .12s,background .2s}
.scene ha-icon{--mdc-icon-size:20px}
.scene:active{transform:scale(.96)}
.scene.fired{background:var(--cream);color:var(--ink)}
.scene.on{background:var(--cream);color:var(--ink);border-color:transparent}
.scene.on ha-icon{color:var(--amber)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:20px;margin-top:22px}
.rc{position:relative;min-width:0;border-radius:var(--r);padding:22px;min-height:250px;cursor:pointer;display:flex;flex-direction:column;transition:transform .15s,background .25s,color .25s}
.rc:active{transform:scale(.98)}
.rc.on{background:var(--cream);color:var(--ink);border-color:transparent;box-shadow:0 18px 40px -18px rgba(0,0,0,calc(.45 * var(--shade-k)))}
.rc .row1{display:flex;justify-content:space-between;align-items:flex-start}
.ri{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:var(--glass-hi)}
.ri ha-icon{--mdc-icon-size:26px}
.rc.on .ri{background:var(--amber);color:var(--ink)}
.pw{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;background:var(--glass-hi);cursor:pointer;flex:none;transition:transform .12s}
.pw:active{transform:scale(.92)}
.pw ha-icon{--mdc-icon-size:28px}
.rc.on .pw,.tile.on .pw{background:rgba(var(--deep-rgb, 42,34,31),min(var(--deep-max),calc(.08 + var(--deep-add))));color:var(--ink)}
.rc .foot{margin-top:auto}
.rc .nm{font-size:22px;font-weight:500;letter-spacing:-.01em;line-height:1.15}
.rc .meta{font-size:16px;color:var(--muted);margin-top:4px}
.rc.on .meta{color:var(--ink-soft)}
.dots{display:flex;align-items:center;gap:6px;margin-top:12px;min-height:22px}
.dots i{width:10px;height:10px;border-radius:50%;background:rgba(255,255,255,min(var(--glass-max),calc(.28 * var(--glass-k) + var(--glass-b))))}
.rc.on .dots i{background:rgba(var(--deep-rgb, 42,34,31),min(var(--deep-max),calc(.16 + var(--deep-add))))}
.dots i.on,.rc.on .dots i.on{background:var(--amber)}
.dots .tmp{margin-left:auto;font-size:16px;font-variant-numeric:tabular-nums}
.rc .eyebrow{color:inherit;opacity:.7}
.rc.on .eyebrow{color:var(--ink)}
.big-num{font-size:46px;font-weight:300;letter-spacing:-.02em;line-height:1}
.big-txt{font-family:var(--display);font-size:30px;font-weight:300;line-height:1.15}
.media .ttl{font-size:22px;font-weight:500}
.media .art{color:var(--muted);font-size:15px;margin-top:2px}
.media .bar{height:6px;border-radius:3px;background:rgba(255,255,255,min(var(--glass-max),calc(.2 * var(--glass-k) + var(--glass-b))));margin-top:14px;overflow:hidden}
.media .bar i{display:block;height:100%;background:#fff;border-radius:3px}
.media .ctl{display:flex;justify-content:center;align-items:center;gap:22px;margin-top:12px}
.media .ctl span{cursor:pointer;display:grid;place-items:center}
.media .ctl .pp{width:52px;height:52px;border-radius:50%;background:var(--cream);color:var(--ink)}
.hero{padding:30px 2px 4px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.hero .t{font-size:clamp(36px,5vw,52px);font-weight:400;letter-spacing:-.02em;line-height:1.05}
.hero .s{color:var(--muted);font-size:17px;margin-top:8px}
h2{font-size:13px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin:32px 2px 0;font-family:inherit}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:18px;margin-top:16px}
/* a room's categories share rows:the outer grid has the same columns as the tiles, each category spans its own tiles */
.tiles.secs{grid-auto-flow:row dense;align-items:start;row-gap:0;margin-top:0}
.secs>.sec{grid-column:span var(--span,1);min-width:0;display:flex;flex-direction:column}
/* every device card in a room has the same height:each category is one row (see _packSections), rows share one height */
.wrap:not(.editing) .tiles.secs{grid-auto-rows:1fr;align-items:stretch}
.secs>.sec>.tiles{flex:1;grid-auto-rows:1fr}
.secs>.sec>h2{margin-top:24px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.secs>.sec>.tiles{grid-template-columns:repeat(var(--span,1),minmax(0,1fr));margin-top:10px}
.tile{position:relative;border-radius:26px;padding:18px;cursor:pointer;min-height:170px;display:flex;flex-direction:column;justify-content:space-between;transition:background .25s,color .25s,transform .12s;user-select:none;-webkit-user-select:none;touch-action:manipulation}
.tile:active{transform:scale(.97)}
.tile.big{grid-column:span 2}
/* robot vacuum card */
.vac-hd{display:flex;align-items:center;gap:16px;margin-top:18px}
.vac-bat{display:flex;flex-direction:column;align-items:center;justify-content:center;width:86px;height:86px;border-radius:50%;background:color-mix(in srgb,var(--acc) 22%,transparent);flex:none}
.vac-bat ha-icon{--mdc-icon-size:26px;color:var(--acc)}.vac-bat b{font-size:18px;font-weight:600}
.vac-st b{display:block;font-family:var(--display);font-size:24px;font-weight:400}
.vac-st small{display:block;color:var(--muted);font-size:14px;margin-top:3px}
.vac-st .vac-err{color:#ff9f0a}
.vac-rt .pill{height:42px}
.vac-rt .pill ha-icon{--mdc-icon-size:18px}
.vac-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:16px}
.vac-b{all:unset;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 6px;border-radius:18px;background:rgba(255,255,255,min(var(--glass-max),calc(.08 * var(--glass-k) + var(--glass-b))));font-size:14px;font-weight:600;text-align:center}
.vac-b ha-icon{--mdc-icon-size:24px}
.vac-b.act{background:var(--cream);color:var(--ink)}
.vac-b:active{transform:scale(.96)}
.vac-note{color:var(--muted);font-size:14px;margin-top:6px}
.vac-map{display:block;width:100%;max-height:340px;object-fit:contain;border-radius:18px;margin-top:16px;background:rgba(var(--deep-rgb, 0,0,0),min(var(--deep-max),calc(.25 + var(--deep-add))))}
[data-vclean][disabled]{opacity:.5;pointer-events:none}
.vac-folds{margin-top:18px;display:flex;flex-direction:column;gap:8px}
.vac-sec{all:unset;cursor:pointer;display:flex;align-items:center;gap:10px;padding:13px 16px;border-radius:16px;background:rgba(255,255,255,min(var(--glass-max),calc(.07 * var(--glass-k) + var(--glass-b))));font-weight:600;font-size:15px}
.vac-sec span{flex:1}.vac-sec small{color:var(--muted);font-weight:500}
.vac-sec ha-icon{--mdc-icon-size:20px}.vac-sec .chev{transition:transform .2s}.vac-sec.open .chev{transform:rotate(180deg)}
.vac-secb{padding:0 2px 6px}.vac-secb .sub:first-child{margin-top:6px}
/* Climate screen */
.tiles.clim{grid-template-columns:repeat(auto-fill,minmax(260px,1fr))}
.clc .clrow{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:12px}
.clcur b{display:block;font-family:var(--display);font-size:36px;font-weight:300;line-height:1}
.clcur small{display:block;font-size:13px;color:var(--muted);margin-top:4px}
.tile.on .clcur small{color:var(--ink-soft)}
.clset{display:flex;align-items:center;gap:8px}
.clset b{font-size:20px;font-weight:500;min-width:54px;text-align:center;font-variant-numeric:tabular-nums}
.clset .round{width:42px;height:42px;font-size:22px}
.tile.on .clset .round{background:rgba(var(--deep-rgb, 42,34,31),min(var(--deep-max),calc(.08 + var(--deep-add))));color:var(--ink)}
.tiles.rtemp{grid-template-columns:repeat(auto-fill,minmax(170px,1fr))}
.tile.rt{min-height:0;gap:10px}
.rt .nm{margin-top:0}
.rtv{display:flex;align-items:baseline;gap:12px}
.rtv b{font-family:var(--display);font-size:30px;font-weight:300}
.rtv span{display:flex;align-items:center;gap:3px;color:var(--muted);font-size:15px}
.rtv ha-icon{--mdc-icon-size:16px}
.tile .row1{display:flex;justify-content:space-between;align-items:flex-start}
.tile .ic{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:var(--glass-hi);transition:background .2s}
.tile .ic ha-icon{--mdc-icon-size:24px}
.tile .pw{width:54px;height:54px}
.tile .pw ha-icon{--mdc-icon-size:24px}
.tile .nm{font-weight:500;font-size:19px;line-height:1.2;margin-top:14px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tile .st{font-size:15px;color:var(--muted);margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tile.on{background:var(--cream);color:var(--ink);border-color:transparent;box-shadow:0 18px 40px -20px rgba(0,0,0,calc(.45 * var(--shade-k)))}
.tile.on .st,.tile.on .ex{color:var(--ink-soft)}
.tile.on .ic{background:var(--acc);color:var(--ink)}
.tile.sensor{cursor:default}
.tile.sensor .val{font-size:34px;font-weight:300;letter-spacing:-.02em;margin-top:6px}
.tile.na{opacity:.45}
.tile .ex{font-size:13px;color:var(--muted);margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dock{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:5;display:flex;gap:6px;padding:7px;border-radius:999px;background:var(--sheen),rgba(var(--deep-rgb, 26,22,30),min(var(--deep-max),calc(.5 + var(--deep-add))));backdrop-filter:blur(26px) saturate(170%);-webkit-backdrop-filter:blur(26px) saturate(170%);border:1px solid var(--line);box-shadow:var(--edge),0 16px 40px -18px rgba(0,0,0,calc(.6 * var(--shade-k)))}
.dock button{all:unset;cursor:pointer;display:flex;align-items:center;gap:10px;height:50px;padding:0 24px;border-radius:999px;font-size:18px;font-weight:500;color:var(--muted);transition:background .2s,color .2s}
.dock[hidden]{display:none}
.dock{width:max-content;max-width:calc(100vw - 24px)}
.dock button span{white-space:nowrap}
/* tablets:a lower, lighter dock */
@media (max-width:1280px),(max-height:820px){.dock{bottom:14px;padding:6px;gap:4px}.dock .blob{top:6px;bottom:6px}.dock button{height:44px;padding:0 18px;font-size:16px;gap:8px}.dock ha-icon{--mdc-icon-size:20px}}
.dock.compact{gap:2px}
.dock.compact button{padding:0 14px;height:44px;font-size:16px;gap:8px}
.dock.compact button:not(.act) span,.dock.icons button span{display:none}
.dock.icons button{padding:0 15px}
/* light effects (this device): no frosted-glass blur, the costliest thing for weak tablets such as the Galaxy Tab A7.
   "Light glass" imitates the frost instead: a slightly denser fill, a stronger sheen from the top-left and a brighter edge. */
:host(.lite:not(.light)){--sheen:linear-gradient(150deg,rgba(255,255,255,.17),rgba(255,255,255,.06) 38%,rgba(255,255,255,.015) 72%);--edge:inset 0 1px 0 rgba(255,255,255,.24),inset 0 0 0 1px rgba(255,255,255,.04)}
:host(.lite){--glass:rgba(255,255,255,min(var(--glass-max),calc(.13 * var(--glass-k) + var(--glass-b))));--glass-hi:rgba(255,255,255,min(var(--glass-max),calc(.18 * var(--glass-k) + var(--glass-b))));--glass-strong:rgba(var(--deep-rgb, 34,26,40),min(var(--deep-max),calc(.94 + var(--deep-add))));--lift:0 0 0 transparent}
:host(.lite) *,:host(.lite) *::before,:host(.lite) *::after{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
:host(.lite) .dock{background:rgba(var(--deep-rgb, 34,28,38),min(var(--deep-max),calc(.94 + var(--deep-add))))}
:host(.lite) .ov{background:rgba(var(--deep-rgb, 10,4,12),min(var(--deep-max),calc(.72 + var(--deep-add))))}
.dock button{position:relative;z-index:1;transition:color .35s}
.dock button.act{color:var(--ink)}
.dock .blob{position:absolute;left:0;top:7px;bottom:7px;border-radius:999px;pointer-events:none;transition:transform .55s cubic-bezier(.34,1.36,.5,1),width .55s cubic-bezier(.34,1.36,.5,1)}
.dock .blob::before{content:"";position:absolute;inset:0;border-radius:inherit;background:var(--cream);
  box-shadow:inset 0 1px 1px rgba(255,255,255,.85),inset 0 -2px 4px rgba(0,0,0,calc(.10 * var(--shade-k))),0 6px 18px rgba(0,0,0,calc(.22 * var(--shade-k)))}
.dock .blob::after{content:"";position:absolute;inset:1px 12% auto;height:45%;border-radius:999px;background:linear-gradient(rgba(255,255,255,min(var(--glass-max),calc(.55 * var(--glass-k) + var(--glass-b)))),rgba(255,255,255,min(var(--glass-max),calc(0 * var(--glass-k) + var(--glass-b)))));opacity:.7}
.dock .blob.go::before{animation:lens .55s cubic-bezier(.3,.9,.4,1)}
@keyframes lens{
  0%{transform:none}
  35%{transform:scale(1.16,.86);background:rgba(255,255,255,min(var(--glass-max),calc(.22 * var(--glass-k) + var(--glass-b))));backdrop-filter:blur(3px) saturate(190%) brightness(1.15);-webkit-backdrop-filter:blur(3px) saturate(190%) brightness(1.15);
      box-shadow:inset 0 1px 2px rgba(255,255,255,.9),inset 0 -1px 3px rgba(255,255,255,.35),0 8px 24px rgba(0,0,0,calc(.25 * var(--shade-k)))}
  70%{transform:scale(.97,1.04)}
  100%{transform:none}}
.wrap.vin{animation:vin .46s cubic-bezier(.2,.8,.2,1)}
.wrap.vin.flat{animation-name:vinflat}
@keyframes vin{from{opacity:0;transform:translateY(14px) scale(.985);filter:blur(10px)}to{opacity:1;transform:none;filter:blur(0)}}
@keyframes vinflat{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
/* Settings → Appearance → Animations off */
:host(.noanim) *,:host(.noanim) *::before,:host(.noanim) *::after{animation:none!important;transition:none!important}
@media (prefers-reduced-motion:reduce){.wrap.vin,.dock .blob.go::before{animation:none}.dock .blob{transition:none}}
.dock ha-icon{--mdc-icon-size:22px}
.empty{color:var(--muted);padding:40px 4px}
.ov{position:fixed;inset:0;z-index:10;background:radial-gradient(120% 90% at 50% 40%,rgba(var(--deep-rgb, 10,6,14),min(var(--deep-max),calc(.32 + var(--deep-add)))),rgba(var(--deep-rgb, 6,3,8),min(var(--deep-max),calc(.62 + var(--deep-add)))));backdrop-filter:blur(14px) saturate(120%);-webkit-backdrop-filter:blur(14px) saturate(120%);display:grid;place-items:center}
.ov.enter{animation:fade .18s}
@keyframes fade{from{opacity:0}}
@keyframes up{from{transform:translateY(40px);opacity:0}}
@keyframes pop{from{transform:scale(.94);opacity:0}}
.sheet{width:min(400px,calc(100vw - 32px));max-height:calc(100vh - 32px);overflow:auto;border-radius:34px;padding:24px;background:var(--sheen),var(--glass-strong);backdrop-filter:blur(40px) saturate(180%);-webkit-backdrop-filter:blur(40px) saturate(180%);border:1px solid rgba(var(--fg),min(1,calc(.14 * var(--fg-k))));box-shadow:var(--edge),0 40px 90px -30px rgba(0,0,0,calc(.7 * var(--shade-k)))}
.ov.enter .sheet{animation:pop .22s cubic-bezier(.2,.9,.3,1.2)}
.sheet .hd{display:flex;align-items:center;gap:12px}
.sh-only{display:none}.sheet.cols .sh-only{display:block}
.sheet{position:relative}
.sh-x{all:unset;cursor:pointer;flex:none;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:var(--muted);background:rgba(255,255,255,min(var(--glass-max),calc(.08 * var(--glass-k) + var(--glass-b))));margin-left:4px}
.sh-x:hover{color:rgb(var(--fg));background:rgba(255,255,255,min(var(--glass-max),calc(.16 * var(--glass-k) + var(--glass-b))))}.sh-x ha-icon{--mdc-icon-size:22px}
/* landscape screens:wider sheets, in two columns when there is a main control and more */
@media (min-width:900px) and (min-aspect-ratio:4/3){
  .ov .sheet{width:min(460px,calc(100vw - 48px))}
  .ov .sheet.wide{width:min(640px,calc(100vw - 48px))}
  .ov .sheet.cols{width:min(1120px,calc(100vw - 64px));max-height:calc(100vh - 40px);display:grid;grid-template-columns:minmax(330px,.85fr) minmax(0,1.15fr);grid-template-rows:auto minmax(0,1fr);column-gap:28px;overflow:hidden}
  .sheet.cols>.hd{grid-column:1/-1;padding-bottom:6px}
  .sh-main,.sh-side{min-height:0;overflow:auto;scrollbar-width:thin;padding:0 4px 4px}
  .sheet.cols .sh-side>.sub:first-child,.sheet.cols .sh-side>.wx-alert:first-child,.sheet.cols .sh-side>.vac-folds:first-child{margin-top:12px}
  .sheet.cols .ring{margin-top:18px}
  .sheet.cols .vslider{height:260px}
  .sheet.cols .row.presets{flex-wrap:wrap;overflow:visible}
  .sheet.cols .sh-side>.sub:first-child{margin-top:12px}
  .sheet.cols .sh-side>.row:first-of-type{justify-content:flex-start}
  .sheet.cols .sh-side .vac-map{margin-top:12px;max-height:300px}
  .ov .sheet.cols-sm{width:min(860px,calc(100vw - 64px))}
  .sheet.cols .sh-side .swatches{justify-content:flex-start;flex-wrap:wrap}
  .sheet.cols .sh-side .attrs{margin-top:12px}
  .sheet.cols .sh-side>.row{justify-content:flex-start}
  .sheet.cols .sh-main>.vslider:first-child{margin-top:18px}
  .sheet.wide1 .dv-grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
  .sheet.wide1 .dv-tgrid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
  .sheet.wide1 .row.presets{flex-wrap:wrap;overflow:visible}
}
.sheet .hd .ic{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:var(--acc,rgba(255,255,255,min(var(--glass-max),calc(.15 * var(--glass-k) + var(--glass-b)))));color:var(--ink)}
.sheet .hd .nm{font-size:20px;font-weight:500;flex:1}
.sheet .hd .st{font-size:14px;color:var(--muted)}
.vslider{position:relative;width:124px;height:300px;margin:26px auto 10px;border-radius:38px;background:rgba(255,255,255,min(var(--glass-max),calc(.14 * var(--glass-k) + var(--glass-b))));overflow:hidden;cursor:ns-resize;touch-action:none}
.vslider .fill{position:absolute;left:0;right:0;bottom:0;background:var(--cream)}
.vslider .lbl{position:absolute;left:0;right:0;bottom:16px;text-align:center;font-weight:600;font-family:var(--display);font-size:18px;color:var(--ink)}
.row{display:flex;gap:10px;justify-content:center;margin-top:16px;flex-wrap:wrap}
.swatches{display:flex;gap:10px;justify-content:center;margin-top:14px}
.sw{width:32px;height:32px;border-radius:50%;cursor:pointer;border:2px solid rgba(var(--fg),min(1,calc(.4 * var(--fg-k))))}
.ring{width:230px;height:230px;margin:22px auto 6px;border-radius:50%;display:grid;place-items:center;position:relative}
.ring .tgt{font-size:56px;font-weight:300;letter-spacing:-.03em}
.ring .cur{font-size:14px;color:var(--muted);text-align:center}
.round{all:unset;cursor:pointer;width:58px;height:58px;border-radius:50%;display:grid;place-items:center;background:rgba(255,255,255,min(var(--glass-max),calc(.14 * var(--glass-k) + var(--glass-b))));font-size:26px}
.attrs{margin-top:14px;font-size:13px;color:var(--muted);display:grid;grid-template-columns:auto 1fr;gap:6px 14px}
.attrs b{color:rgb(var(--fg));font-weight:500;text-align:right;overflow:hidden;text-overflow:ellipsis}
.more{display:flex;justify-content:center;margin-top:18px}
.more button{all:unset;cursor:pointer;width:40px;height:40px;border-radius:50%;display:grid;place-items:center;color:var(--muted);background:rgba(255,255,255,min(var(--glass-max),calc(.08 * var(--glass-k) + var(--glass-b))))}
.more button:hover{color:rgb(var(--fg));background:rgba(255,255,255,min(var(--glass-max),calc(.16 * var(--glass-k) + var(--glass-b))))}
.more ha-icon{--mdc-icon-size:20px}
.ring.sm{width:180px;height:180px;margin-top:16px}.ring.sm .tgt{font-size:44px}.ring.sm .cur{font-size:12px;max-width:130px;margin:0 auto}
.ring .tgt.rng{font-size:38px}.ring.sm .tgt.rng{font-size:30px}
.ring .act{font-size:13px;font-weight:600;letter-spacing:.04em;margin-top:2px}
.tset{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:12px}
.tset span{width:78px;color:var(--muted);font-size:14px}
.tset b{width:58px;text-align:center;font-size:20px;font-weight:500}
.tset .round{width:46px;height:46px;font-size:22px}
.themes{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:12px}
.themes .th{height:64px;border-radius:18px;cursor:pointer;display:flex;align-items:flex-end;padding:8px 10px;font-size:12px;font-weight:600;border:2px solid transparent}
.themes .th.act{border-color:rgb(var(--fg))}
.list{margin-top:12px;display:flex;flex-direction:column;gap:6px;max-height:36vh;overflow:auto}
.list .it{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 12px;border-radius:16px;background:rgba(255,255,255,min(var(--glass-max),calc(.06 * var(--glass-k) + var(--glass-b))));font-size:15px}
.list .it span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.list .it small{color:var(--muted)}
.list .pill{height:36px;font-size:14px;padding:0 14px}
.sub{font-size:12px;font-weight:600;color:var(--muted);margin:22px 2px 0;text-transform:uppercase;letter-spacing:.18em}
.set{padding:40px 0 60px}
.set-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap}
.set-hd .t{font-family:var(--display);font-size:clamp(38px,5vw,54px);font-weight:400;letter-spacing:-.02em;margin-top:10px;line-height:1}
.set-hd .s{color:var(--muted);font-size:17px;margin-top:10px}
.set-hd .actions{align-items:center}
.pill.dim{opacity:.55;cursor:default}
.set-body{display:grid;grid-template-columns:270px minmax(0,1fr);gap:40px;margin-top:40px;align-items:start}
.set-nav{display:flex;flex-direction:column;gap:6px;position:sticky;top:20px}
.set-nav button{all:unset;cursor:pointer;display:flex;align-items:center;gap:14px;height:58px;padding:0 14px;border-radius:18px;font-size:18px;font-weight:500;color:rgba(var(--fg),min(1,calc(.85 * var(--fg-k))));transition:background .2s}
.set-nav button:hover{background:rgba(255,255,255,min(var(--glass-max),calc(.06 * var(--glass-k) + var(--glass-b))))}
.set-nav button.act{background:rgba(255,255,255,min(var(--glass-max),calc(.9 * var(--glass-k) + var(--glass-b))));color:var(--ink)}
.set-nav .ni{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--glass-hi)}
.set-nav button.act .ni{background:rgba(var(--deep-rgb, 42,34,31),min(var(--deep-max),calc(.08 + var(--deep-add))))}
.set-nav ha-icon{--mdc-icon-size:20px}
.set-main{display:flex;flex-direction:column;gap:22px;min-width:0}
.panel{border-radius:32px;padding:28px}
.panel h3{font-family:var(--display);font-size:23px;font-weight:500;margin:26px 0 4px}
.panel p{color:var(--muted);font-size:16px;margin:0 0 16px}
.preview{display:flex;justify-content:center;gap:22px;padding:10px 0 8px;flex-wrap:wrap}
.pv{width:210px;min-height:230px;flex:none;cursor:default}
.pv .ri{background:var(--amber)!important;color:var(--ink)}
.pv.off .ri{background:var(--glass-hi)!important;color:rgb(var(--fg))}
.pv-badge{position:absolute;top:-12px;right:-12px;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--amber);color:var(--ink);font-weight:700;font-size:15px;border:3px solid rgba(var(--fg),min(1,calc(.25 * var(--fg-k))))}
.pv-bar{height:34px;border-radius:17px;background:rgba(var(--deep-rgb, 42,34,31),min(var(--deep-max),calc(.08 + var(--deep-add))));margin-top:14px;overflow:hidden}
.pv-bar i{display:block;width:75%;height:100%;border-radius:17px;background:var(--amber)}
.swr{display:flex;flex-wrap:wrap;gap:14px}
.swc{width:56px;height:56px;border-radius:50%;cursor:pointer;border:3px solid rgba(var(--fg),min(1,calc(.18 * var(--fg-k))));position:relative;transition:transform .12s}
.swc:hover{transform:scale(1.06)}
.swc.act{border-color:rgb(var(--fg))}
.swc.act::after{content:"";position:absolute;left:50%;top:50%;width:14px;height:8px;border-left:2.5px solid #2a221f;border-bottom:2.5px solid #2a221f;transform:translate(-50%,-65%) rotate(-45deg)}
.bgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:16px}
.bgc{cursor:pointer;border-radius:24px;padding:10px;border:3px solid rgba(var(--fg),min(1,calc(.12 * var(--fg-k))));background:rgba(255,255,255,min(var(--glass-max),calc(.05 * var(--glass-k) + var(--glass-b))))}
.bgc div{height:110px;border-radius:16px}
.bgc span{display:block;font-weight:600;margin:10px 4px 2px}
.bgc.act{border-color:rgb(var(--fg));background:rgba(255,255,255,min(var(--glass-max),calc(.14 * var(--glass-k) + var(--glass-b))))}
.opts{display:flex;flex-direction:column;gap:4px}
.opt{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:14px 4px;border-bottom:1px solid var(--line)}
.opt:last-child{border-bottom:0}
.opt b{display:block;font-size:17px;font-weight:600}
.opt small{display:block;color:var(--muted);font-size:14px;margin-top:2px}
.tg{width:58px;height:34px;border-radius:17px;background:rgba(255,255,255,min(var(--glass-max),calc(.18 * var(--glass-k) + var(--glass-b))));position:relative;cursor:pointer;flex:none;transition:background .2s}
.tg i{position:absolute;top:3px;left:3px;width:28px;height:28px;border-radius:50%;background:#fff;transition:transform .2s;box-shadow:0 2px 6px rgba(0,0,0,calc(.25 * var(--shade-k)))}
.tg.on{background:var(--amber)}
.tg.on i{transform:translateX(24px)}
.list.big{max-height:none}
.list.big .it{padding:10px 12px;gap:12px;font-size:16px}
.ri.sm{width:40px;height:40px}.ri.sm ha-icon{--mdc-icon-size:20px}
.mini{all:unset;cursor:pointer;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--glass-hi)}
.mini[disabled]{opacity:.3;cursor:default}
.facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-top:14px}
.facts div{padding:16px;border-radius:20px;background:rgba(255,255,255,min(var(--glass-max),calc(.06 * var(--glass-k) + var(--glass-b))))}
.facts small{display:block;color:var(--muted);font-size:13px}
.facts b{display:block;font-family:var(--display);font-size:24px;font-weight:500;margin-top:4px}
a.pill{color:inherit;text-decoration:none}
.toast{position:fixed;left:50%;bottom:30px;transform:translateX(-50%);z-index:20;background:var(--cream);color:var(--ink);font-weight:600;padding:14px 22px;border-radius:999px;box-shadow:0 10px 30px rgba(0,0,0,calc(.35 * var(--shade-k)));animation:pop .2s}
.wpill{cursor:pointer}
.hero .right{display:flex;gap:12px;align-items:center}
.sheet.wide{width:min(560px,calc(100vw - 32px))}
.fhs{display:flex;gap:10px;overflow-x:auto;padding:10px 2px 4px;scrollbar-width:none}
.fhs::-webkit-scrollbar{display:none}
.fh{flex:none;width:68px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 4px;border-radius:18px;background:rgba(255,255,255,min(var(--glass-max),calc(.06 * var(--glass-k) + var(--glass-b))))}
.fh small{font-size:12px;color:var(--muted)}
.fh b{font-family:var(--display);font-weight:500;font-size:18px}
.pp{color:#7cc4ff!important}
.fds{display:flex;flex-direction:column;margin-top:8px}
.fd{display:grid;grid-template-columns:52px 26px 44px 36px minmax(60px,1fr) 38px;align-items:center;gap:10px;padding:11px 4px;border-bottom:1px solid var(--line);font-size:16px}
.fd:last-child{border-bottom:0}

.fd b{font-family:var(--display);font-weight:500;text-align:right}
.fd small{color:var(--muted);text-align:right}
.opt.col{flex-direction:column;align-items:stretch}
.seg{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
.seg .pill{height:40px;font-size:15px;padding:0 16px}
.seg.sm{margin:0;gap:4px;flex-wrap:nowrap}
.mini.on{background:var(--cream);color:var(--ink);font-weight:700}
.mini{font-size:13px;font-weight:600}
/* edit mode */
.edhint{color:var(--muted);font-size:15px;margin-top:10px}
.editing .rc[data-key],.editing .tile[data-key]{animation:wob .35s ease-in-out infinite alternate;cursor:grab;touch-action:none}
.editing .rc[data-key]:nth-child(2n),.editing .tile[data-key]:nth-child(2n){animation-delay:-.17s}
@keyframes wob{from{transform:rotate(-.6deg)}to{transform:rotate(.6deg)}}
.dragging{animation:none!important;transform:scale(1.04)!important;z-index:3;box-shadow:0 24px 50px rgba(0,0,0,calc(.45 * var(--shade-k)))!important;cursor:grabbing!important}
.ed-x{all:unset;position:absolute;left:-10px;top:-10px;z-index:2;width:32px;height:32px;border-radius:50%;background:#ff453a;color:rgb(var(--fg));display:grid;place-items:center;font-size:22px;font-weight:700;line-height:1;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,calc(.35 * var(--shade-k)))}
.ed-big{all:unset;position:absolute;right:-10px;bottom:-10px;z-index:2;width:34px;height:34px;border-radius:50%;background:#fff;color:var(--ink);display:grid;place-items:center;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,calc(.35 * var(--shade-k)))}
.ed-big ha-icon{--mdc-icon-size:18px}
.edbar{position:fixed;right:22px;bottom:22px;z-index:6;display:flex;gap:10px}
.edbar .pill{height:52px;padding:0 24px;font-size:17px;backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
.rc.add,.tile.add{border:2px dashed rgba(var(--fg),min(1,calc(.3 * var(--fg-k))));background:transparent;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:var(--muted);cursor:pointer;font-weight:600}
.rc.add ha-icon,.tile.add ha-icon{--mdc-icon-size:30px;width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--glass-hi);color:rgb(var(--fg))}
.rc.big{grid-column:span 2}
.quick{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.qk{all:unset;cursor:pointer;display:flex;align-items:center;gap:6px;height:36px;padding:0 12px;border-radius:999px;background:rgba(var(--deep-rgb, 42,34,31),min(var(--deep-max),calc(.07 + var(--deep-add))));font-size:14px;font-weight:600;max-width:100%}
.rc.glass .qk{background:var(--glass-hi)}
.qk span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}
.qk ha-icon{--mdc-icon-size:18px}
.qk.on ha-icon{color:var(--amber)}
.rc.on .qk.on{background:var(--amber);color:var(--ink)}
.rc.on .qk.on ha-icon{color:var(--ink)}
/* list layout */
.as-list .grid{grid-template-columns:1fr;gap:10px}
.as-list .rc{min-height:0;flex-direction:row;align-items:center;gap:16px;padding:14px 18px;border-radius:22px}
.as-list .rc .row1{display:contents}
.as-list .rc .ri{order:0}
.as-list .rc .foot{order:1;margin:0;flex:1;display:flex;align-items:center;gap:18px;min-width:0}
.as-list .rc .foot .nm{font-size:19px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.as-list .rc .foot .meta{margin:0;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.as-list .rc .dots{margin:0}
.as-list .rc .pw{order:2;width:52px;height:52px}
.as-list .rc .quick{order:3;margin:0}
.as-list .rc.big{grid-column:auto}
.as-list .rc .eyebrow{margin:0!important;padding:0!important;flex:none!important}
.as-list .rc .big-num,.as-list .rc .big-txt{font-size:24px}
.as-list .rc.media{flex-wrap:wrap}
.as-list .tiles{grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px}
.as-list .tile{min-height:0;flex-direction:row;align-items:center;gap:14px;padding:12px 16px;border-radius:20px}
.as-list .tile .row1{display:contents}
.as-list .tile .ic{order:0;flex:none}
.as-list .tile .tx{order:1;flex:1;min-width:0}
.as-list .tile .nm{margin-top:0;-webkit-line-clamp:1}
.as-list .tile .pw{order:2;width:46px;height:46px}
.as-list .tile.big{grid-column:auto}
.as-list .tile.sensor .val{font-size:22px;margin-top:0}
/* screensaver */
.saver{position:fixed;inset:0;z-index:30;background:radial-gradient(80% 70% at 50% 40%,#22121f,#050305);display:grid;place-items:center;cursor:pointer}
.saver.enter{animation:fade .6s}
.sv-in{text-align:center;animation:drift 60s ease-in-out infinite alternate}
@keyframes drift{0%{transform:translate(-4vw,-3vh)}50%{transform:translate(3vw,2vh)}100%{transform:translate(-2vw,4vh)}}
.sv-clock{font-size:clamp(90px,18vw,220px);font-weight:200;margin:0;color:rgba(var(--fg),min(1,calc(.92 * var(--fg-k))))}
.sv-date{font-size:clamp(18px,2.4vw,28px);color:rgba(var(--fg),min(1,calc(.6 * var(--fg-k))));margin-top:6px}
.sv-meta{display:flex;gap:26px;justify-content:center;margin-top:26px;color:rgba(var(--fg),min(1,calc(.55 * var(--fg-k))));font-size:18px;flex-wrap:wrap}
.sv-meta span{display:flex;align-items:center;gap:8px}
.search{all:unset;box-sizing:border-box;width:100%;height:48px;padding:0 18px;border-radius:999px;background:rgba(255,255,255,min(var(--glass-max),calc(.08 * var(--glass-k) + var(--glass-b))));border:1px solid var(--line);font-size:16px;color:rgb(var(--fg))}
.search::placeholder{color:var(--muted)}
.it.off{opacity:.55}
.it ha-icon{--mdc-icon-size:20px;flex:none}
.tag{font-style:normal;font-size:12px;font-weight:600;padding:4px 10px;border-radius:999px;background:rgba(255,255,255,min(var(--glass-max),calc(.08 * var(--glass-k) + var(--glass-b))));color:var(--muted);white-space:nowrap}
.tag.pri{background:color-mix(in srgb,var(--amber) 30%,transparent);color:rgb(var(--fg))}
.opt.dis{opacity:.5;pointer-events:none}
:host(:fullscreen),:host-context(:fullscreen){min-height:100vh}
.dv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:8px;margin-top:10px}
.dv-r{display:flex;flex-direction:column;gap:2px;padding:12px;border-radius:16px;background:rgba(255,255,255,min(var(--glass-max),calc(.07 * var(--glass-k) + var(--glass-b))));min-width:0}
.dv-rv{display:flex;align-items:center;gap:6px;min-width:0}
.dv-r ha-icon{--mdc-icon-size:18px;color:var(--amber);flex:none}
.dv-r b{font-family:var(--display);font-weight:500;font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dv-r small{color:var(--muted);font-size:12px;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.dv-list{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.dv-c{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,min(var(--glass-max),calc(.06 * var(--glass-k) + var(--glass-b))));font-size:15px}
.dv-c>span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv-c small{color:var(--muted)}
.dv-c ha-icon{--mdc-icon-size:20px;flex:none}
.dv-c.col{flex-direction:column;align-items:stretch}
.dv-h{display:flex;align-items:center;gap:10px}
.dv-c .seg{margin-top:6px}
.dv-c .seg .pill{height:34px;font-size:14px;padding:0 14px}
.dv-v{font-variant-numeric:tabular-nums;min-width:48px;text-align:center;font-weight:600}
.hslider{position:relative;height:52px;margin:18px 0 4px;border-radius:26px;background:rgba(255,255,255,min(var(--glass-max),calc(.14 * var(--glass-k) + var(--glass-b))));overflow:hidden;cursor:ew-resize;touch-action:none}
.hslider .fill{position:absolute;left:0;top:0;bottom:0;background:var(--cream)}
.hslider .lbl{position:absolute;left:18px;top:50%;transform:translateY(-50%);font-weight:600;font-family:var(--display);font-size:17px;color:var(--ink);mix-blend-mode:normal}
.row.presets{flex-wrap:nowrap;justify-content:flex-start;overflow-x:auto;scrollbar-width:none;margin-top:12px}
.row.presets::-webkit-scrollbar{display:none}
.row.presets .pill{flex:none;height:40px;font-size:15px}
.dv-tgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}
.dv-t{all:unset;cursor:pointer;display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,min(var(--glass-max),calc(.07 * var(--glass-k) + var(--glass-b))));font-size:14px;font-weight:600;min-width:0;transition:background .2s,color .2s}
.dv-t span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv-t ha-icon{--mdc-icon-size:19px;flex:none}
.dv-t.on{background:var(--cream);color:var(--ink)}
.dv-t.on ha-icon{color:var(--ink)}
.dv-sel{padding:8px 10px 8px 12px;text-align:left}
.dv-sv{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}
.dv-sv small{font-size:11px;font-weight:500;color:var(--muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv-sv b{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dv-sel .chev{--mdc-icon-size:18px;color:var(--muted);transition:transform .25s}
.dv-sel.open{background:rgba(255,255,255,min(var(--glass-max),calc(.14 * var(--glass-k) + var(--glass-b))))}.dv-sel.open .chev{transform:rotate(180deg)}
.dv-opts{grid-column:1/-1;padding:2px 2px 4px}.dv-opts.enter{animation:pop .2s}
.dv-opts .row.presets{margin-top:0}
.dv-opts .pill{height:36px;font-size:14px;padding:0 14px}
.sheet.dev .sub{margin-top:16px}
@media (max-width:720px){
  .ov.dev{place-items:end center}
  .sheet.dev{width:100vw;max-width:none;max-height:92vh;border-radius:28px 28px 0 0;padding:16px 16px 22px;border-bottom:0}
  .ov.enter .sheet.dev{animation:up .26s cubic-bezier(.2,.9,.3,1)}
  .sheet.dev .hd .ic{width:40px;height:40px}.sheet.dev .hd .nm{font-size:18px}.sheet.dev .hd .pill{height:40px;padding:0 16px;font-size:15px}
  .sheet.dev .dv-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
  .sheet.dev .dv-r{padding:9px 10px;border-radius:14px}.sheet.dev .dv-r b{font-size:15px}.sheet.dev .dv-r ha-icon{--mdc-icon-size:15px}
  .sheet.dev .dv-r small{font-size:11px}
  .sheet.dev .hslider{height:46px;margin-top:14px}
  .sheet.dev .more{margin-top:12px}

  .tag{display:none}

  .rc.big{grid-column:span 2}.edbar{right:12px;bottom:14px}.edbar .pill{height:46px;padding:0 18px}
  .as-list .rc .foot{flex-direction:column;align-items:flex-start;gap:2px}.as-list .rc .dots{display:none}.as-list .tiles{grid-template-columns:1fr}
  .fd{grid-template-columns:44px 24px 40px 32px minmax(40px,1fr) 34px;gap:8px;font-size:14px}.stage{height:58vh;min-height:340px;border-radius:24px;margin-bottom:20px}.hint3{display:none}

  .set{padding-top:20px}.set-body{grid-template-columns:1fr;gap:18px;margin-top:22px}
  .set-nav{flex-direction:row;overflow-x:auto;position:static;scrollbar-width:none}.set-nav::-webkit-scrollbar{display:none}
  .set-nav button{height:46px;font-size:15px;flex:none;padding:0 14px 0 8px}.set-nav .ni{width:30px;height:30px}
  .panel{padding:20px;border-radius:26px}.swc{width:44px;height:44px}.pv{width:160px;min-height:190px}.bgs{grid-template-columns:1fr 1fr}

  .wrap{padding:0 16px calc(var(--dock-space,94px) + 12px)}.top{padding-top:20px}.statusrow{margin-top:24px}
  .grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.rc{min-height:190px;padding:16px;border-radius:24px}
  .rc .nm{font-size:18px}.rc .meta{font-size:14px}.ri{width:44px;height:44px}.pw{width:50px;height:50px}
  .tiles{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.tile{min-height:150px;padding:14px}.tile .nm{font-size:16px}.tile .pw{width:44px;height:44px}
  .wpill{height:48px;padding:0 16px}.wpill b{font-size:22px}.wpill span{display:none}.av,.iconbtn{width:46px;height:46px}
  .dock button{padding:0 16px;height:46px}.dock button span{display:none}.big-num{font-size:38px}.big-txt{font-size:24px}
}
/* tablets in landscape (short screens): denser cards, so three rows of rooms or devices fit above the dock */
@media (min-width:721px) and (max-height:920px){
  .hero{padding-top:18px}.hero .t{font-size:40px}.hero .s{font-size:15px;margin-top:4px}.top{padding-top:22px}
  .grid{grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;margin-top:16px}
  .rc{min-height:clamp(116px,calc((100vh - 226px) / 3),250px);padding:16px;border-radius:24px}
  .ri{width:42px;height:42px}.ri ha-icon{--mdc-icon-size:22px}.pw{width:50px;height:50px}.pw ha-icon{--mdc-icon-size:24px}
  .rc .nm{font-size:19px}.rc .meta{font-size:14px;margin-top:2px}.dots{margin-top:8px;min-height:14px}.dots .tmp{font-size:14px}
  .tiles{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px;margin-top:12px}
  .tile{min-height:clamp(112px,calc((100vh - 352px) / 3),170px);padding:14px;border-radius:22px}
  .tile .ic{width:42px;height:42px}.tile .ic ha-icon{--mdc-icon-size:22px}.tile .pw{width:46px;height:46px}.tile .pw ha-icon{--mdc-icon-size:22px}
  .tile .nm{font-size:17px;margin-top:8px}.tile .st{font-size:14px}
  .tile.sensor .val{font-size:24px;margin-top:0;line-height:1.15}.tile.sensor .nm{margin-top:6px}.tile .ex{margin-top:2px}
}
@media (min-width:721px) and (max-height:920px){.secs>.sec>h2{margin-top:14px;letter-spacing:.14em}.secs>.sec>.tiles{margin-top:8px}}
/* a room on a wide screen:the back button sits beside the title instead of on a row of its own */
/* a room: the home screen's look; header with status and lights, category chips, one grid of cards */
.rhead{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:32px;padding-top:26px}
.rtitle .t{font-family:var(--display);font-size:clamp(40px,4.4vw,60px);font-weight:400;letter-spacing:-.02em;line-height:1.02;margin-top:6px}
.rstat{min-width:0;border-left:1px solid var(--line);padding-left:28px}
.rstat .status{font-size:clamp(22px,2.3vw,30px);margin-top:0}
.rhead .right{display:flex;align-items:center;gap:10px;flex-wrap:nowrap}
.rchips{display:flex;gap:10px;align-items:center;overflow-x:auto;scrollbar-width:none;margin-top:18px;padding-bottom:2px}
.rchips::-webkit-scrollbar{display:none}
.rchips .pill{flex:none;height:42px;font-size:15px}.rchips .pill small{opacity:.6;font-weight:600;margin-left:2px}
.rchips .scene{flex:none;height:42px;font-size:15px;padding:0 18px 0 14px}
.rsep{flex:none;width:1px;height:26px;background:var(--line);margin:0 4px}
.tiles.rgrid{grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px;margin-top:16px;grid-auto-rows:1fr}
.rgrid .tile{border-radius:var(--r);padding:18px;min-height:clamp(130px,calc((100vh - var(--dock-space,108px) - 236px) / 3),210px)}
.rgrid .tile .ic{width:46px;height:46px}
.rgrid .tile .nm{font-size:19px;margin-top:auto;padding-top:10px}
.rgrid .tile .tx{margin-top:auto}
@media (min-width:721px){.roomv>header{position:absolute;padding:0;margin-top:44px}.roomv>header .iconbtn{width:46px;height:46px}.roomv>.rhead{padding-left:62px}}
@media (min-width:721px) and (max-height:920px){
  .roomv>header{margin-top:26px}.rhead{padding-top:16px;gap:24px}.rtitle .t{font-size:44px}.rchips{margin-top:12px}.tiles.rgrid{gap:12px;margin-top:12px}
  .rgrid .tile{padding:14px 16px;min-height:clamp(118px,calc((100vh - var(--dock-space,100px) - 206px) / 3),200px)}
  .rgrid .tile .ic{width:40px;height:40px}.rgrid .tile .pw{width:44px;height:44px}.rgrid .tile .nm{font-size:17px}
  .rhead .pill{height:42px}
}
/* list layout:the room's cards as rows */
.as-list .tiles.rgrid{grid-template-columns:repeat(auto-fill,minmax(300px,1fr));grid-auto-rows:auto;gap:10px}
.as-list .rgrid .tile{min-height:0;border-radius:20px;padding:12px 16px}
.as-list .rgrid .tile .nm{margin-top:0;padding-top:0}.as-list .rgrid .tile .tx{margin-top:0}
@media (max-width:720px){
  .rhead{grid-template-columns:1fr auto;gap:12px;padding-top:12px}.rstat{grid-column:1/-1;grid-row:2;border:0;padding:0}
  .rhead .right .pill{display:none}.tiles.rgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .rgrid .tile{min-height:150px}
}
/* the Home screen on a landscape tablet:clock, status, scenes and two rows of cards on one screen */
@media (min-width:721px) and (max-height:920px){
  .top{padding-top:14px}.clock{font-size:52px;margin-top:4px}.wpill{height:48px}.wpill b{font-size:22px}.av,.top .iconbtn{width:46px;height:46px}
  .statusrow{margin-top:12px}.status{font-size:28px;margin-top:4px}.statusrow .pill{height:42px}
  .hsc{margin-top:14px}.hsc .scenes{padding-top:8px}.hsc .scene{height:42px;padding:0 18px 0 16px;font-size:15px}
  .hgrid{grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-top:14px}
  .hgrid .rc{min-height:clamp(116px,calc((100vh - 384px) / 2),210px)}
  .hgrid .big-num{font-size:36px}.hgrid .big-txt{font-size:22px}.hgrid .media .ttl{font-size:18px}.hgrid .media .ctl{gap:14px;margin-top:8px}.hgrid .media .ctl .pp{width:42px;height:42px}.hgrid .media .bar{margin-top:8px}
}
@media (min-width:721px) and (max-height:680px){
  .hero{padding-top:12px}.hero .t{font-size:34px}
  .rc{padding:12px 14px;border-radius:22px}.ri{width:36px;height:36px}.ri ha-icon{--mdc-icon-size:20px}.pw{width:42px;height:42px}.pw ha-icon{--mdc-icon-size:22px}
  .rc .nm{font-size:17px}.rc .meta{font-size:13px;margin-top:1px}.dots{margin-top:5px;min-height:10px}.dots i{width:8px;height:8px}
  .tile{padding:12px;min-height:clamp(96px,calc((100vh - 320px) / 3),170px)}.tile .ic{width:36px;height:36px}.tile .pw{width:40px;height:40px}.tile .nm{font-size:16px;margin-top:6px}.tile .st{font-size:13px}
}
/* ---------- home layouts ---------- */
.sdet{color:var(--muted);font-size:15px;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
/* "Big clock": the home status sits beside a large clock */
.top.t1{display:grid;grid-template-columns:auto minmax(0,1fr) minmax(0,470px);grid-template-areas:"clock stat side" "sc sc side";align-items:center;column-gap:36px;row-gap:0}
.t1 .tclock{grid-area:clock}.t1 .tstat{grid-area:stat}.t1 .tsc{grid-area:sc;min-width:0}
.t1 .tside{grid-area:side;align-self:start;display:flex;flex-direction:column;gap:12px;min-width:0}.t1 .tside .right{justify-content:flex-end}
.tdate{font-size:clamp(15px,1.4vw,18px);letter-spacing:.07em;color:rgba(var(--fg),min(1,calc(.82 * var(--fg-k))))}
.t1 .clock{font-size:clamp(70px,7.8vw,116px);line-height:.95;margin-top:6px}
.t1 .tstat{min-width:0;border-left:1px solid var(--line);padding-left:32px}
.t1 .tstat .status{font-size:clamp(24px,2.5vw,32px);margin-top:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.t1 .tstat .actions{margin-top:12px;flex-wrap:nowrap;gap:8px}.t1 .tstat .pill{padding:0 13px;font-size:14px;white-space:nowrap;flex:none;gap:6px}.t1 .tstat .pill ha-icon{--mdc-icon-size:18px}
/* home weather card:now, the next hours, tomorrow */
.wxc{border-radius:24px;padding:14px 18px;cursor:pointer;display:flex;gap:16px;min-width:0}
.wxc ha-icon{--mdc-icon-size:22px}
.wx-now{display:flex;align-items:center;gap:12px;min-width:0}
.wx-now>ha-icon{--mdc-icon-size:44px;color:var(--amber);flex:none}
.wx-t{display:flex;flex-direction:column;min-width:0}
.wx-t b{font-family:var(--display);font-size:36px;font-weight:300;line-height:1}
.wx-t span{font-size:15px;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wx-t small{color:var(--muted);font-size:13px;margin-top:2px;white-space:nowrap}
.wx-hrs{display:flex;gap:4px;justify-content:space-between;min-width:0}
.wx-hrs>div{display:flex;flex-direction:column;align-items:center;gap:3px;min-width:44px}
.wx-hrs small{color:var(--muted);font-size:12px}.wx-hrs b{font-size:15px;font-weight:600}
.wx-wait{color:var(--muted);font-size:13px;align-items:center}
.wxc .pp{display:flex;align-items:center;gap:1px;color:#64d2ff;font-size:11px}.wxc .pp ha-icon{--mdc-icon-size:12px}
.wx-tom{display:flex;flex-direction:column;gap:3px}
.wx-tom>small{color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.12em}
.wx-tl{display:flex;align-items:center;gap:8px}.wx-tl b{font-size:17px;font-weight:600}.wx-tl span{color:var(--muted);font-size:15px}
.wxc.wide{align-items:center;justify-content:space-between;gap:12px;padding:12px 16px}
.wxc.wide .wx-now{flex:none}.wxc.wide .wx-now>ha-icon{--mdc-icon-size:36px}.wxc.wide .wx-t b{font-size:30px}
.wxc.wide .wx-hrs{flex:1;padding:0 10px;gap:2px;border-left:1px solid var(--line);border-right:1px solid var(--line)}
.wxc.wide .wx-hrs>div{min-width:38px}.wxc.wide .wx-tom{flex:none}
.wxc.tall{flex-direction:column;gap:12px;margin-top:20px}
.wxc.tall .wx-hrs{padding:10px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.wxc.tall .wx-tom{flex-direction:row;align-items:center;justify-content:space-between}
/* IPMA warnings:a banner coloured by level */
.wx-alert{display:flex;align-items:flex-start;gap:10px;padding:8px 12px;border-radius:14px;background:color-mix(in srgb,var(--lv) 22%,transparent);border:1px solid color-mix(in srgb,var(--lv) 55%,transparent)}
.wx-alert>ha-icon{--mdc-icon-size:20px;color:var(--lv);flex:none;margin-top:1px}
.wx-alert b{display:block;font-size:14px;font-weight:600}.wx-alert small{display:block;font-size:12px;color:var(--muted)}
.wx-alert p{margin:8px 0 0;font-size:14px;line-height:1.4}
.wx-alert.full{margin-top:12px;padding:12px 14px}.wx-alert.full b{font-size:16px}
.wx-at{flex:1;min-width:0}.wx-alert:not(.full) .wx-at{display:flex;align-items:baseline;gap:8px;min-width:0}
.wx-alert:not(.full) .wx-at b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.wx-alert:not(.full) .wx-at small{white-space:nowrap;flex:none}
.wx-more{flex:none;align-self:center;font-size:12px;font-weight:700;padding:2px 8px;border-radius:999px;background:var(--lv);color:#1d1406}
.wxc.tall .wx-alert{padding:6px 10px}.wxc.tall{gap:10px}.wxc.tall .wx-hrs{padding:8px 0}
.lv-yellow{--lv:#ffcc00}.lv-orange{--lv:#ff9500}.lv-red{--lv:#ff3b30}
.wxc.wide.has-alert{flex-wrap:wrap;row-gap:10px}.wxc.wide .wx-alert{flex-basis:100%}
.wx-alert{min-width:0;max-width:100%}.wxc.wide .wx-alert{order:5}
.wx-al{--mdc-icon-size:18px;color:var(--lv);margin-left:2px}
.wx-ok{display:flex;align-items:center;gap:8px;margin-top:14px;color:var(--muted);font-size:14px}.wx-ok ha-icon{--mdc-icon-size:18px;color:#30d158}
.wx-chips{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.wx-chips span{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:rgba(255,255,255,min(var(--glass-max),calc(.08 * var(--glass-k) + var(--glass-b))));font-size:13px;color:var(--muted)}
.wx-chips span b{color:rgb(var(--fg))}.wx-chips ha-icon{--mdc-icon-size:16px;color:var(--amber)}
/* "Two columns": clock, weather and what is on in a third; actions, scenes and cards in two thirds */
.hcols{display:grid;grid-template-columns:minmax(250px,1fr) 2fr;gap:36px;align-items:start;padding-top:26px}
.hleft{position:sticky;top:20px;min-width:0}
.hleft .clock{font-size:clamp(80px,8.6vw,128px);line-height:.95;margin-top:8px}
.hleft .tdate{font-size:clamp(15px,1.45vw,19px)}
.hwx{margin-top:18px}.hwx .wpill{display:inline-flex}
.hstat{margin-top:24px}.hstat .status{font-size:clamp(24px,2.5vw,32px);margin-top:6px}
.hon{list-style:none;margin:12px 0 0;padding:0;display:flex;flex-direction:column;gap:8px;color:var(--muted);font-size:16px}
.hon li{display:flex;align-items:center;gap:10px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hon ha-icon{--mdc-icon-size:20px;color:var(--amber);flex:none}
.hon .hmore{padding-left:30px}
.hpeople{margin-top:22px}
.hmain{min-width:0}
.hbar{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.hbar .sp{flex:1}.hbar .actions{display:flex;gap:10px}
.hmain .hsc{margin-top:14px}
.hcols .hgrid{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:16px}
.hcols .hgrid .rc{min-height:clamp(120px,calc((100vh - 316px) / 3),230px);padding:16px}
.hcols .hgrid .rc .meta{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hcols .hgrid .big-num{font-size:32px}.hcols .hgrid .big-txt{font-size:20px}
.hcols .hgrid .media .ttl{font-size:16px}.hcols .hgrid .media .art{font-size:13px}.hcols .hgrid .media .bar{margin-top:6px}
.hcols .hgrid .media .ctl{gap:12px;margin-top:6px}.hcols .hgrid .media .ctl .pp{width:38px;height:38px}
@media (min-width:721px) and (max-height:920px){
  .t1 .pill,.hbar .pill{height:42px}
  .hcols{padding-top:14px;gap:28px}.hwx{margin-top:12px}.hstat{margin-top:16px}.hon{font-size:15px;gap:6px}
}
@media (min-width:721px) and (max-height:760px){
  .hcols .hgrid{gap:10px;margin-top:12px}.hcols .hgrid .rc{padding:12px 14px}.hmain .hsc{margin-top:8px}.hmain .hsc .scenes{padding-top:6px}
  .hcols .ri{width:38px;height:38px}.hcols .pw{width:44px;height:44px}
}
@media (max-width:720px){
  .top.t1{grid-template-columns:1fr;grid-template-areas:"side" "clock" "stat" "sc";gap:14px}.t1 .tstat{border:0;padding:0}.wxc.wide{flex-wrap:wrap}.wxc.wide .wx-hrs{order:3;flex-basis:100%;border:0;padding:8px 0 0}
  .hcols{grid-template-columns:1fr;gap:18px}.hleft{position:static}.hcols .hgrid{grid-template-columns:repeat(2,minmax(0,1fr))}
}
/* home:sidebar layout (a full-height glass sidebar, the cards beside it) */
.hside{display:grid;grid-template-columns:clamp(270px,24vw,330px) minmax(0,1fr);gap:26px;align-items:start;padding-top:20px}
.sb{position:sticky;top:20px;height:calc(100vh - var(--dock-space,108px) - 34px);border-radius:32px;padding:22px 20px 16px;display:flex;flex-direction:column;gap:14px;min-width:0;overflow:hidden}
.sb .tdate{font-size:14px}.sb .clock{font-size:clamp(64px,6.4vw,88px);line-height:.92;margin-top:-6px}
.sb .wxc{background:rgba(255,255,255,min(var(--glass-max),calc(.06 * var(--glass-k) + var(--glass-b))));backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:none;margin-top:0;padding:12px 14px;border-radius:22px;gap:8px}
.sb .wxc .wx-hrs{padding:6px 0}.sb .wxc .wx-hrs>div{min-width:0}
.sbst .status{font-size:22px;line-height:1.15}.sbst .sdet{font-size:14px;margin-top:4px}
.sbst .actions{margin-top:10px}.sbst .pill{height:40px;font-size:15px;padding:0 16px}
.sb>.sp{flex:1}
.sb .wx-alert{padding:7px 10px}.sb .wx-alert .wx-at{display:block}.sb .wx-alert .wx-at b{white-space:normal;font-size:13px;line-height:1.25}.sb .wx-alert .wx-at small{margin-top:1px}
.sbft{display:flex;align-items:center;gap:8px;padding-top:12px;border-top:1px solid var(--line)}.sbft .sp{flex:1}
.sbft .iconbtn{width:44px;height:44px}
.hside .hgrid{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:0}
.hside .hmain>.hsc{margin-top:0}.hside .hmain>.hsc .scenes{padding:8px 0 14px}.hside .hmain>.hsc .scene{height:44px;padding:0 18px 0 16px;font-size:16px}
.hside.has-sc .hgrid .rc{min-height:clamp(110px,calc((100vh - var(--dock-space,108px) - 160px) / 3),230px)}
.hside .hgrid .rc{min-height:clamp(120px,calc((100vh - var(--dock-space,108px) - 76px) / 3),240px);padding:16px}
.hside .hgrid .rc .meta{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hside .hgrid .big-num{font-size:32px}.hside .hgrid .big-txt{font-size:20px}
.hside .hgrid .media .ttl{font-size:16px}.hside .hgrid .media .art{font-size:13px}.hside .hgrid .media .bar{margin-top:6px}
.hside .hgrid .media .ctl{gap:12px;margin-top:6px}.hside .hgrid .media .ctl .pp{width:38px;height:38px}
@media (min-width:721px) and (max-height:760px){
  .sb{padding:16px 16px 12px;gap:9px}.sb .clock{font-size:clamp(52px,5vw,66px)}.sb .wxc{padding:10px 12px}.sb .wxc .wx-hrs{padding:4px 0}
  .hside .hgrid{gap:10px}.hside .hgrid .rc{padding:12px 14px}.hside .ri{width:38px;height:38px}.hside .pw{width:44px;height:44px}
}
@media (max-width:1000px) and (min-width:721px){.hside .hgrid{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:720px){
  .hside{grid-template-columns:1fr;gap:18px;margin-bottom:0}.sb{position:static;height:auto}  .hside .hgrid{grid-template-columns:repeat(2,minmax(0,1fr))}.hside .hgrid .rc,.hside.has-sc .hgrid .rc{min-height:150px}
}
/* security:green when all is secure */
.secst{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 16px 0 12px;border-radius:999px;font-weight:600;font-size:15px}
.secst ha-icon{--mdc-icon-size:22px}
.secst.ok{background:rgba(48,209,88,.18);color:#5fe08a}.secst.bad{background:rgba(255,159,10,.2);color:#ffb340}
.tile.secok.glass .ic{background:#30d158;color:#06210f}
/* climate card with direct control:ring, modes and − / + */
.tile.clx{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:center;gap:18px;--clx-trk:rgba(255,255,255,.12);--clx-off:rgba(255,255,255,.3)}
.tile.clx.on{--clx-trk:rgba(42,34,31,.12)}
.clx-ring{position:relative;width:clamp(96px,10vw,128px);aspect-ratio:1;flex:none}
.clx-ring svg{width:100%;height:100%;transform:rotate(135deg);overflow:visible}
.clx-ring circle{fill:none;stroke-width:7;stroke-linecap:round;transition:stroke-dasharray .3s}
.clx-ring circle.trk{stroke:var(--clx-trk)}
.clx-t{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;grid-template-columns:auto auto;align-content:center}
.clx-t b{font-family:var(--display);font-weight:300;font-size:clamp(34px,3.4vw,44px);line-height:1;font-variant-numeric:tabular-nums}
.clx-t sup{font-size:18px;align-self:start;margin-top:2px}
.clx-t small{grid-column:1/-1;font-size:12px;color:var(--muted);margin-top:2px}
.clx-t.rng b{font-size:22px}.clx-t.long b{font-size:clamp(26px,2.6vw,34px)}
.clx-r{min-width:0;display:flex;flex-direction:column;gap:10px}
.clx-r .nm{margin:0;font-size:19px;-webkit-line-clamp:1}.clx-r .st{margin:-8px 0 0}
.clx-seg{display:flex;padding:3px;border-radius:999px;background:rgba(255,255,255,min(var(--glass-max),calc(.1 * var(--glass-k) + var(--glass-b))))}
.tile.clx.on .clx-seg{background:rgba(var(--deep-rgb, 42,34,31),min(var(--deep-max),calc(.08 + var(--deep-add))))}
.clx-seg button{all:unset;cursor:pointer;flex:1;text-align:center;height:34px;line-height:34px;border-radius:999px;font-size:14px;font-weight:600;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px}
.tile.clx.on .clx-seg button{color:var(--ink-soft)}
.clx-seg button.act{background:#fff;color:var(--ink)}
.tile.clx.on .clx-seg button.act{background:var(--ink);color:var(--cream)}
.clx-pm{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.clx-pm button{all:unset;cursor:pointer;height:38px;border-radius:999px;display:grid;place-items:center;font-size:22px;background:rgba(255,255,255,min(var(--glass-max),calc(.12 * var(--glass-k) + var(--glass-b))))}
.tile.clx.on .clx-pm button{background:rgba(var(--deep-rgb, 42,34,31),min(var(--deep-max),calc(.1 + var(--deep-add))));color:var(--ink)}
.clx-pm button:active,.clx-seg button:active{transform:scale(.96)}
.tiles.clim{grid-template-columns:repeat(auto-fill,minmax(400px,1fr))}.tiles.clim .tile.clx{grid-column:auto;min-height:170px}
.as-list .tile.clx{grid-column:span 1}
@media (min-width:721px) and (max-height:760px){.clx-r{gap:7px}.clx-seg button{height:30px;line-height:30px;font-size:13px}.clx-pm button{height:32px}.tile.clx{gap:14px}}
@media (max-width:720px){.tiles.clim{grid-template-columns:1fr}.tile.clx{grid-column:1/-1}}
/* forecast sheet:now, chips and warnings; hours as small cards and days with a range bar */
.fnow{display:flex;align-items:center;gap:14px;margin-top:6px}
.fnow>ha-icon{--mdc-icon-size:54px;color:var(--amber)}
.fnow>b{font-family:var(--display);font-weight:300;font-size:64px;line-height:1}
.fnow span{display:block;font-size:20px;font-weight:600}.fnow small{display:block;font-size:15px;color:var(--muted);margin-top:2px}
.fcst .wx-chips{margin-top:14px}.fcst .wx-chips span{font-size:14px;padding:7px 12px}
.fcst .sh-main .sub{margin-top:18px}
.fsrc{margin-top:18px;font-size:13px;color:var(--muted)}
.fcst .fh{width:72px;padding:12px 4px;border-radius:18px}
.fcst .fh ha-icon{--mdc-icon-size:24px}
.fcst .fd small{text-align:right}.fcst .fd>span{font-weight:600}
.frng{position:relative;height:6px;border-radius:999px;background:rgba(255,255,255,min(var(--glass-max),calc(.1 * var(--glass-k) + var(--glass-b))))}
.frng i{position:absolute;top:0;bottom:0;border-radius:999px}
.frng .fdot{width:10px;height:10px;top:-2px;margin-left:-5px;background:#fff;border:2px solid rgba(0,0,0,.35);box-sizing:border-box}
.fcst .fd b{text-align:left}
`;
