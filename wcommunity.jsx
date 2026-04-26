// wcommunity.jsx — loaded by index.html via Babel standalone

const { useState, useEffect, useRef, useCallback } = React;
const ACCENT = "#3b82f6";
const S = {
  bg:"#0e0f11", surface:"#16181c", s2:"#1e2026",
  border:"#2a2d35", dim:"#7a7f8a", muted:"#4a4f5a",
  green:"#22c55e", red:"#ef4444", text:"#e8e9eb"
};

// ── Global styles injected once ───────────────────────────────────────────────
const styleEl = document.createElement("style");
styleEl.textContent = `
  input,textarea,button{font-family:'DM Sans',sans-serif}
  ::-webkit-scrollbar{width:5px}
  ::-webkit-scrollbar-thumb{background:#2a2d35;border-radius:3px}
  @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes tin{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
  @keyframes fo{from{opacity:0}to{opacity:1}}
  @keyframes ms{from{opacity:0;transform:translateY(16px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
  @media(max-width:760px){.sidebar-col{display:none!important}.search-col{display:none!important}}
`;
document.head.appendChild(styleEl);

// ── Helpers ───────────────────────────────────────────────────────────────────
function lsGet(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
function uid() { return "_" + Date.now() + "_" + Math.random().toString(36).slice(2); }
function timeAgo(iso) {
  const d = (Date.now() - new Date(iso)) / 1000;
  if (d < 60) return "just now"; if (d < 3600) return Math.floor(d/60) + "m ago";
  if (d < 86400) return Math.floor(d/3600) + "h ago"; if (d < 2592000) return Math.floor(d/86400) + "d ago";
  return new Date(iso).toLocaleDateString();
}
function resizeImg(src, maxW=900, q=0.75) {
  return new Promise(res => {
    const img = new Image(); img.onload = () => {
      let w = img.width, hh = img.height;
      if (w > maxW) { hh = Math.round(hh*maxW/w); w = maxW; }
      const c = document.createElement("canvas"); c.width=w; c.height=hh;
      c.getContext("2d").drawImage(img,0,0,w,hh); res(c.toDataURL("image/jpeg",q));
    }; img.src = src;
  });
}
function avatarColor(name) {
  const cols = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"];
  return cols[(name?.charCodeAt(0)||0) % cols.length];
}

// ── Reusable components ───────────────────────────────────────────────────────
function Av({ name="?", size=34, fs=14 }) {
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:avatarColor(name),
      display:"flex",alignItems:"center",justifyContent:"center",
      fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:fs,color:"#fff",flexShrink:0,userSelect:"none"}}>
      {(name[0]||"?").toUpperCase()}
    </div>
  );
}

function Btn({ primary, full, sm, danger, onClick, disabled, children, style:sx={} }) {
  const [hov, setHov] = useState(false);
  const base = { display:"inline-flex",alignItems:"center",justifyContent:"center",gap:5,
    padding:sm?"5px 13px":"8px 18px",borderRadius:999,fontSize:sm?13:14,fontWeight:500,
    cursor:disabled?"not-allowed":"pointer",border:"none",transition:"all .18s",
    whiteSpace:"nowrap",width:full?"100%":undefined,opacity:disabled?.6:1 };
  const col = primary ? { background:hov&&!disabled?"#2563eb":ACCENT, color:"#fff", transform:hov&&!disabled?"translateY(-1px)":"none" }
    : danger ? { background:hov?"rgba(239,68,68,.12)":"transparent", color:S.red, border:`1px solid ${S.red}` }
    : { background:hov?"#1e2026":"transparent", color:hov?S.text:S.dim, border:`1px solid ${S.border}` };
  return (
    <button onClick={onClick} disabled={disabled} style={{...base,...col,...sx}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      {children}
    </button>
  );
}

function Inp({ label, type="text", ...props }) {
  const [f, setF] = useState(false);
  return (
    <div style={{marginBottom:15}}>
      {label && <label style={{display:"block",fontSize:12,fontWeight:600,color:S.dim,marginBottom:5,textTransform:"uppercase",letterSpacing:".4px"}}>{label}</label>}
      <input type={type} {...props}
        onFocus={e=>{setF(true);props.onFocus&&props.onFocus(e);}}
        onBlur={e=>{setF(false);props.onBlur&&props.onBlur(e);}}
        style={{width:"100%",background:S.s2,border:`1px solid ${f?ACCENT:S.border}`,borderRadius:8,
          padding:"10px 13px",color:S.text,fontSize:14,outline:"none",transition:"border-color .2s",...(props.style||{})}} />
    </div>
  );
}

function Tarea({ label, ...props }) {
  const [f, setF] = useState(false);
  return (
    <div style={{marginBottom:15}}>
      {label && <label style={{display:"block",fontSize:12,fontWeight:600,color:S.dim,marginBottom:5,textTransform:"uppercase",letterSpacing:".4px"}}>{label}</label>}
      <textarea {...props}
        onFocus={e=>{setF(true);props.onFocus&&props.onFocus(e);}}
        onBlur={e=>{setF(false);props.onBlur&&props.onBlur(e);}}
        style={{width:"100%",background:S.s2,border:`1px solid ${f?ACCENT:S.border}`,borderRadius:8,
          padding:"10px 13px",color:S.text,fontSize:14,outline:"none",resize:"vertical",minHeight:90,
          transition:"border-color .2s",...(props.style||{})}} />
    </div>
  );
}

function Modal({ open, onClose, title, maxW=520, children }) {
  if (!open) return null;
  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.65)",backdropFilter:"blur(4px)",
        zIndex:500,display:"flex",alignItems:"center",justifyContent:"center",padding:18,animation:"fo .18s ease"}}>
      <div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:16,
        width:"100%",maxWidth:maxW,maxHeight:"90vh",overflowY:"auto",animation:"ms .2s ease"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"18px 22px",borderBottom:`1px solid ${S.border}`}}>
          <span style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800}}>{title}</span>
          <button onClick={onClose} style={{width:30,height:30,borderRadius:"50%",border:"none",
            background:S.s2,color:S.dim,cursor:"pointer",fontSize:18,
            display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
        </div>
        <div style={{padding:22}}>{children}</div>
      </div>
    </div>
  );
}

function ErrBox({ msg }) {
  if (!msg) return null;
  return <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",
    borderRadius:8,padding:"9px 13px",fontSize:13,color:S.red,marginBottom:14}}>{msg}</div>;
}

function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback(msg => {
    const id = uid();
    setToasts(t => [...t, {id, msg}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3200);
  }, []);
  return { toasts, add };
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ open, onClose, onAuth, toast }) {
  const [tab, setTab] = useState("reg");
  const [u,setU]=useState(""), [e,setE]=useState(""), [p,setP]=useState("");
  const [le,setLe]=useState(""), [lp,setLp]=useState("");
  const [err,setErr]=useState(""), [loading,setLoading]=useState(false);

  const register = async () => {
    setErr("");
    if (!u||!e||!p) return setErr("Fill in all fields.");
    if (u.length<3) return setErr("Username min 3 chars.");
    if (!/^[a-zA-Z0-9_]+$/.test(u)) return setErr("Username: letters, numbers, _ only.");
    if (p.length<6) return setErr("Password min 6 chars.");
    setLoading(true);
    const users = lsGet("wc_users") || {};
    if (Object.values(users).find(x=>x.username.toLowerCase()===u.toLowerCase())) { setLoading(false); return setErr("Username already taken."); }
    if (Object.values(users).find(x=>x.email.toLowerCase()===e.toLowerCase())) { setLoading(false); return setErr("Email already registered."); }
    const id = uid();
    users[id] = { id, username:u, email:e, password:p, joinedAt:new Date().toISOString() };
    lsSet("wc_users", users);
    onAuth(users[id]); toast("🎉 Welcome, "+u+"!"); onClose();
    setU(""); setE(""); setP(""); setLoading(false);
  };

  const login = async () => {
    setErr(""); if (!le||!lp) return setErr("Fill in all fields.");
    setLoading(true);
    const users = lsGet("wc_users") || {};
    const user = Object.values(users).find(x=>x.email.toLowerCase()===le.toLowerCase()&&x.password===lp);
    if (!user) { setLoading(false); return setErr("Invalid email or password."); }
    onAuth(user); toast("👋 Welcome back, "+user.username+"!"); onClose();
    setLe(""); setLp(""); setLoading(false);
  };

  const tabSt = t => ({ padding:"9px 18px",fontSize:14,fontWeight:500,cursor:"pointer",
    borderBottom:`2px solid ${tab===t?ACCENT:"transparent"}`,color:tab===t?ACCENT:S.muted,transition:"all .15s" });

  return (
    <Modal open={open} onClose={onClose} title={tab==="reg"?"Join wcommunity":"Welcome Back"}>
      <ErrBox msg={err} />
      <div style={{display:"flex",borderBottom:`1px solid ${S.border}`,marginBottom:22}}>
        <div style={tabSt("reg")} onClick={()=>{setTab("reg");setErr("");}}>Register</div>
        <div style={tabSt("log")} onClick={()=>{setTab("log");setErr("");}}>Log In</div>
      </div>
      {tab==="reg" ? (
        <>
          <Inp label="Username" value={u} onChange={e=>setU(e.target.value)} placeholder="letters, numbers, _" autoComplete="off" />
          <Inp label="Email" type="email" value={e} onChange={x=>setE(x.target.value)} placeholder="you@example.com" />
          <Inp label="Password" type="password" value={p} onChange={x=>setP(x.target.value)} placeholder="Min 6 characters" />
          <Btn primary full onClick={register} disabled={loading}>{loading?"Creating…":"Create Account"}</Btn>
          <div style={{textAlign:"center",marginTop:14,fontSize:14,color:S.muted}}>
            Have an account? <span onClick={()=>setTab("log")} style={{color:ACCENT,cursor:"pointer",fontWeight:500}}>Log in</span>
          </div>
        </>
      ) : (
        <>
          <Inp label="Email" type="email" value={le} onChange={x=>setLe(x.target.value)} placeholder="you@example.com" />
          <Inp label="Password" type="password" value={lp} onChange={x=>setLp(x.target.value)} placeholder="Your password" />
          <Btn primary full onClick={login} disabled={loading}>{loading?"Logging in…":"Log In"}</Btn>
          <div style={{textAlign:"center",marginTop:14,fontSize:14,color:S.muted}}>
            No account? <span onClick={()=>setTab("reg")} style={{color:ACCENT,cursor:"pointer",fontWeight:500}}>Register</span>
          </div>
        </>
      )}
    </Modal>
  );
}

// ── Create Post Modal ─────────────────────────────────────────────────────────
function CreatePostModal({ open, onClose, me, onPost, toast }) {
  const [title,setTitle]=useState(""), [body,setBody]=useState("");
  const [photo,setPhoto]=useState(null), [flair,setFlair]=useState(null);
  const [err,setErr]=useState(""), [loading,setLoading]=useState(false);
  const FLAIRS = ["Discussion","Meme","Photo","Question","News","Story","Tech","Fun"];

  const handlePhoto = e => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => { const c = await resizeImg(ev.target.result); setPhoto(c); };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    setErr(""); if (!title.trim()) return setErr("Title is required.");
    setLoading(true);
    const posts = lsGet("wc_posts") || {};
    const id = uid();
    posts[id] = { id, title:title.trim(), body:body.trim(), image:photo||"", flair:flair||"",
      authorId:me.id, authorName:me.username, createdAt:new Date().toISOString(),
      votes:1, upvoters:{[me.id]:true}, downvoters:{}, commentCount:0 };
    lsSet("wc_posts", posts);
    onPost(posts); toast("🚀 Post published!"); onClose();
    setTitle(""); setBody(""); setPhoto(null); setFlair(null); setErr(""); setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Post">
      <ErrBox msg={err} />
      <Inp label="Title *" value={title} onChange={e=>setTitle(e.target.value)} placeholder="What's your post about?" maxLength={200} />
      <Tarea label="Body (optional)" value={body} onChange={e=>setBody(e.target.value)} placeholder="Tell us more… (optional)" />

      <div style={{marginBottom:15}}>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:S.dim,marginBottom:5,textTransform:"uppercase",letterSpacing:".4px"}}>Photo (optional)</label>
        {photo ? (
          <div style={{position:"relative"}}>
            <img src={photo} style={{width:"100%",maxHeight:180,objectFit:"cover",borderRadius:8}} />
            <button onClick={()=>setPhoto(null)} style={{position:"absolute",top:7,right:7,background:"rgba(0,0,0,.7)",
              border:"none",borderRadius:"50%",color:"#fff",width:26,height:26,cursor:"pointer",fontSize:14,
              display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
          </div>
        ) : (
          <label style={{display:"block",border:`2px dashed ${S.border}`,borderRadius:12,padding:"22px",
            textAlign:"center",cursor:"pointer",color:S.muted,fontSize:14,transition:"border-color .2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=ACCENT}
            onMouseLeave={e=>e.currentTarget.style.borderColor=S.border}>
            <div style={{fontSize:26,marginBottom:6}}>📷</div>
            <div>Click to upload image</div>
            <div style={{fontSize:12,marginTop:3,color:S.muted}}>JPG, PNG, GIF — auto-compressed</div>
            <input type="file" accept="image/*" onChange={handlePhoto} style={{display:"none"}} />
          </label>
        )}
      </div>

      <div style={{marginBottom:18}}>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:S.dim,marginBottom:8,textTransform:"uppercase",letterSpacing:".4px"}}>Flair</label>
        <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
          {FLAIRS.map(f => (
            <button key={f} onClick={()=>setFlair(flair===f?null:f)}
              style={{padding:"4px 12px",borderRadius:999,border:`1px solid ${flair===f?ACCENT:S.border}`,
                background:flair===f?"rgba(59,130,246,.15)":"transparent",color:flair===f?ACCENT:S.dim,
                fontSize:13,cursor:"pointer",transition:"all .15s",fontFamily:"'DM Sans',sans-serif"}}>
              {f}
            </button>
          ))}
        </div>
      </div>
      <Btn primary full onClick={submit} disabled={loading}>{loading?"Publishing…":"Publish Post"}</Btn>
    </Modal>
  );
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, me, onVote, onDelete, onImg, openAuth, toast }) {
  const [showCmt,setShowCmt]=useState(false);
  const [cmts,setCmts]=useState([]);
  const [cmtText,setCmtText]=useState("");
  const [hov,setHov]=useState(false);
  const upvoted   = me && post.upvoters?.[me.id];
  const downvoted = me && post.downvoters?.[me.id];

  const loadCmts = () => { const c = lsGet("wc_cmts_"+post.id)||[]; setCmts(c); };
  const toggleCmt = () => { if (!showCmt) loadCmts(); setShowCmt(s=>!s); };

  const addCmt = () => {
    if (!me) { openAuth(); return; }
    const txt = cmtText.trim(); if (!txt) return;
    const all = lsGet("wc_cmts_"+post.id)||[];
    const cmt = { id:uid(), text:txt, authorName:me.username, createdAt:new Date().toISOString() };
    const updated = [...all, cmt];
    lsSet("wc_cmts_"+post.id, updated);
    const posts = lsGet("wc_posts")||{};
    if (posts[post.id]) { posts[post.id].commentCount=updated.length; lsSet("wc_posts",posts); }
    setCmts(updated); setCmtText("");
  };

  const abtn = { display:"flex",alignItems:"center",gap:4,padding:"5px 9px",borderRadius:8,
    fontSize:13,color:S.muted,background:"transparent",border:"none",cursor:"pointer",
    fontFamily:"'DM Sans',sans-serif",transition:"all .15s" };

  return (
    <div className="fade-up"
      style={{background:S.surface,border:`1px solid ${hov?"#363942":S.border}`,borderRadius:12,marginBottom:12,overflow:"hidden",transition:"border-color .2s"}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{display:"flex"}}>
        {/* Vote */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 9px",gap:3,background:S.s2,minWidth:50}}>
          <button onClick={()=>me?onVote(post.id,1):openAuth()}
            style={{width:28,height:28,borderRadius:5,border:"none",background:"transparent",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,
              color:upvoted?ACCENT:S.muted,transition:"color .15s"}}>▲</button>
          <div style={{fontFamily:"'Syne',sans-serif",fontWeight:700,fontSize:13,color:S.text,lineHeight:1}}>{post.votes||0}</div>
          <button onClick={()=>me?onVote(post.id,-1):openAuth()}
            style={{width:28,height:28,borderRadius:5,border:"none",background:"transparent",cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,
              color:downvoted?S.red:S.muted,transition:"color .15s"}}>▼</button>
        </div>
        {/* Content */}
        <div style={{flex:1,padding:"12px 14px",minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:7,flexWrap:"wrap"}}>
            <Av name={post.authorName} size={22} fs={10} />
            <span style={{fontSize:13,fontWeight:500,color:S.text}}>u/{post.authorName}</span>
            <span style={{fontSize:12,color:S.muted}}>{timeAgo(post.createdAt)}</span>
            {post.flair && <span style={{fontSize:11,padding:"2px 7px",borderRadius:999,
              background:"rgba(59,130,246,.15)",color:ACCENT,fontWeight:600,textTransform:"uppercase",letterSpacing:".4px"}}>{post.flair}</span>}
          </div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:S.text,marginBottom:5,lineHeight:1.3}}>{post.title}</div>
          {post.body && <div style={{fontSize:14,color:S.dim,marginBottom:8,display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{post.body}</div>}
          {post.image && <img src={post.image} onClick={()=>onImg(post.image)}
            style={{width:"100%",maxHeight:360,objectFit:"cover",borderRadius:8,marginBottom:8,display:"block",cursor:"zoom-in"}} />}
          <div style={{display:"flex",alignItems:"center",gap:3,flexWrap:"wrap"}}>
            <button onClick={toggleCmt} style={abtn}
              onMouseEnter={e=>{e.currentTarget.style.background=S.s2;e.currentTarget.style.color=S.text;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=S.muted;}}>
              💬 {post.commentCount||0} Comments
            </button>
            {me && me.id===post.authorId && (
              <button onClick={()=>onDelete(post.id)} style={{...abtn,color:S.red}}
                onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,.1)"}
                onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                🗑️ Delete
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Comments section */}
      {showCmt && (
        <div style={{padding:"0 14px 14px",borderTop:`1px solid ${S.border}`}}>
          {me ? (
            <div style={{display:"flex",gap:9,alignItems:"flex-start",padding:"12px 0"}}>
              <Av name={me.username} size={26} fs={11} />
              <textarea value={cmtText} onChange={e=>setCmtText(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&e.ctrlKey)addCmt();}}
                placeholder="Write a comment… (Ctrl+Enter to send)"
                style={{flex:1,background:S.s2,border:`1px solid ${S.border}`,borderRadius:8,
                  padding:"8px 11px",color:S.text,fontSize:13,resize:"none",outline:"none",minHeight:38,
                  fontFamily:"'DM Sans',sans-serif"}}
                onFocus={e=>e.target.style.borderColor=ACCENT}
                onBlur={e=>e.target.style.borderColor=S.border} />
              <button onClick={addCmt} style={{padding:"7px 13px",background:ACCENT,color:"#fff",border:"none",
                borderRadius:8,fontSize:13,fontWeight:500,cursor:"pointer",marginTop:2,fontFamily:"'DM Sans',sans-serif"}}>Reply</button>
            </div>
          ) : (
            <div style={{padding:"11px 0",fontSize:13,color:S.muted}}>
              <span onClick={openAuth} style={{color:ACCENT,cursor:"pointer"}}>Log in</span> to comment
            </div>
          )}
          {cmts.length===0
            ? <div style={{fontSize:13,color:S.muted,padding:"4px 0"}}>No comments yet.</div>
            : cmts.map(c => (
                <div key={c.id} style={{padding:"9px 0",borderBottom:`1px solid ${S.border}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                    <Av name={c.authorName} size={22} fs={10} />
                    <span style={{fontSize:13,fontWeight:600,color:S.text}}>u/{c.authorName}</span>
                    <span style={{fontSize:12,color:S.muted}}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <div style={{fontSize:14,color:S.dim,lineHeight:1.5}}>{c.text}</div>
                </div>
              ))
          }
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
function App() {
  const [me,setMe]       = useState(()=>lsGet("wc_me"));
  const [posts,setPosts] = useState(()=>lsGet("wc_posts")||{});
  const [sort,setSort]   = useState("hot");
  const [q,setQ]         = useState("");
  const [authOpen,setAuthOpen]   = useState(false);
  const [postOpen,setPostOpen]   = useState(false);
  const [imgSrc,setImgSrc]       = useState(null);
  const [dropOpen,setDropOpen]   = useState(false);
  const dropRef = useRef();
  const { toasts, add:toast } = useToasts();

  useEffect(() => {
    const h = e => { if (!dropRef.current?.contains(e.target)) setDropOpen(false); };
    document.addEventListener("click", h); return () => document.removeEventListener("click", h);
  }, []);

  const handleAuth = user => { setMe(user); lsSet("wc_me", user); };
  const handleLogout = () => { setMe(null); lsSet("wc_me",null); toast("Logged out."); setDropOpen(false); };
  const handlePost = updated => setPosts({...updated});

  const handleVote = (postId, dir) => {
    const all = {...posts}; const post = all[postId]; if (!post) return;
    post.upvoters=post.upvoters||{}; post.downvoters=post.downvoters||{};
    const wu=!!post.upvoters[me.id], wd=!!post.downvoters[me.id];
    delete post.upvoters[me.id]; delete post.downvoters[me.id];
    if (dir===1&&!wu) post.upvoters[me.id]=true;
    if (dir===-1&&!wd) post.downvoters[me.id]=true;
    post.votes=Object.keys(post.upvoters).length-Object.keys(post.downvoters).length;
    lsSet("wc_posts",all); setPosts({...all});
  };

  const handleDelete = postId => {
    if (!confirm("Delete this post?")) return;
    const all = {...posts}; delete all[postId];
    lsSet("wc_posts",all); lsSet("wc_cmts_"+postId,[]);
    setPosts({...all}); toast("Post deleted.");
  };

  const getSorted = () => {
    let arr = Object.values(posts);
    if (q) arr = arr.filter(p=>p.title.toLowerCase().includes(q)||(p.body||"").toLowerCase().includes(q)||p.authorName.toLowerCase().includes(q));
    if (sort==="new") return arr.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    if (sort==="top") return arr.sort((a,b)=>(b.votes||0)-(a.votes||0));
    return arr.sort((a,b)=>{
      const ha=(Date.now()-new Date(a.createdAt))/3600000, hb=(Date.now()-new Date(b.createdAt))/3600000;
      return ((b.votes||0)/(hb+2))-((a.votes||0)/(ha+2));
    });
  };

  const postCount = Object.keys(posts).length;
  const userCount = Object.keys(lsGet("wc_users")||{}).length;
  const tagCounts = {}; Object.values(posts).forEach(p=>{if(p.flair)tagCounts[p.flair]=(tagCounts[p.flair]||0)+1;});
  const topTags = Object.entries(tagCounts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const sorted = getSorted();

  const sortBtnSt = s => ({ display:"flex",alignItems:"center",gap:4,padding:"6px 13px",borderRadius:999,
    fontSize:13,fontWeight:500,cursor:"pointer",border:"none",fontFamily:"'DM Sans',sans-serif",transition:"all .15s",
    color:sort===s?ACCENT:S.dim, background:sort===s?"rgba(59,130,246,.15)":"transparent" });

  return (
    <>
      {/* NAV */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(14,15,17,.92)",
        backdropFilter:"blur(16px)",borderBottom:`1px solid ${S.border}`,
        padding:"0 20px",height:58,display:"flex",alignItems:"center",justifyContent:"space-between",gap:14}}>
        <div onClick={()=>setQ("")} style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,
          color:S.text,display:"flex",alignItems:"center",gap:8,cursor:"pointer",flexShrink:0}}>
          <div style={{width:30,height:30,background:ACCENT,borderRadius:7,display:"flex",
            alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff"}}>W</div>
          wcommunity
        </div>

        <div className="search-col" style={{flex:1,maxWidth:360,position:"relative"}}>
          <svg style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:S.muted}}
            width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx={11} cy={11} r={8}/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input value={q} onChange={e=>setQ(e.target.value.toLowerCase())} placeholder="Search posts…"
            style={{width:"100%",background:S.s2,border:`1px solid ${S.border}`,borderRadius:999,
              padding:"7px 14px 7px 36px",color:S.text,fontSize:14,outline:"none"}}
            onFocus={e=>e.target.style.borderColor=ACCENT}
            onBlur={e=>e.target.style.borderColor=S.border} />
        </div>

        <div style={{display:"flex",alignItems:"center",gap:9,flexShrink:0}}>
          {me ? (
            <>
              <Btn primary sm onClick={()=>setPostOpen(true)}>+ Post</Btn>
              <div ref={dropRef} style={{position:"relative"}}>
                <div onClick={()=>setDropOpen(d=>!d)} style={{cursor:"pointer"}}>
                  <Av name={me.username} size={32} fs={13} />
                </div>
                {dropOpen && (
                  <div style={{position:"absolute",top:"calc(100% + 8px)",right:0,background:S.surface,
                    border:`1px solid ${S.border}`,borderRadius:12,minWidth:170,padding:7,
                    boxShadow:"0 8px 28px rgba(0,0,0,.4)",zIndex:300}}>
                    <div style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",color:S.dim,fontSize:14}}>👤 {me.username}</div>
                    <div style={{height:1,background:S.border,margin:"5px 0"}} />
                    <div onClick={handleLogout} style={{display:"flex",alignItems:"center",gap:9,padding:"8px 11px",
                      borderRadius:8,color:S.red,fontSize:14,cursor:"pointer"}}
                      onMouseEnter={e=>e.currentTarget.style.background="rgba(239,68,68,.1)"}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      🚪 Log Out
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Btn sm onClick={()=>setAuthOpen(true)}>Log In</Btn>
              <Btn primary sm onClick={()=>setAuthOpen(true)}>Register</Btn>
            </>
          )}
        </div>
      </nav>

      {/* LAYOUT */}
      <div style={{maxWidth:1080,margin:"0 auto",padding:"22px 18px",display:"grid",
        gridTemplateColumns:"1fr 285px",gap:20,alignItems:"start"}}>

        {/* FEED */}
        <main>
          {/* Create bar */}
          <div onClick={()=>me?setPostOpen(true):setAuthOpen(true)}
            style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,
              padding:"11px 13px",display:"flex",alignItems:"center",gap:10,marginBottom:16,cursor:"pointer",transition:"border-color .2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=ACCENT}
            onMouseLeave={e=>e.currentTarget.style.borderColor=S.border}>
            <Av name={me?.username||"?"} size={36} fs={15} />
            <div style={{flex:1,background:S.s2,border:`1px solid ${S.border}`,borderRadius:8,
              padding:"8px 13px",color:S.muted,fontSize:14,pointerEvents:"none"}}>What's on your mind?</div>
            <Btn sm>📷 Photo</Btn>
            <Btn primary sm>Post</Btn>
          </div>

          {/* Sort */}
          <div style={{display:"flex",gap:5,marginBottom:14}}>
            {[["hot","🔥 Hot"],["new","✨ New"],["top","⬆️ Top"]].map(([s,label])=>(
              <button key={s} onClick={()=>setSort(s)} style={sortBtnSt(s)}>{label}</button>
            ))}
          </div>

          {/* Search notice */}
          {q && (
            <div style={{background:"rgba(59,130,246,.1)",border:"1px solid rgba(59,130,246,.2)",
              borderRadius:8,padding:"9px 13px",fontSize:13,color:ACCENT,marginBottom:12,
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>🔍 Results for "<strong>{q}</strong>"</span>
              <span onClick={()=>setQ("")} style={{cursor:"pointer",fontWeight:600}}>Clear</span>
            </div>
          )}

          {/* Posts */}
          {sorted.length===0 ? (
            <div style={{textAlign:"center",padding:"56px 18px",color:S.muted}}>
              <div style={{fontSize:44,marginBottom:12,opacity:.45}}>{q?"🔍":"📭"}</div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:700,color:S.dim,marginBottom:5}}>
                {q?"No posts found":"No posts yet"}
              </div>
              <div style={{fontSize:13}}>{q?"Try a different term.":"Be the first to share something!"}</div>
              {!q && me && <Btn primary style={{marginTop:16}} onClick={()=>setPostOpen(true)}>+ Create Post</Btn>}
            </div>
          ) : sorted.map(post=>(
            <PostCard key={post.id} post={post} me={me}
              onVote={handleVote} onDelete={handleDelete}
              onImg={setImgSrc} openAuth={()=>setAuthOpen(true)} toast={toast} />
          ))}
        </main>

        {/* SIDEBAR */}
        <aside className="sidebar-col" style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#3b82f6,#6366f1)",height:60}} />
            <div style={{padding:14}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:800,marginBottom:5}}>wcommunity</div>
              <div style={{fontSize:13,color:S.dim,lineHeight:1.5,marginBottom:12}}>
                Share anything — memes, stories, photos, questions.{" "}
                <span style={{width:7,height:7,borderRadius:"50%",background:S.green,display:"inline-block",boxShadow:`0 0 5px ${S.green}`}} />
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14,paddingTop:12,borderTop:`1px solid ${S.border}`}}>
                {[["Members",userCount],["Posts",postCount]].map(([lbl,val])=>(
                  <div key={lbl} style={{textAlign:"center"}}>
                    <div style={{fontFamily:"'Syne',sans-serif",fontWeight:800,fontSize:19,color:ACCENT}}>{val}</div>
                    <div style={{fontSize:12,color:S.muted,textTransform:"uppercase",letterSpacing:".4px"}}>{lbl}</div>
                  </div>
                ))}
              </div>
              <Btn primary full onClick={()=>me?setPostOpen(true):setAuthOpen(true)}>+ Create Post</Btn>
            </div>
          </div>

          <div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"13px 15px",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,borderBottom:`1px solid ${S.border}`}}>📋 Rules</div>
            <div style={{padding:14}}>
              {["Be kind","No spam","Keep it relevant","No hate speech","Have fun!"].map((r,i)=>(
                <div key={i} style={{display:"flex",gap:9,padding:"7px 0",fontSize:13,color:S.dim,borderBottom:i<4?`1px solid ${S.border}`:"none"}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:"rgba(59,130,246,.15)",
                    color:ACCENT,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                  {r}
                </div>
              ))}
            </div>
          </div>

          <div style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,overflow:"hidden"}}>
            <div style={{padding:"13px 15px",fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,borderBottom:`1px solid ${S.border}`}}>🏷️ Topics</div>
            <div style={{padding:14}}>
              {topTags.length===0
                ? <span style={{fontSize:13,color:S.muted}}>No tags yet</span>
                : <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                    {topTags.map(([tag,count])=>(
                      <button key={tag} onClick={()=>setQ(tag.toLowerCase())}
                        style={{padding:"4px 11px",borderRadius:999,border:`1px solid ${S.border}`,fontSize:13,
                          color:S.dim,cursor:"pointer",background:"transparent",fontFamily:"'DM Sans',sans-serif",transition:"all .15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor=ACCENT;e.currentTarget.style.color=ACCENT;e.currentTarget.style.background="rgba(59,130,246,.1)";}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor=S.border;e.currentTarget.style.color=S.dim;e.currentTarget.style.background="transparent";}}>
                        {tag} <span style={{opacity:.5,fontSize:11}}>{count}</span>
                      </button>
                    ))}
                  </div>
              }
            </div>
          </div>
        </aside>
      </div>

      {/* Modals */}
      <AuthModal open={authOpen} onClose={()=>setAuthOpen(false)} onAuth={handleAuth} toast={toast} />
      <CreatePostModal open={postOpen} onClose={()=>setPostOpen(false)} me={me} onPost={handlePost} toast={toast} />

      {/* Image fullscreen */}
      {imgSrc && (
        <div onClick={()=>setImgSrc(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",
          backdropFilter:"blur(4px)",zIndex:600,display:"flex",alignItems:"center",justifyContent:"center",padding:20,cursor:"zoom-out"}}>
          <img src={imgSrc} style={{maxWidth:"100%",maxHeight:"90vh",borderRadius:12,objectFit:"contain"}} />
        </div>
      )}

      {/* Toasts */}
      <div style={{position:"fixed",bottom:22,right:22,zIndex:1000,display:"flex",flexDirection:"column",gap:8}}>
        {toasts.map(t=>(
          <div key={t.id} style={{background:S.surface,border:`1px solid ${S.border}`,borderRadius:12,
            padding:"11px 16px",fontSize:14,color:S.text,boxShadow:"0 6px 20px rgba(0,0,0,.4)",
            display:"flex",alignItems:"center",gap:9,animation:"tin .25s ease"}}>{t.msg}</div>
        ))}
      </div>
    </>
  );
}

// Mount
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
