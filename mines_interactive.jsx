const { useState, useMemo, useRef, useEffect, useCallback } = React;

// ===== 1. 상수 =====
const EXAMPLES = [
  { name:'Q1 small', data:`3 5\n24531\n46631\n34310` },
  { name:'Q7 small', data:`7 7\n2333332\n3444442\n3444442\n3444442\n3444442\n3444442\n2222220` },
];
const CS = 32;
const BTN = { padding:'6px 14px', borderRadius:6, border:'1px solid #cbd5e1', background:'#f8fafc', cursor:'pointer', fontSize:13, fontFamily:'system-ui,sans-serif' };
const BG = { 0:'#f8fafc', 1:'#fee2e2', 2:'#dbeafe' };
const BD = { 0:'#e2e8f0', 1:'#fecaca', 2:'#93c5fd' };

function MinesSolver() {
  // ===== 2. State/Ref =====
  const [grid, setGrid] = useState(null);
  const [cells, setCells] = useState(null);
  const [H, setH] = useState(0);
  const [W, setW] = useState(0);
  const [showPaste, setShowPaste] = useState(false);
  const [paste, setPaste] = useState('');
  const [history, setHistory] = useState([]);
  const [mobileMode, setMobileMode] = useState('mine');
  const [hintMsg, setHintMsg] = useState('');
  const [hintUI, setHintUI] = useState(false);
  const hintRunRef = useRef(false);
  const hintStopRef = useRef(false);
  const dragRef = useRef({ sx:0, sy:0, sl:0, st:0, moved:false });
  const cvRef = useRef(null);
  const fiRef = useRef(null);
  const ctRef = useRef(null);

  // ===== 3. 입력 =====
  const parseInput = useCallback((txt) => {
    try {
      const ls = txt.trim().split('\n').map(l=>l.trim()).filter(Boolean);
      const [h,w] = ls[0].split(/\s+/).map(Number);
      if(!h||!w||ls.length<h+1) throw new Error('형식 오류');
      const g=[];
      for(let i=0;i<h;i++){
        const d=ls[i+1].split('').map(Number);
        if(d.length!==w) throw new Error(`행${i+1} 너비 불일치`);
        g.push(d);
      }
      setH(h);setW(w);setGrid(g);
      setCells(Array.from({length:h},()=>Array(w).fill(0)));
      setHistory([]);setHintMsg('');
      hintRunRef.current=false;hintStopRef.current=true;setHintUI(false);
    } catch(e){ alert('파싱 오류: '+e.message); }
  },[]);

  const handleFile=(e)=>{
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader();
    r.onload=(ev)=>{
      const txt=ev.target.result;
      try {
        const obj=JSON.parse(txt);
        if(obj._type==='mines_save'){
          setH(obj.H);setW(obj.W);setGrid(obj.grid);setCells(obj.cells);
          setHistory([]);setHintMsg('');
          hintRunRef.current=false;hintStopRef.current=true;setHintUI(false);
          return;
        }
      } catch(_){}
      parseInput(txt);
    };
    r.readAsText(f);
    if(fiRef.current) fiRef.current.value='';
  };

  // ===== 4. 계산 =====
  const remaining = useMemo(()=>{
    if(!grid||!cells) return null;
    const r=Array.from({length:H},()=>Array(W).fill(0));
    for(let i=0;i<H;i++) for(let j=0;j<W;j++){
      let c=0;
      for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){
        const ni=i+di,nj=j+dj;
        if(ni>=0&&ni<H&&nj>=0&&nj<W&&cells[ni][nj]===1) c++;
      }
      r[i][j]=grid[i][j]-c;
    }
    return r;
  },[grid,cells,H,W]);

  const stats = useMemo(()=>{
    if(!cells||!remaining) return {total:0,safe:0,solved:false,wrong:0};
    let t=0,s=0,w=0;
    for(let i=0;i<H;i++) for(let j=0;j<W;j++){
      if(cells[i][j]===1) t++;
      if(cells[i][j]===2) s++;
      if(remaining[i][j]!==0) w++;
    }
    return {total:t,safe:s,solved:w===0&&H>0,wrong:w};
  },[cells,remaining,H,W]);

  // ===== 5. 유틸 =====
  const getCell=(e)=>{
    const cv=cvRef.current;
    const ct=ctRef.current;
    if(!cv||!ct) return null;
    const r=cv.getBoundingClientRect();
    const t=e.touches?e.touches[0]:e;
    const gx=t.clientX-r.left+ct.scrollLeft;
    const gy=t.clientY-r.top+ct.scrollTop;
    const col=Math.floor(gx/CS);
    const row=Math.floor(gy/CS);
    return(row>=0&&row<H&&col>=0&&col<W)?[row,col]:null;
  };

  const pushHistory=()=>{
    setHistory(h=>{const n=[...h,cells.map(r=>[...r])];return n.length>100?n.slice(-100):n;});
  };

  const applyCell=(i,j,target)=>{
    setCells(p=>{const n=p.map(r=>[...r]);n[i][j]=p[i][j]===target?0:target;return n;});
  };

  // ===== 6. 인터랙션 =====
  const onMouseDown=(e)=>{
    e.preventDefault();
    const t=e;
    const ct=ctRef.current;
    dragRef.current={sx:t.clientX,sy:t.clientY,sl:ct?.scrollLeft||0,st:ct?.scrollTop||0,moved:false,btn:e.button,dragging:true};
  };
  const onMouseMove=(e)=>{
    const d=dragRef.current;
    if(!d.dragging) return;
    const dx=e.clientX-d.sx, dy=e.clientY-d.sy;
    if(Math.abs(dx)>3||Math.abs(dy)>3) d.moved=true;
    if(d.moved&&ctRef.current){
      ctRef.current.scrollLeft=d.sl-dx;
      ctRef.current.scrollTop=d.st-dy;
    }
  };
  const onMouseUp=(e)=>{
    if(!dragRef.current.moved){
      const c=getCell(e); if(!c) return;
      pushHistory();
      const target=dragRef.current.btn===2?1:2;
      applyCell(c[0],c[1],target);
    }
    dragRef.current.dragging=false;
  };

  const onTouchStart=(e)=>{
    const t=e.touches[0];
    const ct=ctRef.current;
    dragRef.current={sx:t.clientX,sy:t.clientY,sl:ct?.scrollLeft||0,st:ct?.scrollTop||0,moved:false};
  };
  const onTouchMove=(e)=>{
    const t=e.touches[0];
    const d=dragRef.current;
    const dx=t.clientX-d.sx, dy=t.clientY-d.sy;
    if(Math.abs(dx)>3||Math.abs(dy)>3) d.moved=true;
    if(d.moved&&ctRef.current){
      ctRef.current.scrollLeft=d.sl-dx;
      ctRef.current.scrollTop=d.st-dy;
    }
  };
  const onTouchEnd=(e)=>{
    if(!dragRef.current.moved){
      const c=getCell(e.changedTouches?{touches:[e.changedTouches[0]]}:e);
      if(!c) return;
      pushHistory();
      const target=mobileMode==='mine'?1:2;
      applyCell(c[0],c[1],target);
    }
  };

  // ===== 7. 되돌리기 =====
  const undo=useCallback(()=>{
    setHistory(h=>{if(!h.length) return h;setCells(h[h.length-1]);return h.slice(0,-1);});
  },[]);

  useEffect(()=>{
    const fn=(e)=>{if((e.ctrlKey||e.metaKey)&&e.key==='z'){e.preventDefault();undo();}};
    window.addEventListener('keydown',fn);
    return ()=>window.removeEventListener('keydown',fn);
  },[undo]);

  // ===== 8. 힌트 =====
  const stopHint = useCallback(()=>{
    hintStopRef.current=true; hintRunRef.current=false; setHintUI(false);
  },[]);

  const autoHint = useCallback(()=>{
    if(!grid||!cells||hintRunRef.current) return;
    hintStopRef.current=false;
    hintRunRef.current=true;
    setHintUI(true);
    setHistory(h=>{const x=[...h,cells.map(r=>[...r])];return x.length>100?x.slice(-100):x;});

    const cur=cells.map(r=>[...r]);
    const inB=(r,c)=>r>=0&&r<H&&c>=0&&c<W;
    let totalCount=0;

    const getRem0=(i,j)=>{
      let c=0;
      for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){
        const ni=i+di,nj=j+dj;
        if(inB(ni,nj)&&cur[ni][nj]===1) c++;
      }
      return grid[i][j]-c;
    };
    for(let i=0;i<H;i++) for(let j=0;j<W;j++){
      if(getRem0(i,j)<0){
        for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){
          const ni=i+di,nj=j+dj;
          if(inB(ni,nj)) cur[ni][nj]=0;
        }
      }
    }

    const getRem=(i,j)=>{
      let c=0;
      for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){
        const ni=i+di,nj=j+dj;
        if(inB(ni,nj)&&cur[ni][nj]===1) c++;
      }
      return grid[i][j]-c;
    };

    const findBatch=()=>{
      const collect=(list)=>{
        const blanks=[];let mc=0;
        for(const [r,c] of list){
          if(cur[r][c]===0) blanks.push([r,c]);
          else if(cur[r][c]===1) mc++;
        }
        return {blanks,mc};
      };
      for(let i=0;i<H;i++) for(let j=0;j<W;j++){
        // Rule 1&2
        const rv=getRem(i,j);
        const blanks=[];
        for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){
          const ni=i+di,nj=j+dj;
          if(inB(ni,nj)&&cur[ni][nj]===0) blanks.push([ni,nj]);
        }
        if(blanks.length>0){
          if(rv===0){ blanks.forEach(([r,c])=>{cur[r][c]=2;}); return blanks.length; }
          if(rv>0&&rv===blanks.length){ blanks.forEach(([r,c])=>{cur[r][c]=1;}); return blanks.length; }
        }
        // Rule 3 vertical
        if(i<H-1){
          const aL=[],dL=[];
          for(let dc=-1;dc<=1;dc++){if(inB(i-1,j+dc))aL.push([i-1,j+dc]);if(inB(i+2,j+dc))dL.push([i+2,j+dc]);}
          const a=collect(aL),d=collect(dL);
          const adj=(grid[i+1][j]-grid[i][j])-d.mc+a.mc;
          if(adj>0&&adj===d.blanks.length&&d.blanks.length>0){
            let n=0;
            d.blanks.forEach(([r,c])=>{cur[r][c]=1;n++;});
            a.blanks.forEach(([r,c])=>{cur[r][c]=2;n++;});
            if(n>0) return n;
          } else if(adj<0&&-adj===a.blanks.length&&a.blanks.length>0){
            let n=0;
            a.blanks.forEach(([r,c])=>{cur[r][c]=1;n++;});
            d.blanks.forEach(([r,c])=>{cur[r][c]=2;n++;});
            if(n>0) return n;
          }
        }
        // Rule 3 horizontal
        if(j<W-1){
          const aL=[],dL=[];
          for(let dr=-1;dr<=1;dr++){if(inB(i+dr,j-1))aL.push([i+dr,j-1]);if(inB(i+dr,j+2))dL.push([i+dr,j+2]);}
          const a=collect(aL),d=collect(dL);
          const adj=(grid[i][j+1]-grid[i][j])-d.mc+a.mc;
          if(adj>0&&adj===d.blanks.length&&d.blanks.length>0){
            let n=0;
            d.blanks.forEach(([r,c])=>{cur[r][c]=1;n++;});
            a.blanks.forEach(([r,c])=>{cur[r][c]=2;n++;});
            if(n>0) return n;
          } else if(adj<0&&-adj===a.blanks.length&&a.blanks.length>0){
            let n=0;
            a.blanks.forEach(([r,c])=>{cur[r][c]=1;n++;});
            d.blanks.forEach(([r,c])=>{cur[r][c]=2;n++;});
            if(n>0) return n;
          }
        }
      }
      return 0;
    };

    const fillSafe=()=>{
      let count=0;
      for(let i=0;i<H&&count<100;i++) for(let j=0;j<W&&count<100;j++){
        if(getRem(i,j)===0){
          for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){
            if(count>=100) break;
            const ni=i+di,nj=j+dj;
            if(inB(ni,nj)&&cur[ni][nj]===0){
              cur[ni][nj]=2;
              count++;
            }
          }
        }
      }
      return count;
    };

    let phase='fill';

    const step=()=>{
      if(hintStopRef.current){
        hintRunRef.current=false; setHintUI(false);
        setCells(cur.map(r=>[...r]));
        setHintMsg(`⏹ 중단 (${totalCount}칸)`);
        setTimeout(()=>setHintMsg(''),3000); return;
      }
      if(phase==='fill'){
        const filled=fillSafe();
        if(filled){
          totalCount+=filled;
          setCells(cur.map(r=>[...r]));
          setHintMsg(`✨ ${totalCount}칸 표시 중...`);
          setTimeout(step,30);
          return;
        }
        phase='hint';
      }
      const found=findBatch();
      if(!found){
        hintRunRef.current=false; setHintUI(false);
        setCells(cur.map(r=>[...r]));
        setHintMsg(totalCount>0?`✨ 완료! ${totalCount}칸`:'힌트 없음');
        setTimeout(()=>setHintMsg(''),3000); return;
      }
      totalCount+=found;
      setCells(cur.map(r=>[...r]));
      setHintMsg(`✨ ${totalCount}칸 표시 중...`);
      setTimeout(step,30);
    };
    setTimeout(step,0);
  },[grid,cells,H,W]);

  // ===== 9. 출력 =====
  const applyQ7 = useCallback(()=>{
    if(!grid) return;
    pushHistory();
    const n=Array.from({length:H},()=>Array(W).fill(0));
    for(let i=0;i<H;i++) for(let j=0;j<W;j++){
      if(i%3===1) n[i][j]=(j%3!==1)?1:0;
      else n[i][j]=(j%3===1)?1:0;
    }
    setCells(n);
  },[grid,H,W]);

  const exportResult=()=>{
    let o='';
    for(let i=0;i<H;i++){for(let j=0;j<W;j++) o+=cells[i][j]===1?'X':'.';o+='\n';}
    const b=new Blob([o],{type:'text/plain'});
    const u=URL.createObjectURL(b);const a=document.createElement('a');
    a.href=u;a.download='mines_output.txt';
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
  };

  const saveProgress=()=>{
    const obj={_type:'mines_save',H,W,grid,cells};
    const b=new Blob([JSON.stringify(obj)],{type:'application/json'});
    const u=URL.createObjectURL(b);const a=document.createElement('a');
    a.href=u;a.download='mines_progress.json';
    document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
  };

  const doClear=()=>{
    if(H&&W){pushHistory();setCells(Array.from({length:H},()=>Array(W).fill(0)));}
  };

  // ===== 10. 렌더링 (뷰포트 가상화) =====
  const drawVisible = useCallback(()=>{
    const cv=cvRef.current;
    const ct=ctRef.current;
    if(!cv||!ct||!grid||!remaining) return;

    const vw=ct.clientWidth;
    const vh=ct.clientHeight;
    const sx=ct.scrollLeft;
    const sy=ct.scrollTop;

    const dpr=window.devicePixelRatio||1;
    const sd=Math.min(dpr,Math.floor(16384/Math.max(vw,vh))||1);

    if(cv.width!==vw*sd||cv.height!==vh*sd){
      cv.width=vw*sd; cv.height=vh*sd;
      cv.style.width=vw+'px'; cv.style.height=vh+'px';
    }

    const ctx=cv.getContext('2d');
    ctx.setTransform(sd,0,0,sd,0,0);
    ctx.clearRect(0,0,vw,vh);

    const r0=Math.max(0,Math.floor(sy/CS));
    const r1=Math.min(H,Math.ceil((sy+vh)/CS));
    const c0=Math.max(0,Math.floor(sx/CS));
    const c1=Math.min(W,Math.ceil((sx+vw)/CS));

    const fs=`bold ${Math.round(CS*.48)}px sans-serif`;
    ctx.font=fs;
    ctx.textAlign='center'; ctx.textBaseline='middle';

    for(let i=r0;i<r1;i++) for(let j=c0;j<c1;j++){
      const x=j*CS-sx, y=i*CS-sy;
      const st=cells[i][j], rem=remaining[i][j];
      ctx.fillStyle=BG[st];
      ctx.fillRect(x,y,CS,CS);
      ctx.strokeStyle=BD[st];
      ctx.lineWidth=1;
      ctx.strokeRect(x+.5,y+.5,CS-1,CS-1);
      ctx.fillStyle=rem===0?'#059669':rem<0?'#dc2626':'#475569';
      ctx.fillText(String(rem),x+CS/2,y+CS/2);
    }
  },[grid,cells,remaining,H,W]);

  useEffect(()=>{ drawVisible(); },[drawVisible]);

  useEffect(()=>{
    const ct=ctRef.current;
    if(!ct) return;
    const h=()=>drawVisible();
    ct.addEventListener('scroll',h);
    return ()=>ct.removeEventListener('scroll',h);
  },[drawVisible]);

  // ===== 11. JSX =====
  const sq=(bg,bd)=>({display:'inline-block',width:12,height:12,background:bg,border:`1px solid ${bd}`,verticalAlign:-2,marginRight:3,borderRadius:2});

  return (
    <div style={{fontFamily:'system-ui,sans-serif',maxWidth:960,margin:'0 auto',padding:16,color:'#1e293b'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
        <span style={{fontSize:26}}>💣</span>
        <div>
          <h2 style={{margin:0,fontSize:19}}>Mines Puzzle Solver</h2>
          <p style={{margin:0,fontSize:12,color:'#94a3b8'}}>좌클릭: 안전 · 우클릭: 지뢰 · Ctrl+Z: 되돌리기</p>
        </div>
      </div>

      <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'10px 0'}}>
        <input ref={fiRef} type="file" accept=".in,.txt,.json,*/*" onChange={handleFile} style={{display:'none'}} />
        <label onClick={()=>fiRef.current?.click()} style={{...BTN,display:'inline-block'}}>📂 열기</label>
        <button onClick={()=>setShowPaste(!showPaste)} style={BTN}>📋 텍스트</button>
        {EXAMPLES.map((ex,i)=><button key={i} onClick={()=>parseInput(ex.data)} style={BTN}>📝 {ex.name}</button>)}
        {grid&&<button onClick={undo} disabled={!history.length} style={{...BTN,opacity:history.length?1:.4}}>↩ 되돌리기</button>}
        {grid&&<button onClick={doClear} style={BTN}>🔄 초기화</button>}
        {grid&&!hintUI&&<button onClick={autoHint} style={{...BTN,background:'#fef3c7',borderColor:'#fbbf24'}}>✨ 자동 힌트</button>}
        {grid&&hintUI&&<button onClick={stopHint} style={{...BTN,background:'#fecaca',borderColor:'#f87171'}}>⏹ 중단</button>}
        {grid&&<button onClick={applyQ7} style={{...BTN,background:'#e0e7ff',borderColor:'#818cf8'}}>🔷 Q7 패턴</button>}
        {grid&&<button onClick={saveProgress} style={BTN}>📥 진행 저장</button>}
        {grid&&<button onClick={exportResult} style={{...BTN,background:stats.solved?'#059669':'#3b82f6',color:'#fff',borderColor:stats.solved?'#059669':'#3b82f6'}}>💾 결과 내보내기</button>}
      </div>

      {showPaste&&(
        <div style={{marginBottom:12}}>
          <textarea value={paste} onChange={e=>setPaste(e.target.value)}
            placeholder={`예:\n3 5\n24531\n46631\n34310`} rows={6}
            style={{width:'100%',boxSizing:'border-box',fontFamily:'monospace',fontSize:13,padding:8,borderRadius:6,border:'1px solid #cbd5e1',resize:'vertical'}} />
          <button onClick={()=>{parseInput(paste);setShowPaste(false);}} style={{...BTN,marginTop:4}}>적용</button>
        </div>
      )}

      {grid&&(
        <>
          <div style={{display:'flex',gap:16,alignItems:'center',marginBottom:8,fontSize:14,flexWrap:'wrap'}}>
            <span style={{color:'#64748b'}}>📐 {H}×{W}</span>
            <span>💣 <b>{stats.total}</b></span>
            <span>🔵 <b>{stats.safe}</b></span>
            {stats.solved
              ?<span style={{color:'#059669',fontWeight:600}}>✅ 풀이 완료!</span>
              :<span style={{color:'#dc2626'}}>⏳ 미해결 <b>{stats.wrong}</b>칸</span>}
            {hintMsg&&<span style={{color:'#b45309',fontWeight:500}}>{hintMsg}</span>}
          </div>

          <div style={{display:'flex',gap:4,marginBottom:8}}>
            <button onClick={()=>setMobileMode('mine')}
              style={{...BTN,background:mobileMode==='mine'?'#fee2e2':'#f8fafc',borderColor:mobileMode==='mine'?'#f87171':'#cbd5e1',fontWeight:mobileMode==='mine'?700:400}}>
              💣 지뢰
            </button>
            <button onClick={()=>setMobileMode('safe')}
              style={{...BTN,background:mobileMode==='safe'?'#dbeafe':'#f8fafc',borderColor:mobileMode==='safe'?'#60a5fa':'#cbd5e1',fontWeight:mobileMode==='safe'?700:400}}>
              🔵 안전
            </button>
            <span style={{fontSize:12,color:'#94a3b8',alignSelf:'center',marginLeft:4}}>터치용</span>
          </div>
        </>
      )}

      {stats.solved&&(
        <div style={{background:'#d1fae5',border:'1px solid #6ee7b7',borderRadius:8,padding:'10px 14px',marginBottom:10,fontSize:14}}>
          🎉 풀이 완료! <b>"결과 내보내기"</b>로 저장하세요.
        </div>
      )}

      {grid?(
        <div ref={ctRef} style={{overflow:'auto',maxHeight:'65vh',border:'2px solid #e2e8f0',borderRadius:8,background:'#fff',position:'relative'}}>
          <div style={{width:W*CS,height:H*CS}}>
            <canvas ref={cvRef}
              style={{position:'sticky',top:0,left:0,cursor:'crosshair',touchAction:'none',display:'block'}}
              onMouseDown={onMouseDown} onMouseMove={onMouseMove}
              onMouseUp={onMouseUp} onMouseLeave={()=>{}}
              onTouchStart={onTouchStart} onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd} onTouchCancel={()=>{}}
              onContextMenu={e=>e.preventDefault()} />
          </div>
        </div>
      ):(
        <div style={{textAlign:'center',padding:'60px 20px',color:'#94a3b8',background:'#f8fafc',borderRadius:12,border:'2px dashed #e2e8f0'}}>
          <p style={{fontSize:52,margin:'0 0 8px'}}>💣</p>
          <p style={{margin:0,fontSize:15}}>파일을 열거나 예제를 로드하여 시작하세요</p>
        </div>
      )}

      <div style={{marginTop:10,fontSize:11,color:'#94a3b8',display:'flex',gap:12,flexWrap:'wrap'}}>
        <span><span style={sq('#f8fafc','#e2e8f0')}/>빈 칸</span>
        <span><span style={sq('#fee2e2','#fecaca')}/>지뢰</span>
        <span><span style={sq('#dbeafe','#93c5fd')}/>안전</span>
        <span style={{marginLeft:8}}>숫자: <span style={{color:'#059669'}}>●</span>해결 <span style={{color:'#475569'}}>●</span>부족 <span style={{color:'#dc2626'}}>●</span>초과</span>
      </div>
    </div>
  );
}