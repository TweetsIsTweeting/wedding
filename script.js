/* ==========================================================================
   張式豪 ・ 簡暄穎 歸寧宴電子喜帖 — 互動
   1  七寶紋:canvas 織錦底,滑鼠/觸控經過時亮起,閒置後自動漂移
   2  囍印:按下蓋章並撒出銀杏葉
   3  落葉:背景緩慢飄落的銀杏
   4  倒數:自動計算距離宴客日的天數
   5  捲動淡入:IntersectionObserver
   以上皆尊重 prefers-reduced-motion。
   ========================================================================== */

var CORNER = '<svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round">'
  + '<path d="M3 46C3 22 22 3 46 3"/><path d="M10 46C10 30 30 10 46 10"/>'
  + '<path d="M17 46C17 34 34 17 46 17" opacity=".55"/>'
  + '<path d="M13 30c7-2 12 2 12 8M30 13c-2 7 2 12 8 12"/><path d="M20 22c4 0 7 3 7 7" opacity=".7"/>'
  + '<g transform="translate(24 24) scale(.19) translate(-50 -62)">'
  + '<path d="M50 88C40 78 24 70 12 56Q24 34 46 32L50 44L54 32Q76 34 88 56C76 70 60 78 50 88Z" stroke-width="6"/>'
  + '<path d="M50 88v12" stroke-width="6"/></g>'
  + '<circle cx="11" cy="55" r="1.9" fill="currentColor" stroke="none"/>'
  + '<circle cx="55" cy="11" r="1.9" fill="currentColor" stroke="none"/>'
  + '<circle cx="7" cy="62" r="1.2" fill="currentColor" stroke="none" opacity=".7"/>'
  + '<circle cx="62" cy="7" r="1.2" fill="currentColor" stroke="none" opacity=".7"/></svg>';
var LEAF = '<svg viewBox="6 26 88 82" fill="none" xmlns="http://www.w3.org/2000/svg">'
  + '<path d="M50 88C40 78 24 70 12 56Q24 34 46 32L50 44L54 32Q76 34 88 56C76 70 60 78 50 88Z"'
  + ' stroke="currentColor" stroke-width="3.4" stroke-linejoin="round"/>'
  + '<path d="M50 88v12" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>';

document.querySelectorAll('.corner').forEach(function(el){ el.innerHTML = CORNER; });
document.querySelectorAll('.orn .lf').forEach(function(el){ el.innerHTML = LEAF; });


// ── 七寶紋:底層織錦 + 光掃過的互動 ──
(function(){
  var cv = document.getElementById('shippou');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var JEWEL = ['#C8352B','#1F6B5E','#6B4C8A','#2E8B9E','#D9A03C','#2E7D4F','#D9705B','#C9A227'];
  var S = 34, R = S / Math.SQRT2, D = 132;   // 格距、半徑、感光範圍
  var W = 0, H = 0, dpr = 1;

  function hash(i, j){ var h = (i * 73856093) ^ (j * 19349663); return Math.abs(h); }

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // 掃過的光點:沒有輸入時自己緩慢漂移
  var px = -999, py = -999, idle = 0, t = 0, drifting = true;

  function draw(){
    ctx.clearRect(0, 0, W, H);
    var cols = Math.ceil(W / S) + 2, rows = Math.ceil(H / S) + 2;

    for (var j = -1; j < rows; j++){
      for (var i = -1; i < cols; i++){
        var cx = i * S, cy = j * S;
        var h = hash(i, j);
        var col = JEWEL[h % JEWEL.length];

        // 靜態織錦:少數格子帶淡淡的寶石色
        var base = (h % 13 === 0) ? 0.038 : 0;

        // 互動:靠近光點的格子亮起來
        var lit = 0;
        if (px > -900){
          var dx = cx - px, dy = cy - py;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < D){ var f = 1 - d / D; lit = f * f; }
        }

        var a = base + lit * 0.13;
        if (a > 0.004){
          ctx.beginPath();
          ctx.arc(cx, cy, R, 0, Math.PI * 2);
          ctx.fillStyle = col;
          ctx.globalAlpha = a;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.strokeStyle = '#C9A227';
        ctx.globalAlpha = 0.13 + lit * 0.42;
        ctx.lineWidth = 0.6 + lit * 0.5;
        ctx.stroke();

        // 交點上的小金珠
        if (lit > 0.12){
          ctx.beginPath();
          ctx.arc(cx, cy, 1.3, 0, Math.PI * 2);
          ctx.fillStyle = '#C9A227';
          ctx.globalAlpha = lit * 0.55;
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(){
    t += 0.006;
    idle++;
    if (idle > 150) drifting = true;          // 閒置約 2.5 秒後自動漂移
    if (drifting){
      px = W * (0.5 + 0.42 * Math.sin(t * 0.9));
      py = H * (0.5 + 0.34 * Math.sin(t * 1.37 + 1.1));
    }
    draw();
    requestAnimationFrame(frame);
  }

  function point(x, y){ px = x; py = y; idle = 0; drifting = false; }

  window.addEventListener('resize', function(){ resize(); if (reduce) draw(); });
  window.addEventListener('pointermove', function(e){ point(e.clientX, e.clientY); }, {passive:true});
  window.addEventListener('touchmove', function(e){
    var tt = e.touches[0]; if (tt) point(tt.clientX, tt.clientY);
  }, {passive:true});

  resize();
  if (reduce){ px = -999; draw(); } else { frame(); }
})();

// ── 囍印:按一下蓋章,撒出銀杏葉 ──
(function(){
  var seal = document.getElementById('seal');
  if (!seal) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var TINTS = ['#C8352B','#D9A03C','#1F6B5E','#6B4C8A','#D9705B','#C9A227'];

  seal.addEventListener('click', function(){
    seal.classList.remove('stamped');
    void seal.offsetWidth;
    seal.classList.add('stamped');
    if (reduce) return;

    var r = seal.getBoundingClientRect();
    var ox = r.left + r.width / 2, oy = r.top + r.height / 2;

    for (var i = 0; i < 14; i++){
      (function(){
        var el = document.createElement('div');
        var size = 11 + Math.random() * 11;
        el.className = 'burst';
        el.style.width = size + 'px';
        el.style.height = size + 'px';
        el.style.left = (ox - size / 2) + 'px';
        el.style.top  = (oy - size / 2) + 'px';
        el.style.color = TINTS[Math.floor(Math.random() * TINTS.length)];
        el.innerHTML = '<svg viewBox="0 0 100 100"><use href="#leaf-solid" xlink:href="#leaf-solid"/></svg>';
        document.body.appendChild(el);

        var ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        var dist = 60 + Math.random() * 110;
        var tx = Math.cos(ang) * dist;
        var ty = Math.sin(ang) * dist;
        var spin = (Math.random() - 0.5) * 720;

        el.animate([
          { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
          { transform: 'translate(' + tx.toFixed(1) + 'px,' + (ty * 0.55).toFixed(1) + 'px) rotate(' + (spin/2).toFixed(0) + 'deg)', opacity: 1, offset: 0.42 },
          { transform: 'translate(' + (tx * 1.15).toFixed(1) + 'px,' + (ty + 190).toFixed(1) + 'px) rotate(' + spin.toFixed(0) + 'deg)', opacity: 0 }
        ], { duration: 1500 + Math.random() * 900, easing: 'cubic-bezier(.25,.6,.4,1)' })
          .onfinish = function(){ el.remove(); };
      })();
    }
  });
})();


// 落葉
(function(){
  var host = document.getElementById('leaves');
  if (!host || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var tints = ['#C8352B','#D9A03C','#C4632F','#8E8A4A','#D9705B','#1F6B5E'];
  var n = window.innerWidth < 600 ? 10 : 16;
  for (var i = 0; i < n; i++) {
    var size = 13 + Math.random() * 12;
    var el = document.createElement('div');
    el.className = 'leaf';
    el.style.left = (Math.random() * 100).toFixed(2) + '%';
    el.style.width = size.toFixed(1) + 'px';
    el.style.height = size.toFixed(1) + 'px';
    el.style.color = tints[Math.floor(Math.random() * tints.length)];
    el.style.animationDuration = (15 + Math.random() * 13).toFixed(1) + 's';
    el.style.animationDelay = (-Math.random() * 26).toFixed(1) + 's';
    el.innerHTML = '<svg viewBox="0 0 100 100"><use href="#leaf-solid" xlink:href="#leaf-solid"/></svg>';
    host.appendChild(el);
  }
})();

// 倒數
(function(){
  var target = new Date('2026-11-22T11:30:00+08:00');
  var diff = Math.ceil((target - new Date()) / 86400000);
  var num = document.getElementById('days'), label = document.getElementById('daysLabel');
  if (!num || !label) return;
  if (diff > 1)      { num.textContent = diff; label.textContent = '還 有 ' + diff + ' 天'; }
  else if (diff === 1){ num.textContent = '1';  label.textContent = '就 是 明 天'; }
  else if (diff === 0){ num.textContent = '今日'; num.style.fontSize='2.2rem'; label.textContent = '我 們 在 玫 瑰 廳 等 你'; }
  else                { num.textContent = '謝謝'; num.style.fontSize='2.2rem'; label.textContent = '感 謝 有 你 同 在'; }
})();

// 捲動淡入
(function(){
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { items.forEach(function(el){ el.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  items.forEach(function(el){ io.observe(el); });
})();
