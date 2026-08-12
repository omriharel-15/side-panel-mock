/* =====================================================================
   New Side Panel — interactive mock on Mosaic/TIP foundations.
   Visual ground truth: TIP design-system tokens + ido-management-ui
   canvas SCSS (see README). Behaviors: side-panel-handshake-draft.md.
   Render/interaction logic + state. Journey data, panel field models, and
   content libraries live in data.js, loaded before this file.
   ===================================================================== */

/* ---------- per-step UI state ---------- */
const stepState = {};
function S(id){
  if(!stepState[id]) stepState[id] = { mode:'view', touched:new Set(), collapsed:{}, advOpen:{}, viewOpen:{}, hidden:false, committed:true };
  return stepState[id];
}
let currentStep = null;
let hoveredStep = null;
let previewOpen = false, previewDevice = 'desktop';
let savedOnce = false, publishedFlash = false, dirty = false, publishedFlashTimer = null;
/* Publish is not just "errors === 0" — it's gated behind an explicit Save
   click that happens to find zero errors. `savedValid` is that gate: it
   only turns true inside onSaveClick, and any edit (markDirty) turns it
   back off immediately, so editing after a publish — even editing that
   doesn't reintroduce an error — demotes the button back to Save until the
   user explicitly saves again. */
let savedValid = false;
let zoom = 1, panX = 40, panY = 120;

/* ---------- helpers ---------- */
const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
function toast(msg, type='info'){
  const t=$('#toast');
  const icons={
    success:'<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#00B37D"/><path d="M4.5 8.5l2.5 2 4-5" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    warn:'<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#F59E0B"/><path d="M8 5.5v4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.5" r=".8" fill="#fff"/></svg>',
    error:'<svg viewBox="0 0 16 16" fill="none"><path d="M7.13 1.8 1.08 12.5A1 1 0 002 14h12a1 1 0 00.87-1.5L8.87 1.8a1 1 0 00-1.74 0z" fill="#EF4444"/><path d="M8 6v4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="11.5" r=".8" fill="#fff"/></svg>',
    info:'<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#4597FF"/><path d="M8 7.5v4" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="5" r=".8" fill="#fff"/></svg>',
  };
  const xSvg='<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l10 10M11 1L1 11"/></svg>';
  t.innerHTML=`<span class="toast-icon">${icons[type]||icons.info}</span><span class="toast-body">${msg}</span><button class="toast-close" onclick="clearTimeout(this.closest('.toast')._h);this.closest('.toast').classList.remove('show')">${xSvg}</button>`;
  t.className='toast show';
  clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove('show'), type==='warn'?2600:2000);
}
const BARE_REF = /^[A-Za-z_$][\w$]*(\.[A-Za-z_$][\w$]*)+$/;
/* Fields default to expression mode when the pre-filled value already reads
   as a variable reference or an object/array literal — everything else
   (a plain sentence, an empty required field) defaults to plain string mode.
   Mode is cached on the field object itself so it stays stable across renders
   and survives the user toggling it by hand. */
function fieldExprMode(f){
  if(f.kind!=='expr') return null;
  if(f.mode==null){
    const v=String(f.value??'').trim();
    f.mode=(BARE_REF.test(v)||/^[{[]/.test(v))?'expr':'string';
  }
  return f.mode;
}
function toggleExprMode(key){
  const f=findField(currentStep,key); if(!f) return;
  f.mode=f.mode==='expr'?'string':'expr';
  markDirty();
  renderAfterEdit();
}
/* `dirty` only tracks whether the journey has EVER been touched (drives the
   idle/pale Save styling before the first edit — but only when there are also
   zero outstanding errors; a journey that ships with pre-existing errors must
   never look idle/inert, since there's genuinely something to fix). Validation
   must recompute
   on every single edit, not just the first — otherwise editing a journey
   back into a broken state after a Publish never re-surfaces, which is
   exactly the "Publish is enabled and that's that" bug. Any edit also cancels
   a still-showing "Published ✓" flash — that flash is not allowed to outlive
   a change that might have just broken the journey again. */
/* Deep-enough clone of a PANELS template for a new node instance.
   Uses object spread so function references (validate) are preserved. */
function clonePanelTemplate(key){
  const tpl=PANELS[key];
  if(!tpl) return null;
  return {
    blocks: tpl.blocks.map(b=>({
      ...b,
      fields: b.fields ? b.fields.map(f=>({...f})) : undefined,
      steppers: b.steppers ? b.steppers.map(s=>({...s})) : undefined,
      methods: b.methods ? b.methods.map(m=>({...m})) : undefined,
    }))
  };
}
function markDirty(){
  dirty=true;
  savedValid=false;
  if(publishedFlash){
    publishedFlash=false;
    clearTimeout(publishedFlashTimer);
  }
  refreshSaveArea();
}

function fieldsOf(nodeId){
  const model = PANELS[nodeId]; if(!model) return [];
  const out=[];
  model.blocks.forEach(block=>{
    (block.fields||[]).forEach(f=>{ if(f.kind==='stepper-row'){ f.steppers.forEach(st=>out.push({group:block.group,f:st})); } else out.push({group:block.group,f}); });
  });
  return out;
}
function fieldErrors(nodeId){
  const errs=[];
  fieldsOf(nodeId).forEach(({group,f})=>{
    if(f.validate){ const m=f.validate(String(f.value??'')); if(m) errs.push({nodeId,key:f.k,label:f.label,group,message:m}); }
  });
  const cb=CUSTOM_BRANCHES[nodeId];
  if(cb) cb.items.forEach((b,i)=>{
    if(!b.display.trim()) errs.push({nodeId,key:'cb-display-'+i,label:'Branch display name',group:'Outcomes',message:'This field is required'});
  });
  // A branch that routes nowhere isn't a real, publishable journey — matches
  // the real product's requirement that every branch terminate somewhere
  // (another step, Complete, Reject) before publish is allowed. Branching
  // folded into Outcomes (side-panel-redesign-epic §1.5) — failure/cancel
  // and every other branch are all just "Outcomes" now, no separate group.
  (NODES[nodeId].branches||[]).forEach(b=>{
    const wired=EDGES.some(e=>e.from[0]===nodeId && e.from[1]===b.id);
    if(!wired) errs.push({nodeId,key:'branch-conn-'+b.id,label:b.label,group:'Outcomes',message:'Not connected to a next step yet'});
  });
  return errs;
}
function allErrors(){ return Object.keys(NODES).flatMap(fieldErrors); }
function configErrors(){ return allErrors().filter(e=>!e.key.startsWith('branch-conn-')); }
function updateErrTag(){
  const errors=configErrors();
  const pill=$('#issuesPill'), pillCount=$('#issuesPillCount');
  if(pill && pillCount){
    if(errors.length>0){
      pill.classList.add('visible');
      pillCount.textContent=`${errors.length} issue${errors.length!==1?'s':''}`;
    } else {
      pillCount.textContent='';
      pill.classList.remove('visible');
      closeErrMenu(); // auto-close only when all errors resolved
    }
  }
  const menu=$('#errMenu');
  if(menu && menu.style.display!=='none') renderErrMenu(); // refresh in-place while open
}

function renderErrMenu(){
  const menu=$('#errMenu');
  if(!menu) return;
  const errors=configErrors();
  const warnSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
  const xSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  const chevSvg2='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>';
  const items=errors.map(e=>{
    const n=NODES[e.nodeId];
    return `<div class="err-menu-item" onclick="event.stopPropagation();jumpToField('${e.nodeId}','${e.key}')">
      <span class="err-menu-item-body">
        <div class="err-menu-item-step">${n.title}</div>
        <div class="err-menu-item-err">${e.label} — ${e.message}</div>
      </span>
      <span class="err-menu-chev">${chevSvg2}</span>
    </div>`;
  }).join('');
  menu.innerHTML=`
    <div class="err-menu-header">
      <span class="err-menu-header-icon">${warnSvg}</span>
      <span class="err-menu-header-title">${errors.length} issue${errors.length!==1?'s':''} blocking publish</span>
      <button class="err-menu-close" onclick="event.stopPropagation();closeErrMenu()">${xSvg}</button>
    </div>
    <div class="err-menu-list">${items}</div>`;
}

function repositionErrMenu(){
  const menu=$('#errMenu'), anchor=$('#issuesPill');
  if(!menu||!anchor||menu.style.display==='none') return;
  const r=anchor.getBoundingClientRect();
  menu.style.top=(r.bottom+8)+'px';
  menu.style.left=(r.right-menu.offsetWidth)+'px';
}

function openErrMenu(e){
  if(e) e.stopPropagation();
  const menu=$('#errMenu');
  const anchor=$('#issuesPill');
  if(!menu||!anchor) return;
  renderErrMenu();
  menu.style.display='block';
  const r=anchor.getBoundingClientRect();
  requestAnimationFrame(()=>{
    menu.style.top=(r.bottom+8)+'px';
    menu.style.left=(r.right-menu.offsetWidth)+'px';
  });
}

function closeErrMenu(){
  const menu=$('#errMenu');
  if(menu) menu.style.display='none';
}

/* =====================================================================
   Canvas
   ===================================================================== */
function renderCanvas(){
  const root=$('#nodesRoot');
  const sp=startNodePos();
  let html=`
    <div class="startnode" style="left:${sp.x}px;top:${sp.y}px">
      <div class="start-circle">${I.play}</div><div class="start-label">Start</div>
    </div>`;
  Object.values(NODES).forEach(n=>{
    const st=S(n.id); const cat=CAT[n.cat];
    const sel=n.id===currentStep?' selected':'';
    // prod: error state paints the accent red (unless hovered/selected — CSS wins there)
    const configErrors=S(n.id).committed ? fieldErrors(n.id).filter(e=>!e.key.startsWith('branch-conn-')) : [];
    const hasErrors=configErrors.length>0;
    const accent=hasErrors?'var(--error)':cat.color;
    const iconTint=hasErrors?'var(--error)':cat.color;

    const branchRows=n.branches.map(b=>{
      const mark=b.type==='success'?I.check:b.type==='failure'?I.x:'';
      return `
      <div class="branchline ${b.type}" data-port="${n.id}:${b.id}">
        <span class="bmark">${mark}</span>${esc(b.label)}
        <span class="drag-dots">${I.dots}</span>
        <span class="port"></span>
      </div>`;
    }).join('');
    html+=`
    <div class="nodewrap" id="wrap-${n.id}" data-node="${n.id}" style="left:${n.x}px;top:${n.y}px;--node-color:${accent};--icon-color:${iconTint}">
      <div class="quicktools">
        <button class="qbtn" onclick="event.stopPropagation();openPanel('${n.id}','view')">${I.eye}View</button>
        <button class="qbtn" onclick="event.stopPropagation();openPanel('${n.id}','edit')">${I.pencil}Edit</button>
        <button class="qbtn" title="Duplicate" onclick="event.stopPropagation();toast('Duplicate step')">${I.clone}</button>
        <button class="qbtn" title="Delete" onclick="event.stopPropagation();deleteStep('${n.id}')">${I.trash}</button>
      </div>
      <div class="stepnode${sel}" id="node-${n.id}">

        <div class="node-head">
          <span class="node-title-group">
            <span class="node-title">${esc(n.title)}</span>
            ${hasErrors?`<span class="errchip">${configErrors.length}</span>`:''}
          </span>
          <span class="node-icons">
            <span class="cat-icon" title="${cat.label}">${cat.icon}</span>
            <button class="vis-toggle${st.hidden?' hidden-step':''}" title="${st.hidden?'Step hidden from client view — click to show':'Hide step from client view'}" onclick="event.stopPropagation();toggleVisibility('${n.id}')">${st.hidden?I.eye:I.eyeOff}</button>
            <button class="kebab" title="More" onclick="event.stopPropagation();toggleKebab('${n.id}')">⋮</button>
          </span>
        </div>
        ${branchRows}
        <div class="node-desc">${esc(n.desc)}</div>
        <div class="kebabmenu" id="kebab-${n.id}">
          <button onclick="toast('Opens step documentation')">${I.docs}View docs</button>
          <button onclick="toast('Pinned to the top of the step library')">${I.pin}Pin step</button>
          <button class="danger" onclick="toast('Breakpoint set — journey debugger will pause here')">${I.dot}Set breakpoint</button>
        </div>
      </div>
    </div>`;
  });
  PILLS.forEach(p=>{
    if(p.kind==='goto'){
      html+=`<div class="pill goto" id="pill-${p.id}" style="left:${p.x}px;top:${p.y}px">${I.ret}${esc(p.label)}</div>`;
    } else if(p.kind==='complete'){
      html+=`<div class="pill complete" id="pill-${p.id}" style="left:${p.x}px;top:${p.y}px">
        <span class="badge-circle">${I.check}</span><span>${esc(p.label)}<div class="pill-sub">${esc(p.sub)}</div></span></div>`;
    }
  });
  root.innerHTML=html;
  updateErrTag();
  root.querySelectorAll('.branchline[data-port]').forEach(rowEl=>{
    const portEl=rowEl.querySelector('.port');
    const [nid,bid]=rowEl.dataset.port.split(':');
    portEl.addEventListener('mousedown',(e)=>startWireDrag(e,nid,bid));
  });
  Object.values(NODES).forEach(n=>{
    const el=document.getElementById('node-'+n.id);
    el.addEventListener('mousedown',(e)=>startNodePress(e,n.id));
    const wrap=document.getElementById('wrap-'+n.id);
    wrap.addEventListener('mouseenter',()=>{ hoveredStep=n.id; drawEdges(); });
    wrap.addEventListener('mouseleave',()=>{ if(hoveredStep===n.id){ hoveredStep=null; drawEdges(); } });
  });
  positionGroupFrame();
  requestAnimationFrame(()=>{ drawEdges(); renderDanglingAdders(); });
  refreshSaveArea();
}

/* Branches with no outgoing edge — used both to block Save/Publish
   (allErrors(), via fieldErrors' branch-conn check) and to render a small
   convenience "+" right at that exact branch's port. */
function danglingBranches(){
  const out=[];
  Object.values(NODES).forEach(n=>{
    n.branches.forEach(b=>{
      const wired=EDGES.some(e=>e.from[0]===n.id && e.from[1]===b.id);
      if(!wired) out.push({nodeId:n.id, branchId:b.id});
    });
  });
  return out;
}
function renderDanglingAdders(){
  const layer=$('#danglingAdders');
  if(!layer) return;
  // Offset from the port itself (not centered on it) — otherwise the "+"
  // sits directly on top of the draggable port and always wins the
  // mousedown, making drag-to-wire unreachable for any dangling branch.
  layer.innerHTML = danglingBranches().map(d=>{
    const p=portPoint([d.nodeId,d.branchId]);
    if(!p) return '';
    return `<button class="dangling-adder" style="left:${p.x+16}px;top:${p.y}px" title="Connect this branch to a new step"
      onclick="event.stopPropagation();openAddStep('${d.nodeId}','${d.branchId}')">+</button>`;
  }).join('');
}

function startNodePos(){ return {x:60, y:NODES['get-info'].y+40}; }
function positionGroupFrame(){
  // Bounds must include the Start node and every PILLS entry (Complete,
  // goto) — not just NODES — or they render outside the frame (the "weird
  // border" bug). Neither is draggable, but they're still part of the
  // diagram's visual extent.
  const sp=startNodePos();
  const xs=[...Object.values(NODES).map(n=>n.x), sp.x, ...PILLS.map(p=>p.x)];
  const ys=[...Object.values(NODES).map(n=>n.y), sp.y, ...PILLS.map(p=>p.y)];
  const gf=$('#groupframe');
  const minX=Math.min(...xs)-56, minY=Math.min(...ys)-70;
  const maxX=Math.max(...xs)+300, maxY=Math.max(...ys)+220;
  gf.style.left=minX+'px'; gf.style.top=minY+'px';
  gf.style.width=(maxX-minX)+'px'; gf.style.height=(maxY-minY)+'px';
}

function portPoint(ref){
  const world=$('#world').getBoundingClientRect();
  if(ref[0]==='start'){
    const el=document.querySelector('.start-circle').getBoundingClientRect();
    return {x:(el.right-world.left)/zoom, y:(el.top+el.height/2-world.top)/zoom};
  }
  const [nid,port]=ref;
  const rowEl=document.querySelector(`[data-port="${nid}:${port}"]`);
  const el=(rowEl||document.getElementById('node-'+nid));
  if(!el) return null;
  const r=el.getBoundingClientRect();
  return {x:(r.right-world.left)/zoom+6, y:(r.top+r.height/2-world.top)/zoom};
}
function targetPoint(to){
  const world=$('#world').getBoundingClientRect();
  const el=to.startsWith('pill:')?document.getElementById('pill-'+to.slice(5)):document.getElementById('node-'+to);
  if(!el) return null;
  const r=el.getBoundingClientRect();
  return {x:(r.left-world.left)/zoom, y:(r.top+r.height/2-world.top)/zoom};
}

/* Edge coloring — prod connection.component.ts logic:
   default grey #999999 @1px; when the edge's source/target node is hovered
   or selected → link color (success green / failure red / else blue) @2px. */
function edgeStyle(e){
  const srcNode=e.from[0], branchId=e.from[1];
  const tgt=e.to.startsWith('pill:')?null:e.to;
  const active=[currentStep,hoveredStep].some(s=>s&&(s===srcNode||s===tgt));
  if(!active) return {color:'#999999', width:1};
  const node=NODES[srcNode];
  const type=node?(node.branches.find(b=>b.id===branchId)||{}).type:'plain';
  return {color:LINK_COLORS[type]||LINK_COLORS.plain, width:2};
}
function drawEdges(){
  const svg=$('#edges');
  const colors=new Set();
  const paths=[];
  EDGES.forEach(e=>{
    const a=portPoint(e.from), b=targetPoint(e.to);
    if(!a||!b) return;
    const {color,width}=edgeStyle(e);
    colors.add(color);
    const mx=(a.x+b.x)/2;
    paths.push(`<path d="M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x-7} ${b.y}" stroke="${color}" stroke-width="${width}" fill="none" marker-end="url(#arrow-${color.slice(1)})"/>`);
  });
  const markers=[...colors].map(c=>
    `<marker id="arrow-${c.slice(1)}" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L7,4 L0,8 Z" fill="${c}"/></marker>`
  ).join('');
  let tempPath='';
  if(wireDrag){
    const a=portPoint([wireDrag.fromId,wireDrag.branchId]);
    if(a){
      const mx=(a.x+wireDrag.x)/2;
      tempPath=`<path d="M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${wireDrag.y}, ${wireDrag.x} ${wireDrag.y}" stroke="#6981FF" stroke-width="2" fill="none" stroke-dasharray="4 3"/>`;
    }
  }
  svg.innerHTML=`<defs>${markers}</defs>`+paths.join('')+tempPath;
}

/* ---------- pan / zoom / drag ---------- */
function applyTransform(){
  $('#panzone').style.transform=`translate(${panX}px,${panY}px)`;
  $('#world').style.transform=`scale(${zoom})`;
  $('#zoomRange').value=Math.round(zoom*100);
  requestAnimationFrame(drawEdges);
}
function stepZoom(d){ zoom=Math.min(1.5,Math.max(0.5,+(zoom+d).toFixed(2))); applyTransform(); }
function setZoomPct(v){ zoom=v/100; applyTransform(); }
function resetView(){ zoom=1; panX=40; panY=120; applyTransform(); }

let panDrag=null,nodePress=null,wireDrag=null,wireDropEl=null;
$('#panzone').addEventListener('mousedown',(e)=>{
  if(e.target.closest('.nodewrap,.pill,.dangling-adder,.startnode')) return;
  panDrag={sx:e.clientX,sy:e.clientY,ox:panX,oy:panY,moved:false};
  $('#panzone').classList.add('dragging');
});
function startNodePress(e,id){
  if(e.target.closest('button,input,select,textarea,.quicktools,.kebabmenu,.port')) return;
  e.stopPropagation();
  nodePress={id,sx:e.clientX,sy:e.clientY,ox:NODES[id].x,oy:NODES[id].y,dragging:false};
}
/* Dragging a wire from a branch's output port onto any node or the Complete
   pill (re)connects that exact branch — replacing whatever edge it had, so
   the same gesture both wires a dangling branch and reorders an existing
   one. Deliberately separate from nodePress/panDrag so a port mousedown
   never also starts a node-drag or pan. */
function startWireDrag(e,fromId,branchId){
  e.stopPropagation();
  e.preventDefault();
  const world=$('#world').getBoundingClientRect();
  wireDrag={fromId,branchId,x:(e.clientX-world.left)/zoom,y:(e.clientY-world.top)/zoom};
  document.body.classList.add('wiring');
  drawEdges();
}
function resolveWireDropElement(clientX,clientY){
  const el=document.elementFromPoint(clientX,clientY);
  if(!el) return null;
  const nodeEl=el.closest('.nodewrap');
  if(nodeEl){
    const nid=nodeEl.dataset.node;
    if(!wireDrag||nid===wireDrag.fromId) return null; // no self-loops
    return {ref:nid, el:nodeEl};
  }
  const pillEl=el.closest('.pill.complete,.pill.goto');
  if(pillEl) return {ref:'pill:'+pillEl.id.slice(5), el:pillEl};
  return null;
}
function setWireDropHighlight(clientX,clientY){
  const hit=resolveWireDropElement(clientX,clientY);
  const el=hit?hit.el:null;
  if(wireDropEl&&wireDropEl!==el) wireDropEl.classList.remove('drop-target');
  if(el) el.classList.add('drop-target');
  wireDropEl=el;
}
window.addEventListener('mousemove',(e)=>{
  if(panDrag){
    if(Math.abs(e.clientX-panDrag.sx)+Math.abs(e.clientY-panDrag.sy)>2) panDrag.moved=true;
    panX=panDrag.ox+(e.clientX-panDrag.sx); panY=panDrag.oy+(e.clientY-panDrag.sy); applyTransform();
  }
  if(nodePress){
    const dx=e.clientX-nodePress.sx, dy=e.clientY-nodePress.sy;
    if(!nodePress.dragging && Math.abs(dx)+Math.abs(dy)>5) nodePress.dragging=true;
    if(nodePress.dragging){
      const n=NODES[nodePress.id];
      n.x=nodePress.ox+dx/zoom; n.y=nodePress.oy+dy/zoom;
      const w=document.getElementById('wrap-'+nodePress.id);
      w.style.left=n.x+'px'; w.style.top=n.y+'px';
      positionGroupFrame();
      drawEdges();
    }
  }
  if(wireDrag){
    const world=$('#world').getBoundingClientRect();
    wireDrag.x=(e.clientX-world.left)/zoom; wireDrag.y=(e.clientY-world.top)/zoom;
    setWireDropHighlight(e.clientX,e.clientY);
    drawEdges();
  }
});
window.addEventListener('mouseup',(e)=>{
  if(nodePress&&!nodePress.dragging) openPanel(nodePress.id, null);
  else if(nodePress&&nodePress.dragging) markDirty();
  if(panDrag&&!panDrag.moved&&!e.target.closest('.nodewrap,.pill,.dangling-adder,.canvas-head,.zoomctrl,.startnode')) closePanel();
  if(wireDrag){
    const hit=resolveWireDropElement(e.clientX,e.clientY);
    if(hit){
      for(let i=EDGES.length-1;i>=0;i--){
        const ed=EDGES[i];
        if(ed.from[0]===wireDrag.fromId && ed.from[1]===wireDrag.branchId) EDGES.splice(i,1);
      }
      EDGES.push({from:[wireDrag.fromId,wireDrag.branchId], to:hit.ref});
      markDirty();
    }
    if(wireDropEl) wireDropEl.classList.remove('drop-target');
    wireDropEl=null;
    document.body.classList.remove('wiring');
    wireDrag=null;
    renderCanvas();
  }
  panDrag=null; nodePress=null;
  $('#panzone').classList.remove('dragging');
});
document.addEventListener('click',(e)=>{
  if(!e.target.closest('.kebab,.kebabmenu')) document.querySelectorAll('.kebabmenu').forEach(m=>m.classList.remove('show'));
  // err-menu stays open until all errors fixed or user clicks X — no outside-click close
});
function toggleKebab(id){
  document.querySelectorAll('.kebabmenu').forEach(m=>{ if(m.id!=='kebab-'+id) m.classList.remove('show'); });
  document.getElementById('kebab-'+id).classList.toggle('show');
}
function toggleVisibility(id){
  S(id).hidden=!S(id).hidden;
  const anyHidden=Object.keys(NODES).some(k=>S(k).hidden);
  $('#visChip').textContent=anyHidden?'Custom':'All';
  markDirty();
  renderCanvas();
}
function deleteStep(id){
  delete NODES[id];
  delete stepState[id];
  for(let i=EDGES.length-1;i>=0;i--){
    const e=EDGES[i];
    if(e.from[0]===id || e.to===id) EDGES.splice(i,1);
  }
  if(currentStep===id) closePanel();
  if(hoveredStep===id) hoveredStep=null;
  markDirty();
  renderCanvas();
  toast('Step deleted','success');
}

/* =====================================================================
   Side panel
   ===================================================================== */
function openPanel(id, mode){
  // If switching to a different step while in edit mode, drop back to view
  if(currentStep && currentStep!==id && S(currentStep).mode==='edit'){
    S(currentStep).mode='view';
  }
  // Commit the previous step (so its errors become visible)
  if(currentStep && currentStep!==id) S(currentStep).committed=true;
  currentStep=id;
  if(mode){ S(id).mode=mode; if(mode==='edit') noteEnteredEditMode(); }
  else if(!mode && S(id).mode==='edit'){ S(id).mode='view'; }
  previewOpen=false;
  $('#sidepanel').classList.remove('closed');
  renderPanel(); renderCanvas();
  setTimeout(repositionErrMenu, 220);
}
function closePanel(){
  if(!currentStep) return;
  S(currentStep).committed=true;
  currentStep=null; previewOpen=false;
  $('#sidepanel').classList.add('closed');
  renderCanvas();
  setTimeout(repositionErrMenu, 220);
}
function setMode(m){ if(m==='view') S(currentStep).committed=true; S(currentStep).mode=m; if(m==='edit') noteEnteredEditMode(); previewOpen=false; renderPanel(); }
/* Re-entering Edit mode after a clean Publish must force a fresh Save before
   Publish is reachable again — you might change something, and even if you
   don't, "Publish" should mean "this exact state was just verified," not
   "this state was verified at some earlier point before you went back in."
   Only demotes savedValid/publishedFlash — never touches any field's
   touched-state, so per-field red/neutral styling is unaffected. A no-op if
   Publish wasn't showing (e.g. still mid-edit, or errors already present). */
function noteEnteredEditMode(){
  if(!savedValid && !publishedFlash) return;
  savedValid=false;
  if(publishedFlash){ publishedFlash=false; clearTimeout(publishedFlashTimer); }
  dirty=true;
  refreshSaveArea();
}
function setDepthNoop(){}
function togglePreview(){ previewOpen=!previewOpen; renderPanel(); }
function setPreviewDevice(d){ previewDevice=d; renderPanel(); }

function renderPanel(focusKey){
  if(!currentStep) return;
  const n=NODES[currentStep], st=S(currentStep);
  // Title & Description are directly editable in the header in both View and
  // Edit mode — merged in per review of Neta's branch, which builds them
  // this way instead of the earlier View-mode-only decision (side-panel-
  // redesign-epic §1.5 will need updating to match; flagged separately).
  const titleWrap=$('#spTitleWrap'), subEl=$('#spSub');
  titleWrap.innerHTML=`
    <div class="sp-title-edit-row">
      <input class="sp-title-input" id="spTitleInput" value="${esc(n.title)}" placeholder="${esc(n.baseTitle||n.title)}"
        oninput="onTitleOverride(this.value)">
      ${I.pencil}
    </div>`;
  subEl.innerHTML=`
    <div class="sp-title-edit-row">
      <textarea class="sp-desc-input" id="spDescInput" rows="1" placeholder="Add a description…"
        oninput="S(currentStep).descOverride=this.value;markDirty();autoGrowExpr(this)" onblur="renderAfterEdit()">${esc(st.descOverride||'')}</textarea>
      ${I.pencil}
    </div>`;
  // Header controls: mode btn only
  const modeBtn=$('#spModeBtn');
  const footer=$('#spFooter');
  if(st.mode==='edit'){
    modeBtn.style.display='none';
    // Cancel drops back to View without closing the panel; Done closes it
    // outright — two distinct exits, not one button doing both.
    if(footer) footer.innerHTML=`<button class="sp-cancel-btn" onclick="setMode('view')">Cancel</button><button class="sp-done-btn" onclick="closePanel()">Done</button>`;
  } else {
    modeBtn.style.display='';
    modeBtn.className='sp-mode-btn mode-edit';
    modeBtn.innerHTML=I.pencil+' Edit';
    modeBtn.onclick=()=>setMode('edit');
    if(footer) footer.innerHTML='';
  }
  const body=$('#spBody');
  body.innerHTML = st.mode==='view' ? renderViewMode(n) : renderEditMode(n,st);
  // size every expression textarea to its current content on render (typing
  // triggers this too, via autoGrowExpr in the oninput handler) — otherwise
  // a pre-filled long expression would show clipped at 32px until touched.
  body.querySelectorAll('.expr-value').forEach(autoGrowExpr);
  const descInput=$('#spDescInput'); if(descInput) autoGrowExpr(descInput);
  if(focusKey){
    const el=body.querySelector(`[data-field="${focusKey}"]`);
    if(el){ el.classList.add('flash'); el.scrollIntoView({behavior:'smooth',block:'center'}); const inp=el.querySelector('input,select,textarea'); inp&&inp.focus(); }
  }
}
function autoGrowExpr(el){
  el.style.height='auto';
  el.style.height=Math.min(el.scrollHeight,150)+'px';
}

/* ---------- Edit mode (product section cards) ---------- */
function groupErrCount(nodeId, group){
  return fieldErrors(nodeId).filter(e=>!e.key.startsWith('branch-conn-') && e.group===group).length;
}
/* Basic/Advanced split, decided at block granularity (side-panel-redesign-
   epic §1.5): a block is Basic if any of its fields is required, or if it's
   flagged basic:true (composite blocks — methods, branches, summaries — are
   basic by default since they're core to configuring the step, not optional
   tuning), or basic:false to force it into Advanced regardless. Everything
   else collapses behind the Advanced disclosure — unless the section has no
   Basic content at all, in which case there's no Advanced disclosure either
   (see renderEditMode below). */
function blockIsBasic(block){
  if(block.basic===true) return true;
  if(block.basic===false) return false;
  if(block.kind==='methods'||block.kind==='branches'||block.kind==='summary') return true;
  return (block.fields||[]).some(f=>f.required===true);
}
function blockHasError(nodeId, block){
  const errs=fieldErrors(nodeId);
  if(block.kind==='branches') return errs.some(e=>e.key.startsWith('cb-display-'));
  return (block.fields||[]).some(f=>{
    const key=f.kind==='stepper-row' ? null : f.k;
    return key && errs.some(e=>e.key===key);
  });
}
/* How many actual inputs a section holds, for the "one field = not
   collapsible" rule below — steppers count individually (three real
   inputs), branches/summary/methods count as one meaningful unit each. */
function countSectionFields(blocks){
  let n=0;
  blocks.forEach(block=>{
    if(block.kind==='methods') n+=block.methods.length;
    else if(block.kind==='branches'||block.kind==='summary') n+=1;
    else (block.fields||[]).forEach(f=>{ n += f.kind==='stepper-row' ? f.steppers.length : 1; });
  });
  return n;
}
function renderEditMode(n, st){
  const callout = !st.committed
    ? `<div class="new-step-callout"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="12" height="12" aria-hidden="true" style="flex-shrink:0;fill:#4597ff"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zm-32 224a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg><span>New step — configure required fields</span></div>`
    : '';
  const model=PANELS[n.id];
  const blocksByGroup=new Map(FIELD_GROUP_ORDER.map(g=>[g,[]]));
  (model?.blocks||[]).forEach(b=>{ blocksByGroup.get(b.group).push(b); });
  const sections=FIELD_GROUP_ORDER.map(group=>{
    const blocks=blocksByGroup.get(group);
    if(blocks.length===0) return '';
    const basicBlocks=blocks.filter(blockIsBasic);
    const advBlocks=blocks.filter(b=>!blockIsBasic(b));
    let body=basicBlocks.map(b=>renderBlock(n,st,b)).join('');
    if(advBlocks.length){
      if(basicBlocks.length===0){
        // No Basic content at all — there's nothing for an "Advanced" toggle
        // to sit below, so it doesn't get one. Render every field flat and
        // uncollapsed instead (supersedes the earlier "default Advanced open"
        // fix, which still looked like a broken empty card with a toggle).
        body+=advBlocks.map(b=>renderBlock(n,st,b)).join('');
      } else {
        const advHasErr=advBlocks.some(b=>blockHasError(n.id,b));
        if(advHasErr) st.advOpen[group]=true;
        const open = st.advOpen[group] ?? false;
        body+=`<div class="adv-toggle ${open?'open':''}" onclick="toggleAdvanced('${group}')">
            <span class="chev">${I.chevUp}</span> Advanced
          </div>
          <div class="adv-body ${open?'open':''}">${advBlocks.map(b=>renderBlock(n,st,b)).join('')}</div>`;
      }
    }
    // A section holding exactly one field has nothing meaningful to hide —
    // collapsing it just adds a click for no reason.
    const collapsible = countSectionFields(blocks) > 1;
    return sectionShell(group, groupErrCount(n.id,group), body, collapsible && st.collapsed[group], collapsible);
  }).join('');
  return callout + sections;
}
function toggleAdvanced(group){
  const st=S(currentStep); st.advOpen[group]=!st.advOpen[group]; renderPanel();
}
function sectionShell(group, errs, body, collapsed, collapsible=true){
  // A single-field section has nothing to hide — render its header as static
  // chrome (no chevron, no click target) instead of a collapse toggle.
  const head = collapsible
    ? `<button class="section-head" onclick="toggleSection('${group}')">
        <span class="sh-left">
          <span class="chev">${I.chevUp}</span>
          <span class="title">${esc(group)}</span>
        </span>
      </button>`
    : `<div class="section-head static">
        <span class="sh-left">
          <span class="title">${esc(group)}</span>
        </span>
      </div>`;
  return `<div class="section ${collapsed?'collapsed':''}" data-section="${group}">
    ${head}
    <div class="section-body">${body}</div>
  </div>`;
}
function renderBlock(n, st, block){
  if(block.kind==='methods'){
    return block.methods.map(m=>`
      <div class="method-row"><span class="mr-left">${m.label==='Passkeys'?I.passkey:m.label==='Report Step Data'?I.docs:I.card}${esc(m.label)}</span>
        <button class="toggle ${m.on?'on':''}" role="switch" aria-checked="${m.on}" aria-label="${esc(m.label)}"
          onclick="toggleMethod('${m.k}')"></button>
      </div>`).join('');
  }
  if(block.kind==='summary'){
    return `<div class="field"><label>${esc(block.label)}</label>
      <div class="field-hint" style="font-size:12px;color:var(--black)">${esc(block.value)}</div></div>`;
  }
  if(block.kind==='branches'){
    const cb=CUSTOM_BRANCHES[n.id]||{outputVar:'',items:[]};
    return `
      <div class="field"><label>Branch Output Variable</label>
        <input class="tsinput" placeholder="Store info about an escape option triggered in the action"
          value="${esc(cb.outputVar)}" oninput="CUSTOM_BRANCHES['${n.id}'].outputVar=this.value;markDirty()"></div>
      ${cb.items.map((b,i)=>{
        const err=!b.display.trim();
        const touched=st.touched.has('cb-display-'+i)||st.committed;
        return `
        <div class="branchcard">
          <div class="bc-toprow"><span class="bc-label">Branch ID</span>
            <span style="display:flex;gap:12px;align-items:center">
              <button class="schema-link" onclick="openSchemaModal()">${I.code} Schema editor</button>
              ${cb.items.length>1?`<button class="bc-delete" title="Delete branch" onclick="removeBranch('${n.id}',${i})">${I.trash}</button>`:''}
            </span>
          </div>
          <input class="tsinput" value="${esc(b.id)}" oninput="onBranchId('${n.id}',${i},this.value)">
          <div class="field ${(err&&touched)?'invalid':''}" data-field="cb-display-${i}">
            <label>Display name <span class="lbl-req">*</span></label>
            <input class="tsinput" placeholder="What the end user sees for this branch" value="${esc(b.display)}"
              oninput="onBranchDisplay('${n.id}',${i},this.value)" onblur="renderAfterEdit()">
            ${(err&&touched)?`<div class="field-err">This field is required</div>`:''}
          </div>
        </div>`;
      }).join('')}
      <button class="add-branch" onclick="addBranch('${n.id}')">+ Add branch</button>`;
  }
  let body=(block.fields||[]).map(f=>renderField(n,st,f)).join('');
  if(block.schemaLink) body+=`<button class="schema-link" onclick="openSchemaModal()">${I.code} Schema editor</button>`;
  return body;
}
function renderField(n, st, f){
  if(f.kind==='stepper-row'){
    return `<div class="stepper-row">${f.steppers.map(s=>`
      <div class="stepper"><div class="field"><label>${esc(s.label)}${s.labelNote?` <span class="lbl-note">${esc(s.labelNote)}</span>`:''}</label>
        <div class="stp-box">
          <input value="${s.value}" inputmode="numeric" data-stepper="${s.k}" oninput="onStepperInput('${s.k}',this.value)">
          <div class="stp-btns">
            <button title="Increase" onclick="bumpStepper('${s.k}',1)">▲</button>
            <button title="Decrease" onclick="bumpStepper('${s.k}',-1)">▼</button>
          </div>
        </div></div></div>`).join('')}</div>`;
  }
  const err=f.validate?f.validate(String(f.value??'')):null;
  const touched=st.touched.has(f.k);
  const showErr=!!err && (st.committed || touched);
  const label=`<label>${esc(f.label)}${f.labelNote?` <span class="lbl-note">${esc(f.labelNote)}</span>`:''}${f.required?` <span class="lbl-req">*</span>`:''}</label>`;
  const hintHtml=showErr?`<div class="field-err">${esc(err)}</div>`
    :f.hint?`<div class="field-hint">${esc(f.hint)}</div>`:'';
  if(f.kind==='expr'){
    // A plain <input> can never wrap text or accept Enter as a newline —
    // both are required for "long expressions stay readable". <textarea>
    // with JS auto-grow (autoGrowExpr) gets both, up to the CSS max-height.
    // Every expr-capable field can be toggled between a plain string and a
    // real expression — the toggle button is always in the same place so
    // the field "looks the same" either way; only string-only fields (kind
    // 'text', e.g. output_var) skip this entirely and stay a bare input.
    const isExpr=fieldExprMode(f)==='expr';
    return `<div class="field ${showErr?'invalid':''}" data-field="${f.k}">${label}
      <div class="exprfield">
        <button type="button" class="expr-toggle ${isExpr?'active':''}"
          title="${isExpr?'Expression — click to switch to plain text':'Plain text — click to switch to an expression'}"
          onclick="toggleExprMode('${f.k}')">${I.code}</button>
        ${isExpr
          ? `<textarea class="expr-value" rows="1" placeholder="${esc(f.placeholder||'')}"
               oninput="onFieldInput('${f.k}',this.value);autoGrowExpr(this)" onblur="renderAfterEdit()">${esc(f.value)}</textarea>
             <button class="expr-edit" title="Open expression editor" onclick="openExprModal('${f.k}','${esc(f.label)}')">${I.sparkle}<span>Edit</span></button>`
          : `<input class="expr-value-str" value="${esc(f.value)}" placeholder="${esc(f.placeholder||'')}"
               oninput="onFieldInput('${f.k}',this.value)" onblur="renderAfterEdit()">`}
      </div>${hintHtml}</div>`;
  }
  if(f.kind==='select'){
    return `<div class="field" data-field="${f.k}">${label}
      <select class="tsselect" onchange="onFieldInput('${f.k}',this.value);toast('Saved','success')">
        ${f.options.map(o=>`<option ${o===f.value?'selected':''}>${esc(o)}</option>`).join('')}
      </select>${hintHtml}</div>`;
  }
  if(f.kind==='ec'){
    const options=EC_OPTIONS[f.ecType]||[];
    return `<div class="field ${showErr?'invalid':''}" data-field="${f.k}">${label}
      <div class="ec-row">
        <select class="tsselect" onchange="onFieldInput('${f.k}',this.value);renderAfterEdit()">
          <option value="" ${!f.value?'selected':''} disabled>Select a connection…</option>
          ${options.map(o=>`<option value="${esc(o.id)}" ${o.id===f.value?'selected':''} ${o.enabled?'':'disabled'}>${esc(o.name)}${o.enabled?'':' (disabled)'}</option>`).join('')}
        </select>
        <button class="ec-create-btn" type="button" onclick="openEcModal('${n.id}','${f.k}','${f.ecType}')">+ Create new</button>
      </div>
      ${hintHtml}</div>`;
  }
  return `<div class="field ${showErr?'invalid':''}" data-field="${f.k}">${label}
    <input class="tsinput" value="${esc(f.value)}" placeholder="${esc(f.placeholder||'')}"
      oninput="onFieldInput('${f.k}',this.value)" onblur="renderAfterEdit()">
    ${hintHtml}</div>`;
}

/* field plumbing */
function findField(nodeId,key){
  for(const {f} of fieldsOf(nodeId)) if(f.k===key) return f;
  return null;
}
function findMethod(nodeId,key){
  const model=PANELS[nodeId]; if(!model) return null;
  for(const b of model.blocks){ if(b.kind==='methods'){ const m=b.methods.find(x=>x.k===key); if(m) return m; } }
  return null;
}
function toggleMethod(key){
  const m=findMethod(currentStep,key); if(!m) return;
  m.on=!m.on;
  S(currentStep).touched.add(key);
  markDirty();
  toast(`${esc(m.label)} ${m.on?'enabled':'disabled'}`);
  renderAfterEdit();
}
function onFieldInput(key,value){
  const f=findField(currentStep,key); if(!f) return;
  f.value=value; S(currentStep).touched.add(key); markDirty();
}
function onStepperInput(key,value){
  const f=findField(currentStep,key); if(!f) return;
  const v=parseInt(value,10); if(!isNaN(v)) f.value=Math.min(f.max??99,Math.max(f.min??0,v));
  S(currentStep).touched.add(key); markDirty();
}
function bumpStepper(key,d){
  const f=findField(currentStep,key); if(!f) return;
  f.value=Math.min(f.max??99,Math.max(f.min??0,(parseInt(f.value,10)||0)+d));
  S(currentStep).touched.add(key); markDirty();
  const inp=document.querySelector(`[data-stepper="${key}"]`);
  if(inp) inp.value=f.value;
}
function onTitleOverride(v){
  const st=S(currentStep); st.titleOverride=v;
  const node=NODES[currentStep];
  if(!node.baseTitle) node.baseTitle=node.title;
  node.title=v.trim()||node.baseTitle;
  markDirty();
  const tEl=document.querySelector(`#node-${currentStep} .node-title`);
  if(tEl) tEl.textContent=node.title;
}
function renderAfterEdit(){ renderPanel(); renderCanvas(); }
function toggleSection(key){
  const st=S(currentStep); st.collapsed[key]=!st.collapsed[key]; renderPanel();
}
function addBranch(nodeId){
  const cb=CUSTOM_BRANCHES[nodeId]; if(!cb) return;
  const idx=cb.items.length+1;
  cb.items.push({id:'branch_'+idx, display:''});
  NODES[nodeId].branches.push({id:'branch_'+idx, label:'branch '+idx, type:'plain'});
  markDirty();
  renderAfterEdit();
}
function removeBranch(nodeId,i){
  const cb=CUSTOM_BRANCHES[nodeId];
  const removed=cb.items.splice(i,1)[0];
  NODES[nodeId].branches=NODES[nodeId].branches.filter(b=>b.id!==removed.id);
  markDirty();
  renderAfterEdit();
}
function onBranchId(nodeId,i,v){
  CUSTOM_BRANCHES[nodeId].items[i].id=v; markDirty();
}
function onBranchDisplay(nodeId,i,v){
  const cb=CUSTOM_BRANCHES[nodeId];
  cb.items[i].display=v;
  S(nodeId).touched.add('cb-display-'+i);
  markDirty();
  const branch=NODES[nodeId].branches.find(b=>b.id===cb.items[i].id);
  if(branch){ branch.label=v.trim()||branch.id; }
}

/* ---------- View mode ---------- */
/* ---------- View mode — six locked rules (side-panel-redesign-epic §1.2) ----------
   1. A section with a lot set defaults to collapsed, with the highest-priority
      value promoted inline.
   2. Required fields (and method toggles, which define the step's core
      behavior the same way) are always shown individually, never folded.
   3. Reporting is always shown, plainly, as On or Off.
   4. Output is always shown unless the step defines no output at all.
   5. Outcomes is always shown unless the step defines no branches/outcome fields.
   6. A validation error always forces its section open, overriding collapse.
   Supplementary: a non-required field only shows if its value differs from
   default — approximated here as "non-empty", since this mock has no
   separate default-value baseline to diff against. */
function renderViewMode(n){
  const model=PANELS[n.id];
  const st=S(n.id);
  // only field-config errors in view mode — disconnected-branch errors stay on the save button only
  const errs=fieldErrors(n.id).filter(e=>!e.key.startsWith('branch-conn-'));
  const errKeys=new Set(errs.map(e=>e.key));

  // Errors no longer surface as a per-section badge (per review of Neta's
  // branch) — instead a required field always carries a trailing asterisk on
  // its label, and if it's empty (the only error shape this mock has) the
  // value itself reads as red italic "Not set" text, right where the value
  // would otherwise be.
  const rowHtml=(l,v,ref,required)=>`<div class="viewrow"><span class="vl${required?' vl-required':''}">${esc(l)}</span><span class="vv">${
    v==='' ? '<span class="vv-notset">Not set</span>' : (ref?`<span class="refchip">${I.link}${esc(v)}</span>`:esc(v))
  }</span></div>`;
  // simple fields (kind 'expr'/'text'/'select'/'ec') for a given group, split by required-ness
  function fieldRows(group, wantRequired){
    const rows=[];
    (model?.blocks||[]).forEach(block=>{
      if(block.group!==group || block.kind==='methods'||block.kind==='branches'||block.kind==='summary') return;
      (block.fields||[]).forEach(f=>{
        if(f.kind==='stepper-row'){
          if(!wantRequired) f.steppers.forEach(s=>rows.push({l:s.label, v:String(s.value)}));
          return;
        }
        const isReq=f.required===true;
        if(isReq!==wantRequired) return;
        const v=String(f.value??'').trim();
        if(!isReq && !v) return; // non-required + unset = same as default, hide
        rows.push({ k:f.k, l:f.label, v, req:isReq, ref: !!v && fieldExprMode(f)==='expr' && BARE_REF.test(v) });
      });
    });
    return rows;
  }
  function methodRows(group){
    const rows=[];
    (model?.blocks||[]).forEach(block=>{
      if(block.group===group && block.kind==='methods') block.methods.forEach(m=>rows.push({l:m.label, v:m.on?'On':'Off'}));
    });
    return rows;
  }
  function card(title, body){
    return `<div class="viewgroup"><div class="viewgroup-title-row"><span class="viewgroup-title">${esc(title)}</span></div><div class="viewrows">${body}</div></div>`;
  }

  let html='';

  // ---- General: rules 1, 2, 6 ----
  {
    const always=[...methodRows('General'), ...fieldRows('General', true)]; // methods + required — never collapsed
    const rest=fieldRows('General', false);
    const hiddenErr=rest.some(r=>errKeys.has(r.k)); // future-proofing: if a non-required field ever gets a validate()
    if(hiddenErr) st.viewOpen['General']=true;
    let body=always.map(r=>rowHtml(r.l,r.v,r.ref,r.req)).join('');
    if(rest.length){
      if(rest.length<=3){
        body+=rest.map(r=>rowHtml(r.l,r.v,r.ref,r.req)).join('');
      } else {
        const open=!!st.viewOpen['General'];
        body+=`<div class="view-collapse-chip" onclick="toggleViewRest('General')">${rest.length} set — “${esc(rest[0].v)}” +${rest.length-1} <span class="chev ${open?'up':''}">${I.chevUp}</span></div>
          <div class="view-collapse-body ${open?'open':''}">${rest.map(r=>rowHtml(r.l,r.v,r.ref,r.req)).join('')}</div>`;
      }
    }
    if(always.length||rest.length) html+=card('General', body);
  }

  // ---- Outcomes: rule 5 — always shown unless there are no branches and no Outcomes fields ----
  {
    const outcomeFields=[...fieldRows('Outcomes', true), ...fieldRows('Outcomes', false)];
    if(n.branches.length || outcomeFields.length){
      let body = n.branches.length ? rowHtml('Branches', n.branches.map(b=>b.label).join(', ')) : '';
      body += outcomeFields.map(r=>rowHtml(r.l,r.v,r.ref,r.req)).join('');
      html+=card('Outcomes', body);
    }
  }

  // ---- Output: rule 4 — always shown if the step's model defines an Output block at all ----
  {
    const outputBlocks=(model?.blocks||[]).filter(b=>b.group==='Output');
    if(outputBlocks.length){
      const rows=[];
      outputBlocks.forEach(block=>(block.fields||[]).forEach(f=>{
        const v=String(f.value??'').trim();
        rows.push({l:f.label, v, req:f.required===true, ref: !!v && fieldExprMode(f)==='expr' && BARE_REF.test(v)});
      }));
      html+=card('Output', rows.map(r=>rowHtml(r.l,r.v,r.ref,r.req)).join(''));
    }
  }

  // ---- Reporting: rule 3 — always shown, plainly On/Off, never filtered by default ----
  {
    const reportOn=!!findMethod(n.id,'report_step_data')?.on;
    html+=card('Reporting', `<div class="viewrow"><span class="vl">Report Step Data</span><span class="vv"><span class="rep-pill ${reportOn?'on':'off'}">${reportOn?'On':'Off'}</span></span></div>`);
  }

  return html;
}
function toggleViewRest(key){
  S(currentStep).viewOpen[key]=!S(currentStep).viewOpen[key]; renderPanel();
}

/* ---------- Preview ---------- */
function previewContent(n){
  if(n.id==='login-form'||n.id==='get-info'){
    return `<div class="pv-h">Welcome back</div><div class="pv-sub">Choose how to sign in</div>
      <div class="pv-cta">Sign in with a passkey</div><div class="pv-or">or</div>
      <div class="pv-input">Username</div><div class="pv-input">Password</div>
      <div class="pv-cta ghost">Continue with password</div>`;
  }
  if(n.id==='passkeys-auth'){
    return `<div class="pv-h">Use your passkey</div>
      <div class="pv-passkey">${I.passkey}<div class="pv-sub">Follow your browser or device prompt to continue</div></div>
      <div class="pv-cta">Continue</div><div class="pv-link">Try another way</div>`;
  }
  if(n.id==='email-validation'){
    return `<div class="pv-h">Check your email</div><div class="pv-sub">We sent a 6-digit code to your inbox</div>
      <div class="pv-codes">${'<div class="pv-code">•</div>'.repeat(6)}</div>
      <div class="pv-cta">Verify</div><div class="pv-link">Resend code</div>`;
  }
  return `<div class="pv-h">${esc(n.title)}</div>
    <div class="pv-input">Username</div><div class="pv-input">Password</div><div class="pv-cta">Continue</div>`;
}
function renderPreview(n){
  return `<div class="pv-toggle">
      <button class="pv-dev ${previewDevice==='desktop'?'on':''}" onclick="setPreviewDevice('desktop')">Desktop</button>
      <button class="pv-dev ${previewDevice==='mobile'?'on':''}" onclick="setPreviewDevice('mobile')">Mobile</button>
    </div>
    <div class="pv-frame">
      <div class="pv-note">Rendered by the same sso-hosted preview surface the Login form editor uses — available on every user-facing step.</div>
      <div class="pv-screen ${previewDevice==='mobile'?'mobile':''}">${previewContent(n)}</div>
    </div>
    <button class="pv-exit" onclick="togglePreview()">Exit preview</button>`;
}

/* =====================================================================
   Save → readiness list → Publish
   ===================================================================== */
function onSaveClick(){
  const errors=configErrors();
  savedOnce=true;
  savedValid = errors.length===0;
  if(errors.length>0){
    toast(`Draft saved · ${errors.length} issue${errors.length!==1?'s':''} to fix before publishing`,'warn');
  } else {
    toast('Draft saved','success');
  }
  refreshSaveArea();
}
function onPublishClick(){
  const pub=$('#publishBtn');
  publishedFlash=true;
  if(pub){ pub.textContent='Published ✓'; pub.classList.add('published-flash'); }
  toast('Journey published','success');
  clearTimeout(publishedFlashTimer);
  publishedFlashTimer=setTimeout(()=>{
    publishedFlash=false;
    savedValid=false;
    if(pub){ pub.textContent='Publish'; pub.classList.remove('published-flash'); }
    refreshSaveArea();
  }, 2400);
}
function refreshSaveArea(){
  updateErrTag();
  const pub=$('#publishBtn'), tip=$('#pubTip');
  const enabled=savedValid&&!publishedFlash;
  if(pub) pub.disabled=!enabled;
  if(tip) tip.style.display=enabled?'none':'';
}
/* Clicking an error in the issues list jumps straight to that field —
   opens the step in Edit mode, force-opens whatever section/Advanced
   disclosure might be hiding it, then hands off to renderPanel's own
   scroll+flash+focus (via focusKey) rather than duplicating that logic. */
function jumpToField(nodeId, key){
  const err=fieldErrors(nodeId).find(e=>e.key===key);
  openPanel(nodeId,'edit');
  const st=S(nodeId);
  st.touched.add(key);
  if(err){ st.collapsed[err.group]=false; st.advOpen[err.group]=true; }
  renderCanvas();
  renderPanel(key);
}

let pendingAttach=null, asTab='all', asCat='Featured', nodeIdSeq=1;
/* Rendered rows reference their step data by index into this array rather
   than inlining JSON into an onclick attribute — a description containing
   an apostrophe (e.g. "Fetch a user's registered identifiers.") would break
   out of the attribute and throw a syntax error, silently corrupting the
   rest of the drawer's click handling. */
let asRenderedItems=[];
function openAddStep(fromId, branchId){
  pendingAttach = fromId ? {fromId, branchId} : null;
  asTab='all'; asCat='Featured';
  $('#addStepMask').classList.add('show');
  $('#addStep').classList.add('show');
  $('#asSearch').value='';
  renderAsCats(); renderAsSteps();
}
function closeAddStep(){
  $('#addStepMask').classList.remove('show');
  $('#addStep').classList.remove('show');
}
function setAsTab(t){
  asTab=t;
  $('#asTabAll').classList.toggle('on',t==='all');
  $('#asTabPinned').classList.toggle('on',t==='pinned');
  renderAsSteps();
}
function renderAsCats(){
  $('#asCats').innerHTML=AS_CATS.map(c=>`
    <button class="as-cat ${c.name===asCat?'on':''}" onclick="selectAsCat('${c.name}')">${c.icon}${c.name}</button>`).join('');
}
function selectAsCat(name){ asCat=name; renderAsCats(); renderAsSteps(); }
function stepRow(s, cat, index){
  const dep=s.deprecated?' deprecated':'';
  const handler=s.deprecated?'' :`data-step-index="${index}"`;
  return `<button class="as-stepitem${dep}" ${handler}>
    <span class="t">${esc(s.t)}</span><span class="d" style="display:block">${esc(s.d)}</span></button>`;
}
function renderAsSteps(){
  const q=($('#asSearch').value||'').toLowerCase();
  let items;
  if(q){
    items=[];
    Object.entries(STEP_LIBRARY).forEach(([cat,steps])=>{
      if(cat==='Featured') return; // avoid dupes in search
      steps.forEach(s=>{ if(s.t.toLowerCase().includes(q)) items.push({s,cat}); });
    });
  } else if(asTab==='pinned'){
    items=[];
    Object.entries(STEP_LIBRARY).forEach(([cat,steps])=>{
      if(cat==='Featured') return;
      steps.forEach(s=>{ if(PINNED.includes(s.t)) items.push({s,cat}); });
    });
  } else {
    items=(STEP_LIBRARY[asCat]||[]).map(s=>({s,cat:asCat}));
  }
  asRenderedItems=items;
  if(!items.length){
    $('#asSteps').innerHTML=`<div class="as-group-label">No steps match.</div>`;
    return;
  }
  // group label: for Featured, items carry their own group; otherwise category
  let html='', lastGroup='';
  items.forEach(({s,cat},i)=>{
    const group=(s.group||cat).toUpperCase();
    if(group!==lastGroup){ html+=`<div class="as-group-label">${esc(group)}</div>`; lastGroup=group; }
    html+=stepRow(s,cat,i);
  });
  $('#asSteps').innerHTML=html;
}
$('#asSteps').addEventListener('click',(e)=>{
  const row=e.target.closest('.as-stepitem[data-step-index]');
  if(!row) return;
  const {s,cat}=asRenderedItems[Number(row.dataset.stepIndex)];
  insertStep(s,cat);
});
function filterSteps(){ renderAsSteps(); }
function insertStep(s,cat){
  s={...s,cat};
  const newId='n'+(nodeIdSeq++);
  let x=520, y=640;
  if(pendingAttach && NODES[pendingAttach.fromId]){
    x=NODES[pendingAttach.fromId].x+340;
    y=NODES[pendingAttach.fromId].y+140;
  }
  NODES[newId]={id:newId,title:s.t,cat:s.userFacing?'user':'server',userFacing:!!s.userFacing,desc:s.d,x,y,
    branches:(s.branches||[]).map(t=>({id:t+'-'+newId,label:t==='success'?'Success':t==='failure'?'Failure':'Next',type:t}))};
  if(pendingAttach){
    // Wire from the exact branch the "+" was clicked on — not branches[0],
    // which was wrong for any node with more than one branch — and replace
    // rather than add, in case that branch was already (mis)wired.
    const branchId=pendingAttach.branchId || NODES[pendingAttach.fromId].branches[0]?.id;
    for(let i=EDGES.length-1;i>=0;i--){
      const ed=EDGES[i];
      if(ed.from[0]===pendingAttach.fromId && ed.from[1]===branchId) EDGES.splice(i,1);
    }
    EDGES.push({from:[pendingAttach.fromId, branchId], to:newId});
  }
  markDirty();
  closeAddStep();
  stepState[newId]={ mode:'edit', touched:new Set(), collapsed:{}, advOpen:{}, viewOpen:{}, hidden:false, committed:false };
  if(s.panelKey){ const clone=clonePanelTemplate(s.panelKey); if(clone) PANELS[newId]=clone; }
  renderCanvas();
  openPanel(newId,'edit');
}

/* =====================================================================
   Modals
   ===================================================================== */
let exprTargetKey=null;
function openExprModal(key,label){
  exprTargetKey=key;
  $('#exprTitle').textContent=label+' — expression';
  $('#exprText').value=String(findField(currentStep,key)?.value??'');
  $('#sparkAskIcon').innerHTML=I.sparkle;
  $('#sparkPrompt').value='';
  $('.spark-ask-submit').innerHTML=I.arrowRight;
  $('.expr-copy-btn').innerHTML=I.clone;
  $('.spark-thinking-icon').innerHTML=I.sparkle;
  $('#sparkThinking').classList.remove('show');
  clearTimeout(sparkTimeout); sparkBusy=false;
  $('#sparkPrompt').disabled=false;
  renderSparkSuggestions();
  updateExprGutter();
  $('#exprOverlay').classList.add('show');
}
function closeExprModal(){
  clearTimeout(sparkTimeout); sparkBusy=false;
  $('#exprOverlay').classList.remove('show');
}
function saveExprModal(){
  const f=findField(currentStep,exprTargetKey);
  if(f){ f.value=$('#exprText').value.trim(); S(currentStep).touched.add(exprTargetKey); markDirty(); }
  closeExprModal(); renderAfterEdit();
}
function updateExprGutter(){
  const ta=$('#exprText');
  const lines=(ta.value.match(/\n/g)||[]).length+1;
  let html='';
  for(let i=1;i<=lines;i++) html+=`<div>${i}</div>`;
  $('#exprGutter').innerHTML=html;
  $('#exprGutter').scrollTop=ta.scrollTop;
}
function copyExprCode(){
  const text=$('#exprText').value;
  if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(text).catch(()=>{});
  toast('Copied','success');
}
function openFiddleStub(){ toast('Opens the Expression Fiddle in the real product — not wired in this mock.'); }
function openDocsStub(){ toast('Opens the AuthScript docs in the real product — not wired in this mock.'); }

let sparkBusy=false, sparkTimeout=null, currentSparkSuggestions=[];
function sparkSuggestionsFor(nodeId,fieldKey){
  const matched=[], rest=[];
  SPARK_LIBRARY.forEach(s=>{
    (s.match && s.match.node===nodeId && s.match.field===fieldKey ? matched : rest).push(s);
  });
  return matched.concat(rest);
}
function renderSparkSuggestions(){
  currentSparkSuggestions=sparkSuggestionsFor(currentStep,exprTargetKey);
  $('#sparkSuggestions').innerHTML=currentSparkSuggestions.map((s,i)=>
    `<button type="button" class="spark-suggestion" onclick="runSpark(${i})"><span>${esc(s.label)}</span>${I.arrowRight}</button>`
  ).join('');
}
function submitSparkPrompt(){
  const val=$('#sparkPrompt').value.trim();
  if(!val||sparkBusy) return;
  runSpark(null);
}
function runSpark(idx){
  if(sparkBusy) return;
  sparkBusy=true;
  const snippet=(idx!=null?currentSparkSuggestions[idx]:currentSparkSuggestions[0]).snippet;
  $('#sparkThinking').classList.add('show');
  $('#sparkPrompt').disabled=true;
  document.querySelectorAll('.spark-suggestion').forEach(b=>b.disabled=true);
  sparkTimeout=setTimeout(()=>{
    $('#exprText').value=snippet;
    updateExprGutter();
    $('#sparkThinking').classList.remove('show');
    $('#sparkPrompt').disabled=false;
    $('#sparkPrompt').value='';
    document.querySelectorAll('.spark-suggestion').forEach(b=>b.disabled=false);
    sparkBusy=false;
  },2300);
}
function openSchemaModal(){ $('#schemaOverlay').classList.add('show'); }
function closeSchemaModal(){ $('#schemaOverlay').classList.remove('show'); }

/* =====================================================================
   Inline External Connection creation — scoped, minimal-config only
   (§4/R6.1: not the full Integration Hub connector form; nested required
   entities are NOT created recursively — see the link-out note below).
   ===================================================================== */
let ecModalTarget=null;
function openEcModal(nodeId, fieldKey, ecType){
  ecModalTarget={nodeId,fieldKey,ecType};
  const meta=EC_TYPE_META[ecType]||{category:'',type:ecType};
  $('#ecModalTitle').textContent=`New ${meta.type}`;
  $('#ecCategory').value=meta.category;
  $('#ecType').value=meta.type;
  $('#ecName').value='';
  $('#ecUri').value='';
  $('#ecUri').placeholder=meta.uriPlaceholder||'';
  $('#ecBody').value='';
  $('#ecCreds').value='';
  $('#ecMethod').value='POST';
  $('#ecAuthType').value='None';
  $('#ecResponseFormat').value='String';
  $('#ecFallback').value='Success';
  updateEcCreateEnabled();
  $('#ecOverlay').classList.add('show');
}
function closeEcModal(){ $('#ecOverlay').classList.remove('show'); ecModalTarget=null; }
function updateEcCreateEnabled(){
  const ready = $('#ecName').value.trim() && $('#ecUri').value.trim() && $('#ecBody').value.trim() && $('#ecCreds').value.trim();
  $('#ecCreateBtn').disabled = !ready;
}
function navigateToExternalConnections(){
  toast('In the product this opens the Integration Hub — inline creation is deliberately not recursive (v1 constraint).');
}
function submitEcModal(){
  if(!ecModalTarget) return;
  const { nodeId, fieldKey, ecType } = ecModalTarget;
  const name=$('#ecName').value.trim();
  if(!name) return;
  const id='ec-'+Date.now()+'-'+Math.round(Math.random()*1000);
  if(!EC_OPTIONS[ecType]) EC_OPTIONS[ecType]=[];
  EC_OPTIONS[ecType].push({ id, name, enabled:true });
  const f=findField(nodeId,fieldKey);
  if(f){ f.value=id; S(nodeId).touched.add(fieldKey); }
  closeEcModal();
  markDirty();
  if(currentStep===nodeId) renderPanel();
  toast(`${name} connected`,'success');
}

/* ---------- boot ---------- */
renderCanvas();
applyTransform();
window.addEventListener('resize',drawEdges);
