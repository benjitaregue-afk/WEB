/* Brainwave canvas animation */
(function(){
  const canvas = document.getElementById('brainwaveCanvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  function resize(){ canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight }
  resize();
  window.addEventListener('resize', resize);
  let t = 0;
  function draw(){
    const { width:w, height:h } = canvas;
    ctx.clearRect(0,0,w,h);
    // Background radial glow
    const grd = ctx.createRadialGradient(w*0.5, h*0.55, 20, w*0.5, h*0.5, Math.max(w,h)*0.7);
    grd.addColorStop(0, 'rgba(124,92,255,0.12)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,w,h);

    // Multiple layered sine waves
    const layers = [
      { amp: 18, freq: 0.012, speed: 0.9, color: 'rgba(124,92,255,0.8)' },
      { amp: 26, freq: 0.009, speed: 0.7, color: 'rgba(0,224,255,0.8)' },
      { amp: 12, freq: 0.018, speed: 1.1, color: 'rgba(255,255,255,0.4)' },
    ];
    layers.forEach((L, idx)=>{
      ctx.beginPath();
      for(let x=0; x<=w; x+=2){
        const y = h*0.55 + Math.sin(x*L.freq + t*L.speed) * L.amp * (1 + 0.3*Math.sin(t*0.4+idx));
        if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.strokeStyle = L.color;
      ctx.lineWidth = 2;
      ctx.shadowColor = L.color;
      ctx.shadowBlur = 12;
      ctx.stroke();
    });
    ctx.shadowBlur = 0;
    t += 0.02;
    requestAnimationFrame(draw);
  }
  draw();
})();

/* Utility: map value to 0..100 */
function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function map(v, inMin, inMax, outMin, outMax){ return (v-inMin)*(outMax-outMin)/(inMax-inMin)+outMin; }

/* Metric simulation */
const el = (id)=>document.getElementById(id);
let timer = null;

function getLevel(metric, value){
  switch(metric){
    case 'hr': // bpm
      if(value < 75) return 'green';
      if(value < 95) return 'yellow';
      return 'red';
    case 'gsr': // microSiemens
      if(value < 3.5) return 'green';
      if(value < 6.0) return 'yellow';
      return 'red';
    case 'temp': // Celsius (lower might indicate stress vasoconstriction)
      if(value >= 34.5) return 'green';
      if(value >= 33.8) return 'yellow';
      return 'red';
  }
}

function setBadge(elm, level){
  elm.classList.remove('green','yellow','red');
  elm.classList.add(level);
  elm.textContent = level;
}

function updateMetric(idPrefix, value, min, max){
  const valueEl = el(idPrefix+'Value');
  const barEl = el(idPrefix+'Bar');
  const badgeEl = el(idPrefix+'Badge');
  valueEl.textContent = value.toFixed(idPrefix==='temp'?1:0);
  const pct = clamp(map(value, min, max, 0, 100), 0, 100);
  barEl.style.width = pct + '%';
  const lvl = getLevel(idPrefix, value);
  setBadge(badgeEl, lvl);
}

function randomAround(base, jitter){
  return base + (Math.random()*2-1)*jitter;
}

function start(){
  if(timer) return;
  el('startBtn').disabled = true;
  el('stopBtn').disabled = false;
  el('startBtn').setAttribute('aria-pressed','true');
  timer = setInterval(()=>{
    const hr = clamp(randomAround(82, 16), 55, 125); // bpm
    const gsr = clamp(randomAround(4.2, 2.3), 0.8, 9.5); // µS
    const temp = clamp(randomAround(34.1, 0.9), 32.0, 36.2); // °C
    updateMetric('hr', hr, 55, 125);
    updateMetric('gsr', gsr, 0.8, 9.5);
    updateMetric('temp', temp, 32.0, 36.2);
  }, 1000);
}

function stop(){
  if(timer){
    clearInterval(timer); timer = null;
  }
  el('startBtn').disabled = false;
  el('stopBtn').disabled = true;
  el('startBtn').setAttribute('aria-pressed','false');
}

function showTip(){
  const tips = [
    'Try 4-4-6 breathing: inhale 4s, hold 4s, exhale 6s × 6 rounds.',
    'Progressive relax: tense a muscle group 5s, release 10s, move head-to-toe.',
    'Grounding 5-4-3-2-1: name 5 things you see, 4 you feel, 3 you hear, 2 you smell, 1 you taste.',
    'Box breathing: in 4s, hold 4s, out 4s, hold 4s; repeat 1–2 minutes.',
    'Soften the gaze and lengthen exhales; aim for 6 breaths per minute.'
  ];
  const t = tips[Math.floor(Math.random()*tips.length)];
  el('tipArea').textContent = t;
}

/* Chart: results */
let resultsChart;
function initChart(){
  const ctx = document.getElementById('resultsChart');
  if(!ctx) return;
  const labels = Array.from({length:60}, (_,i)=> (i+1)+"s");
  const baseStress = Array.from({length:60}, (_,i)=> clamp(70 - i*0.2 + (Math.random()*8-4), 30, 75));
  const calm = baseStress.map(v=> 100 - v);
  resultsChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label:'Stress', data: baseStress, borderColor:'#e74c3c', backgroundColor:'rgba(231,76,60,.15)', tension:.25, fill:true },
        { label:'Calm', data: calm, borderColor:'#2ecc71', backgroundColor:'rgba(46,204,113,.15)', tension:.25, fill:true },
      ]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      scales:{ y:{ min:0, max:100, grid:{ color:'rgba(255,255,255,.08)'}}, x:{ grid:{ color:'rgba(255,255,255,.05)'} } },
      plugins:{ legend:{ labels:{ color:'#eaf0ff' } }, tooltip:{ mode:'index', intersect:false } }
    }
  });
}

function runSession(){
  if(!resultsChart) return;
  // Simulate improvement: stress trends down, calm up
  const stress = resultsChart.data.datasets[0].data;
  const calm = resultsChart.data.datasets[1].data;
  for(let i=0;i<stress.length;i++){
    const s = clamp(78 - i*0.8 + (Math.random()*6-3), 12, 85);
    stress[i] = s;
    calm[i] = clamp(100 - s + (Math.random()*2-1)*2, 15, 95);
  }
  resultsChart.update();
}

/* Wire up */
document.addEventListener('DOMContentLoaded', ()=>{
  el('startBtn')?.addEventListener('click', start);
  el('stopBtn')?.addEventListener('click', stop);
  el('calmTipBtn')?.addEventListener('click', showTip);
  el('runSessionBtn')?.addEventListener('click', runSession);
  initChart();
  // Camera emotion prototype
  setupCameraEmotionPrototype();
});

/* Camera-based emotion detection (prototype) */
let camStream = null;
let detectLoopId = null;
async function setupCameraEmotionPrototype(){
  const startBtn = el('startCamBtn');
  const stopBtn = el('stopCamBtn');
  const video = el('camVideo');
  const badge = el('emotionBadge');
  const tip = el('emotionTip');
  if(!startBtn || !stopBtn || !video || !badge) return;
  // If page is not secure and not localhost, camera access will be blocked by browsers.
  const insecureOrigin = (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1' && location.protocol !== 'file:');
  if(insecureOrigin){
    // Provide clearer guidance and helpers instead of failing silently
    badge.textContent = 'insecure';
    tip.innerHTML = `Acceso a la cámara bloqueado: abre la página en <strong>localhost</strong> o usa HTTPS.<br>
      - Ejecuta el servidor local (p. ej. <code>start-server.ps1</code>) y abre <code>http://localhost:8080</code> en este equipo.<br>
      - O usa un túnel HTTPS (ngrok) para exponer la URL segura.<br>
      <button id="nm-copy-local" class="btn">Copiar localhost</button>`;
    startBtn.disabled = true;
    // wire copy button (may not be present in all browsers)
    setTimeout(()=>{
      const copy = document.getElementById('nm-copy-local');
      if(copy){
        copy.addEventListener('click', async ()=>{
          try{
            await navigator.clipboard.writeText('http://localhost:8080');
            copy.textContent = 'Copiado';
            setTimeout(()=>copy.textContent = 'Copiar localhost', 2000);
          }catch(e){
            copy.textContent = 'No disponible';
          }
        });
      }
    }, 50);
    return;
  }

  const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/models';
  try{
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
    ]);
  }catch(err){
    badge.textContent = 'models failed';
    tip.textContent = 'Could not load models. Check network access.';
    return;
  }

  startBtn.addEventListener('click', async ()=>{
    try{
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      video.srcObject = camStream;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      badge.textContent = 'detecting...';
      runDetectionLoop(video, badge, tip);
    }catch(err){
      badge.textContent = 'camera blocked';
      // Provide more specific guidance depending on error
      if(err && err.name === 'NotAllowedError'){
        tip.textContent = 'Permiso denegado. Revisa los permisos del navegador y vuelve a cargar la página.';
      }else if(err && err.name === 'NotFoundError'){
        tip.textContent = 'Cámara no encontrada. Asegúrate de que una cámara esté conectada y no esté siendo usada por otra aplicación.';
      }else{
        tip.textContent = 'No se pudo acceder a la cámara. Usa HTTPS o localhost; revisa permisos y dispositivos.';
      }
      console.warn('getUserMedia error:', err);
    }
  });

  // Diagnostic: quick probe and device listing
  const testBtn = el('testCamBtn');
  if(testBtn){
    testBtn.addEventListener('click', async ()=>{
      try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d=>d.kind==='videoinput');
        if(cams.length===0){
          tip.textContent = 'No se detectaron cámaras. Conecta una cámara y actualiza.';
          return;
        }
        tip.textContent = `Cámaras detectadas: ${cams.map(c=>c.label||c.deviceId).join(', ')}`;
        // Try a short permission probe
        try{
          const s = await navigator.mediaDevices.getUserMedia({ video:true });
          s.getTracks().forEach(t=>t.stop());
          tip.textContent += ' — Permiso concedido (prueba OK). Ahora pulsa Iniciar cámara.';
        }catch(probeErr){
          if(probeErr && probeErr.name === 'NotAllowedError'){
            tip.textContent += ' — Permiso denegado. Revisa los permisos del navegador.';
          }else{
            tip.textContent += ' — No se pudo acceder (ver consola para detalles).';
            console.warn('camera probe error', probeErr);
          }
        }
      }catch(err){
        tip.textContent = 'Error al leer dispositivos: revisa permisos del navegador.';
        console.warn(err);
      }
    });
  }

  stopBtn.addEventListener('click', ()=>{
    if(detectLoopId) cancelAnimationFrame(detectLoopId);
    detectLoopId = null;
    if(camStream){ camStream.getTracks().forEach(t=>t.stop()); camStream = null; }
    video.srcObject = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    badge.textContent = 'camera off';
    tip.textContent = '';
  });
}

function mapExpressionToLevel(expr){
  // Rough arousal mapping for prototype
  switch(expr){
    case 'angry':
    case 'fearful':
    case 'surprised':
      return 'red';
    case 'sad':
    case 'disgusted':
      return 'yellow';
    case 'happy':
    case 'neutral':
    default:
      return 'green';
  }
}

function setEmotionBadge(badge, level, label){
  badge.classList.remove('green','yellow','red');
  badge.classList.add(level);
  badge.textContent = label;
}

async function runDetectionLoop(video, badge, tip){
  const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 256, scoreThreshold: 0.5 });
  const detect = async ()=>{
    try{
      const result = await faceapi.detectSingleFace(video, options).withFaceExpressions();
      if(result && result.expressions){
        const entries = Object.entries(result.expressions);
        entries.sort((a,b)=> b[1]-a[1]);
        const [topLabel, confidence] = entries[0];
        const level = mapExpressionToLevel(topLabel);
        setEmotionBadge(badge, level, `${topLabel} ${(confidence*100).toFixed(0)}%`);
        tip.textContent = recommendationForEmotion(topLabel);
      }else{
        setEmotionBadge(badge, 'yellow', 'no face');
        tip.textContent = 'Ensure your face is centered and well lit.';
      }
    }catch(err){
      setEmotionBadge(badge, 'yellow', 'detecting...');
    }
    detectLoopId = requestAnimationFrame(detect);
  };
  detect();
}

function recommendationForEmotion(expr){
  switch(expr){
    case 'angry': return 'Try box breathing: in 4s, hold 4s, out 4s, hold 4s × 1–2 min.';
    case 'fearful': return 'Grounding 5-4-3-2-1 can reduce anxiety signals.';
    case 'surprised': return 'Slow breathing can stabilize arousal.';
    case 'sad': return 'Take a brief walk and do 3 cycles of 4-6 breathing.';
    case 'disgusted': return 'Progressive muscle relaxation for 1–2 minutes.';
    case 'happy': return 'Maintain slow nasal breathing and posture awareness.';
    case 'neutral': return 'Scan body tension and release shoulders and jaw.';
    default: return '';
  }
}
