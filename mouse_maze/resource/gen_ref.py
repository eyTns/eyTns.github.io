import json, random
random.seed(20260727)

def sim1(c_in, c_out, blocked, N=13, cap=99999999):
    V={}; pos=(0,c_in); V[pos]=1; moves=1
    while moves<cap:
        r,c=pos
        if (r,c)==(N-1,c_out): return moves+1, V
        best,bv=None,1<<60
        for nb in [(r+1,c),(r,c+1),(r,c-1),(r-1,c)]:
            nr,nc=nb
            if not (0<=nr<N and 0<=nc<N): continue
            if nb in blocked: continue
            if V.get(nb,0)<bv: best,bv=nb,V.get(nb,0)
        if best is None: return None,V
        moves+=1; pos=best; V[pos]=V.get(pos,0)+1
    return cap,V

def sim2(c_in,c_out,vw,hw,N=9,cap=99999999):
    V={}; pos=(0,c_in); V[pos]=1; moves=1
    while moves<cap:
        r,c=pos
        if (r,c)==(N-1,c_out): return moves+1, V
        best,bv=None,1<<60
        for nb in [(r+1,c),(r,c+1),(r,c-1),(r-1,c)]:
            nr,nc=nb
            if not (0<=nr<N and 0<=nc<N): continue
            if nr==r+1 and (r,c) in hw: continue
            if nr==r-1 and (r-1,c) in hw: continue
            if nc==c+1 and (r,c) in vw: continue
            if nc==c-1 and (r,c-1) in vw: continue
            if V.get(nb,0)<bv: best,bv=nb,V.get(nb,0)
        if best is None: return None,V
        moves+=1; pos=best; V[pos]=V.get(pos,0)+1
    return cap,V

def bfs1(c_in,c_out,blocked,N=13):
    if (0,c_in) in blocked or (N-1,c_out) in blocked: return False
    seen={(0,c_in)}; q=[(0,c_in)]
    for r,c in q:
        if (r,c)==(N-1,c_out): return True
        for nb in [(r+1,c),(r,c+1),(r,c-1),(r-1,c)]:
            nr,nc=nb
            if not (0<=nr<N and 0<=nc<N) or nb in seen or nb in blocked: continue
            seen.add(nb); q.append(nb)
    return False

def bfs2(c_in,c_out,vw,hw,N=9):
    seen={(0,c_in)}; q=[(0,c_in)]
    for r,c in q:
        if (r,c)==(N-1,c_out): return True
        for nb in [(r+1,c),(r,c+1),(r,c-1),(r-1,c)]:
            nr,nc=nb
            if not (0<=nr<N and 0<=nc<N) or nb in seen: continue
            if nr==r+1 and (r,c) in hw: continue
            if nr==r-1 and (r-1,c) in hw: continue
            if nc==c+1 and (r,c) in vw: continue
            if nc==c-1 and (r,c-1) in vw: continue
            seen.add(nb); q.append(nb)
    return False

cases=[]
# game 1
made=0
while made<1200:
    c_in=random.randrange(13); c_out=random.randrange(13)
    dens=random.choice([0.05,0.15,0.25,0.35,0.45])
    blocked={(r,c) for r in range(13) for c in range(13) if random.random()<dens}
    blocked.discard((0,c_in)); blocked.discard((12,c_out))
    valid=bfs1(c_in,c_out,blocked)
    turns=None
    if valid:
        turns,_=sim1(c_in,c_out,blocked)
    cases.append({'game':1,'cIn':c_in,'cOut':c_out,
                  'tiles':sorted(r*13+c for r,c in blocked),
                  'valid':valid,'turns':turns})
    made+=1
# game 2
made=0
while made<1200:
    c_in=random.randrange(9); c_out=random.randrange(9)
    dens=random.choice([0.1,0.2,0.3,0.4,0.5])
    vw={(r,c) for r in range(9) for c in range(8) if random.random()<dens}
    hw={(r,c) for r in range(8) for c in range(9) if random.random()<dens}
    valid=bfs2(c_in,c_out,vw,hw)
    turns=None
    if valid:
        turns,_=sim2(c_in,c_out,vw,hw)
    cases.append({'game':2,'cIn':c_in,'cOut':c_out,
                  'v':sorted(r*8+c for r,c in vw),'h':sorted(r*9+c for r,c in hw),
                  'valid':valid,'turns':turns})
    made+=1

json.dump(cases, open('ref_cases.json','w'))
print('cases:', len(cases))
print('game1 valid:', sum(1 for c in cases if c['game']==1 and c['valid']))
print('game2 valid:', sum(1 for c in cases if c['game']==2 and c['valid']))
print('max turns seen:', max((c['turns'] or 0) for c in cases))
