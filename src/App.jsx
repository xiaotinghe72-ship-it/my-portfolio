import { useState, useRef, useEffect, createContext, useContext } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref as dbRef, set as dbSet, get as dbGet } from "firebase/database";

var FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Noto+Sans+SC:wght@300;400;500;700&display=swap";

/* ─── Firebase ─── */
var firebaseApp = initializeApp({
  apiKey: "AIzaSyBOkDCFpaQHRxduu5B8OOf4y5w1R6wyRMs",
  authDomain: "my-portfolio-f7c01.firebaseapp.com",
  databaseURL: "https://my-portfolio-f7c01-default-rtdb.firebaseio.com",
  projectId: "my-portfolio-f7c01",
  storageBucket: "my-portfolio-f7c01.firebasestorage.app",
  messagingSenderId: "791030615772",
  appId: "1:791030615772:web:612ce81e18d7b776d02e19"
});
var db = getDatabase(firebaseApp);
var DB_PATH = "portfolio";

function load() {
  return dbGet(dbRef(db, DB_PATH)).then(function (snapshot) {
    return snapshot.exists() ? snapshot.val() : null;
  }).catch(function () { return null; });
}
function persist(d) {
  dbSet(dbRef(db, DB_PATH), d).catch(function (e) { console.error("Firebase write failed:", e); });
}

/* ─── Cloudinary ─── */
var CLD_CLOUD = "dr4sochhz";
var CLD_PRESET = "portfolio_upload";
var CLD_URL = "https://api.cloudinary.com/v1_1/" + CLD_CLOUD + "/image/upload";
var CHUNK_SIZE = 6 * 1024 * 1024; // 6MB chunks

function uploadToCloudinary(file) {
  // Small files — direct upload
  if (file.size <= CHUNK_SIZE) {
    var fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLD_PRESET);
    return fetch(CLD_URL, { method: "POST", body: fd })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.secure_url) return d.secure_url;
        throw new Error(d.error ? d.error.message : "Upload failed");
      });
  }

  // Large files — chunked upload
  var totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  var uploadId = "portfolio_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);

  function uploadChunk(index) {
    var start = index * CHUNK_SIZE;
    var end = Math.min(start + CHUNK_SIZE, file.size);
    var chunk = file.slice(start, end);
    var contentRange = "bytes " + start + "-" + (end - 1) + "/" + file.size;

    var fd = new FormData();
    fd.append("file", chunk);
    fd.append("upload_preset", CLD_PRESET);

    return fetch(CLD_URL, {
      method: "POST",
      headers: {
        "X-Unique-Upload-Id": uploadId,
        "Content-Range": contentRange,
      },
      body: fd,
    }).then(function (r) {
      // Last chunk returns 200 with final JSON, intermediate return 308
      if (r.status === 200 || r.status === 201) return r.json();
      if (r.status === 308) {
        // Continue — upload next chunk
        return uploadChunk(index + 1);
      }
      return r.json().then(function (d) {
        throw new Error(d.error ? d.error.message : "Chunk upload failed (status " + r.status + ")");
      });
    }).then(function (d) {
      if (d && d.secure_url) return d.secure_url;
      // Intermediate 308 already recursed, so if we get here without secure_url, keep going
      if (index + 1 < totalChunks) return uploadChunk(index + 1);
      throw new Error("Upload completed but no URL returned");
    });
  }

  return uploadChunk(0);
}

var _id = Date.now();
function uid() { _id += 1; return _id + "_" + Math.random().toString(36).slice(2, 7); }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : ""; }
function fmtTime(d) { return d ? new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : ""; }

/* ─── Theme ─── */
var C = {
  bg: "#0c0f14", surface: "#12151c", card: "#161a23", hover: "#1c2029",
  accent: "#c8b07c", accentDim: "rgba(200,176,124,0.08)", accentBorder: "rgba(200,176,124,0.15)",
  text: "#e2dfd8", sub: "rgba(226,223,216,0.45)", faint: "rgba(226,223,216,0.2)", divider: "rgba(226,223,216,0.06)",
};
var F = { h: "'Syne', sans-serif", b: "'DM Sans', 'Noto Sans SC', sans-serif" };

/* ─── i18n ─── */
var dict = {
  en: {
    about: "About", manage: "Manage", add: "Add", save: "Save", cancel: "Cancel",
    edit: "Edit", removed: "Removed", moved: "Moved", saved: "Saved", updated: "Updated", added: "Added",
    newPhoto: "New Photo", editPhoto: "Edit", image: "Image", title: "Title", dateTaken: "Date Taken",
    description: "Description", clickUpload: "Click to upload", change: "Change",
    sections: "Sections", addSection: "Add Section", moveTo: "Move to",
    photos: "photos", photo: "photo", collections: "collections", collection: "collection",
    setupProfile: "Set Up", editProfile: "Edit",
    aboutPrompt: "Add a portrait and write something about yourself",
    textPlaceholder: "Write anything here. Your name, your story, a poem, a single line.",
    portrait: "Portrait", text: "Text", uploadPortrait: "Upload a portrait",
    addFirstPhoto: "Add your first photo", noSections: "No sections",
    noSectionsHint: "Click \"Manage\" to create one", clickToEdit: "Click to edit",
    photoPlaceholder: "A few words about this moment...", untitled: "Untitled",
    all: "All", subsections: "Subsections", addSub: "Add subsection", subName: "Name",
    subsection: "Subsection", none: "General", manageSubs: "Subsections",
    bulkAdd: "Bulk Upload", bulkMove: "Move Selected", selectAll: "All", deselectAll: "Deselect",
    moveTo: "Move to", uploading: "Uploading", of: "of", done: "Done", cancel: "Cancel",
    bulkMoved: "Photos moved",
    addSubSub: "Add sub-subsection", subSubsection: "Sub-subsection",
  },
  cn: {
    about: "\u5173\u4e8e", manage: "\u7ba1\u7406", add: "\u6dfb\u52a0", save: "\u4fdd\u5b58", cancel: "\u53d6\u6d88",
    edit: "\u7f16\u8f91", removed: "\u5df2\u5220\u9664", moved: "\u5df2\u79fb\u52a8", saved: "\u5df2\u4fdd\u5b58", updated: "\u5df2\u66f4\u65b0", added: "\u5df2\u6dfb\u52a0",
    newPhoto: "\u65b0\u7167\u7247", editPhoto: "\u7f16\u8f91", image: "\u56fe\u7247", title: "\u6807\u9898", dateTaken: "\u62cd\u6444\u65e5\u671f",
    description: "\u63cf\u8ff0", clickUpload: "\u70b9\u51fb\u4e0a\u4f20", change: "\u66f4\u6362",
    sections: "\u5206\u7ec4", addSection: "\u6dfb\u52a0\u5206\u7ec4", moveTo: "\u79fb\u52a8\u5230",
    photos: "\u5f20\u7167\u7247", photo: "\u5f20\u7167\u7247", collections: "\u4e2a\u5206\u7ec4", collection: "\u4e2a\u5206\u7ec4",
    setupProfile: "\u8bbe\u7f6e", editProfile: "\u7f16\u8f91",
    aboutPrompt: "\u6dfb\u52a0\u4e00\u5f20\u8096\u50cf\uff0c\u5199\u70b9\u4ec0\u4e48\u5173\u4e8e\u4f60\u81ea\u5df1",
    textPlaceholder: "\u5728\u8fd9\u91cc\u5199\u4efb\u4f55\u4e1c\u897f\u3002",
    portrait: "\u8096\u50cf", text: "\u6587\u5b57", uploadPortrait: "\u4e0a\u4f20\u8096\u50cf",
    addFirstPhoto: "\u6dfb\u52a0\u7b2c\u4e00\u5f20\u7167\u7247", noSections: "\u6682\u65e0\u5206\u7ec4",
    noSectionsHint: "\u70b9\u51fb\u201c\u7ba1\u7406\u201d\u6765\u521b\u5efa", clickToEdit: "\u70b9\u51fb\u7f16\u8f91",
    photoPlaceholder: "\u5173\u4e8e\u8fd9\u4e2a\u77ac\u95f4\u7684\u51e0\u53e5\u8bdd\u2026", untitled: "\u65e0\u6807\u9898",
    all: "\u5168\u90e8", subsections: "\u5b50\u5206\u7ec4", addSub: "\u6dfb\u52a0\u5b50\u5206\u7ec4", subName: "\u540d\u79f0",
    subsection: "\u5b50\u5206\u7ec4", none: "\u672a\u5206\u7ec4", manageSubs: "\u5b50\u5206\u7ec4",
  },
};
var LangCtx = createContext("en");
function useT() { return dict[useContext(LangCtx)] || dict.en; }

/* ─── Icons ─── */
function Ic(props) {
  var s = props.s || 18, c = props.c || "currentColor";
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d={props.d} />
    </svg>
  );
}
function Plus() { return <Ic d="M12 5v14M5 12h14" />; }
function Trash() { return <Ic d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />; }
function Edit() { return <Ic d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />; }
function Upload() { return <Ic d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />; }
function ImgIc() { return <Ic d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zM8.5 10a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM21 15l-5-5L5 21" />; }
function XIcon() { return <Ic d="M18 6L6 18M6 6l12 12" />; }
function MoveIc() { return <Ic d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />; }
function Folder() { return <Ic d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />; }
function Camera() { return <Ic d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2zM12 17a4 4 0 100-8 4 4 0 000 8z" />; }
function ChevUp() { return <Ic d="M18 15l-6-6-6 6" />; }
function ChevDown() { return <Ic d="M6 9l6 6 6-6" />; }
function ArrowL() { return <Ic d="M19 12H5M12 19l-7-7 7-7" />; }
function ArrowR() { return <Ic d="M5 12h14M12 5l7 7-7 7" />; }
function Globe() { return <Ic d="M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />; }
function TagIc() { return <Ic d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01" />; }

/* ─── Shared ─── */
var inputStyle = { width: "100%", padding: "10px 14px", background: C.accentDim, border: "1px solid " + C.divider, borderRadius: 6, color: C.text, fontFamily: F.b, fontSize: 14, outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" };
var labelStyle = { fontFamily: F.b, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: C.sub, marginBottom: 6, display: "block", fontWeight: 500 };

/* ─── Toast ─── */
function Toast(props) {
  useEffect(function () { var t = setTimeout(props.onDone, 2000); return function () { clearTimeout(t); }; }, [props.onDone]);
  return ( <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: C.text, color: C.bg, padding: "10px 24px", borderRadius: 4, fontSize: 13, fontFamily: F.b, fontWeight: 500, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)", animation: "toastIn .3s ease" }}>{props.msg}</div> );
}

/* ─── Lightbox ─── */
function Lightbox(props) {
  var photo = props.photo, photos = props.photos, onClose = props.onClose, onNav = props.onNav;
  var idx = photos.findIndex(function (p) { return p.id === photo.id; });
  var hasPrev = idx > 0, hasNext = idx < photos.length - 1;
  useEffect(function () {
    function h(e) { if (e.key === "Escape") onClose(); if (e.key === "ArrowLeft" && hasPrev) onNav(photos[idx - 1]); if (e.key === "ArrowRight" && hasNext) onNav(photos[idx + 1]); }
    window.addEventListener("keydown", h);
    return function () { window.removeEventListener("keydown", h); };
  }, [onClose, onNav, photos, idx, hasPrev, hasNext]);
  var nb = { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: C.sub, cursor: "pointer", padding: 12, transition: "color 0.2s", zIndex: 10 };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 8000, background: "rgba(8,10,14,0.96)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .25s ease" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 24, right: 28, background: "transparent", border: "none", color: C.sub, cursor: "pointer", zIndex: 10 }}><XIcon /></button>
      {hasPrev && <button onClick={function (e) { e.stopPropagation(); onNav(photos[idx - 1]); }} style={{ ...nb, left: 20 }}><ArrowL /></button>}
      {hasNext && <button onClick={function (e) { e.stopPropagation(); onNav(photos[idx + 1]); }} style={{ ...nb, right: 20 }}><ArrowR /></button>}
      <div onClick={function (e) { e.stopPropagation(); }} style={{ maxWidth: "85vw", maxHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center", cursor: "default" }}>
        <img src={photo.src} alt={photo.title || ""} style={{ maxWidth: "85vw", maxHeight: "74vh", objectFit: "contain", animation: "fadeIn .2s ease" }} />
        <div style={{ marginTop: 20, textAlign: "center", maxWidth: 560 }}>
          {photo.title && <div style={{ fontFamily: F.h, fontSize: 18, fontWeight: 600, color: C.text }}>{photo.title}</div>}
          {photo.date && <div style={{ fontFamily: F.b, fontSize: 11, color: C.sub, marginTop: 6, letterSpacing: "0.08em" }}>{fmtDate(photo.date)} &middot; {fmtTime(photo.date)}</div>}
          {photo.description && <div style={{ fontFamily: F.b, fontSize: 13, color: C.sub, marginTop: 10, lineHeight: 1.8, fontWeight: 300, fontStyle: "italic" }}>{photo.description}</div>}
        </div>
        <div style={{ fontFamily: F.b, fontSize: 11, color: C.faint, marginTop: 14 }}>{idx + 1} / {photos.length}</div>
      </div>
    </div>
  );
}

/* ─── Photo Card ─── */
function PhotoCard(props) {
  var photo = props.photo, sections = props.sections, currentSection = props.currentSection;
  var [hov, setHov] = useState(false);
  var [showMove, setShowMove] = useState(false);
  var t = useT();
  return (
    <div onMouseEnter={function () { setHov(true); }} onMouseLeave={function () { setHov(false); setShowMove(false); }}
      style={{ position: "relative", borderRadius: 4, overflow: "hidden", cursor: "pointer", animation: "cardIn .5s ease backwards" }}>
      <div onClick={function () { props.onView(photo); }} style={{ position: "relative", overflow: "hidden", background: C.card }}>
        <img src={photo.src} alt={photo.title || ""} onLoad={function(e) { if (props.onDims) props.onDims(e.target.naturalWidth, e.target.naturalHeight); }} style={{ width: "100%", height: "auto", display: "block", transition: "transform .6s cubic-bezier(.25,.46,.45,.94)", transform: hov ? "scale(1.04)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: hov ? "linear-gradient(to top, rgba(12,15,20,0.82) 0%, rgba(12,15,20,0.2) 50%, transparent 100%)" : "linear-gradient(to top, rgba(12,15,20,0.3) 0%, transparent 30%)", transition: "all .4s ease" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 18px", transform: hov ? "translateY(0)" : "translateY(6px)", opacity: hov ? 1 : 0, transition: "all .35s ease" }}>
          {photo.title && <div style={{ fontFamily: F.h, color: C.text, fontSize: 15, fontWeight: 600 }}>{photo.title}</div>}
          {photo.date && <div style={{ fontFamily: F.b, color: "rgba(226,223,216,0.55)", fontSize: 11, marginTop: 4 }}>{fmtDate(photo.date)}</div>}
          {photo.description && <div style={{ fontFamily: F.b, color: "rgba(226,223,216,0.4)", fontSize: 12, marginTop: 6, lineHeight: 1.6, fontWeight: 300, fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{photo.description}</div>}
        </div>
      </div>
      <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 4, opacity: hov ? 1 : 0, transition: "opacity .25s" }}>
        {[{ icon: <Edit />, fn: function () { props.onEdit(photo); } }, { icon: <MoveIc />, fn: function () { setShowMove(!showMove); } }, { icon: <Trash />, fn: function () { props.onDelete(photo.id); } }].map(function (b, i) {
          return ( <button key={i} onClick={function (e) { e.stopPropagation(); b.fn(); }} style={{ width: 28, height: 28, borderRadius: 3, border: "none", background: "rgba(12,15,20,0.6)", backdropFilter: "blur(6px)", color: C.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "color .2s", fontSize: 0 }} onMouseEnter={function (e) { e.currentTarget.style.color = C.text; }} onMouseLeave={function (e) { e.currentTarget.style.color = C.sub; }}>{b.icon}</button> );
        })}
      </div>
      {showMove && (
        <div onClick={function (e) { e.stopPropagation(); }} style={{ position: "absolute", top: 42, right: 8, background: C.surface, borderRadius: 6, padding: 4, minWidth: 160, zIndex: 10, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", border: "1px solid " + C.divider }}>
          <div style={{ padding: "6px 12px", fontSize: 10, color: C.sub, fontFamily: F.b, textTransform: "uppercase", letterSpacing: "0.1em" }}>{t.moveTo}</div>
          {sections.filter(function (s) { return s.id !== currentSection; }).map(function (s) {
            return ( <button key={s.id} onClick={function () { props.onMove(photo.id, s.id); setShowMove(false); }} style={{ display: "block", width: "100%", padding: "7px 12px", background: "transparent", border: "none", color: C.text, fontFamily: F.b, fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4 }}>{s.name}</button> );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── SubpathLevel — one level of the recursive picker (proper component so hooks are legal) ─── */
function SubpathLevel(props) {
  var nodes = props.nodes || [];
  var depth = props.depth || 0;
  var selectedId = props.selectedId || "";
  var t = useT();
  var [adding, setAdding] = useState(false);
  var [newName, setNewName] = useState("");

  function commit() {
    var name = newName.trim();
    if (!name) return;
    var newId = props.onCreateChild(props.parentId, name);
    props.onSelect(newId);
    setNewName(""); setAdding(false);
  }

  var selectedNode = nodes.find(function(n){ return n.id === selectedId; });

  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ ...labelStyle, marginTop: depth > 0 ? 8 : 0 }}>
        {depth === 0 ? t.subsection : "↳ Level " + (depth + 1)}
      </label>
      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
        {adding ? (
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            <input autoFocus value={newName} onChange={function(e){ setNewName(e.target.value); }}
              onKeyDown={function(e){ if(e.key==="Enter") commit(); if(e.key==="Escape"){ setAdding(false); setNewName(""); } }}
              placeholder="Name..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={commit} style={{ padding:"8px 14px", background:C.text, border:"none", borderRadius:6, color:C.bg, fontFamily:F.b, fontSize:12, fontWeight:500, cursor:"pointer", whiteSpace:"nowrap" }}>Add</button>
            <button onClick={function(){ setAdding(false); setNewName(""); }} style={{ padding:"8px 10px", background:"transparent", border:"1px solid "+C.divider, borderRadius:6, color:C.sub, fontFamily:F.b, fontSize:12, cursor:"pointer" }}>✕</button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            <select value={selectedId} onChange={function(e){ props.onSelect(e.target.value || ""); }}
              style={{ ...inputStyle, flex: 1, appearance: "auto" }}>
              <option value="">— {t.none} —</option>
              {nodes.map(function(n){ return <option key={n.id} value={n.id}>{n.name}</option>; })}
            </select>
            <button onClick={function(){ setAdding(true); }} title="New"
              style={{ padding:"8px 10px", background:C.accentDim, border:"1px solid "+C.accentBorder, borderRadius:6, color:C.accent, cursor:"pointer", fontSize:0, flexShrink:0 }}><Plus /></button>
          </div>
        )}
      </div>
      {selectedNode && (
        <SubpathLevel
          nodes={selectedNode.children || []}
          depth={depth + 1}
          parentId={selectedNode.id}
          selectedId={props.childSelectedId || ""}
          onSelect={props.onChildSelect}
          onChildSelect={props.onGrandchildSelect}
          onGrandchildSelect={function(){}}
          onCreateChild={props.onCreateChild}
        />
      )}
    </div>
  );
}

/* ─── SubpathPicker — unlimited depth entry point ─── */
function SubpathPicker(props) {
  var sectionChildren = props.sectionChildren || [];
  var nodeId = props.nodeId || "";
  var path = nodeId ? (getPath(sectionChildren, nodeId) || []) : [];

  function handleSelectLevel0(id) {
    props.onNodeChange(id);
  }
  function handleSelectLevel1(id) {
    props.onNodeChange(id);
  }
  function handleSelectLevel2(id) {
    props.onNodeChange(id);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <SubpathLevel
        nodes={sectionChildren}
        depth={0}
        parentId={props.sectionId}
        selectedId={path[0] || ""}
        onSelect={handleSelectLevel0}
        childSelectedId={path[1] || ""}
        onChildSelect={handleSelectLevel1}
        onGrandchildSelect={handleSelectLevel2}
        onCreateChild={props.onCreateChild}
      />
    </div>
  );
}


/* ─── Photo Editor (with subsection selector) ─── */
function PhotoEditor(props) {
  var photo = props.photo || {};
  var subsections = props.subsections || [];
  var [title, setTitle] = useState(photo.title || "");
  var [desc, setDesc] = useState(photo.description || "");
  var [date, setDate] = useState(photo.date || "");
  var [src, setSrc] = useState(photo.src || "");
  var [nodeId, setNodeId] = useState(photo.nodeId || "");
  var [uploading, setUploading] = useState(false);
  var [dragOver, setDragOver] = useState(false);
  var fr = useRef();
  var t = useT();
  function processFile(f) {
    if (!f) return;
    if (!date) setDate(new Date(f.lastModified).toISOString().slice(0, 16));
    setUploading(true); setSrc("uploading");
    prepareAndUpload(f).then(function (url) { setSrc(url); setUploading(false); }).catch(function () { alert("Upload failed. Please try again."); setSrc(""); setUploading(false); });
  }
  function handleFile(e) { processFile(e.target.files && e.target.files[0]); }
  function handleSave() { if (!src) return; props.onSave({ ...photo, id: photo.id || uid(), title: title, description: desc, date: date, src: src, nodeId: nodeId }); }
  return (
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 7000, background: "rgba(8,10,14,0.9)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .2s ease" }}>
      <div onClick={function (e) { e.stopPropagation(); }} style={{ background: C.surface, borderRadius: 10, padding: 28, width: "90vw", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", border: "1px solid " + C.divider, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontFamily: F.h, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>{photo.id ? t.editPhoto : t.newPhoto}</h3>
          <button onClick={props.onClose} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer" }}><XIcon /></button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>{t.image}</label>
          {uploading ? (
            <div style={{ border: "1px solid " + C.divider, borderRadius: 6, padding: "40px 20px", textAlign: "center", background: C.accentDim }}>
              <div style={{ fontFamily: F.b, color: C.sub, fontSize: 13 }}>Uploading...</div>
            </div>
          ) : src ? (
            <div style={{ position: "relative", borderRadius: 6, overflow: "hidden", marginBottom: 6 }}>
              <img src={src} alt="" style={{ width: "100%", maxHeight: 240, objectFit: "cover", borderRadius: 6, display: "block" }} />
              <button onClick={function () { fr.current && fr.current.click(); }} style={{ position: "absolute", bottom: 8, right: 8, padding: "5px 12px", background: "rgba(12,15,20,0.75)", border: "none", borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 12, cursor: "pointer" }}>{t.change}</button>
            </div>
          ) : (
            <div
              onClick={function () { fr.current && fr.current.click(); }}
              onDragOver={function (e) { e.preventDefault(); setDragOver(true); }}
              onDragLeave={function () { setDragOver(false); }}
              onDrop={function (e) { e.preventDefault(); setDragOver(false); var f = e.dataTransfer.files && e.dataTransfer.files[0]; if (f) processFile(f); }}
              style={{ border: "1px dashed " + (dragOver ? C.accent : C.faint), borderRadius: 6, padding: "40px 20px", textAlign: "center", cursor: "pointer", background: dragOver ? C.accentDim : "transparent", transition: "all .2s" }}>
              <div style={{ color: dragOver ? C.accent : C.sub, marginBottom: 8 }}><Upload /></div>
              <div style={{ fontFamily: F.b, color: dragOver ? C.accent : C.sub, fontSize: 13 }}>{dragOver ? "Drop to upload" : t.clickUpload}</div>
              <div style={{ fontFamily: F.b, color: C.faint, fontSize: 11, marginTop: 6 }}>or drag a photo here</div>
            </div>
          )}
          <input ref={fr} type="file" accept="image/*,.heic,.heif,.HEIC,.HEIF" onChange={handleFile} style={{ display: "none" }} />
        </div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t.title}</label><input value={title} onChange={function (e) { setTitle(e.target.value); }} placeholder={t.untitled} style={inputStyle} /></div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t.dateTaken}</label><input type="datetime-local" value={date} onChange={function (e) { setDate(e.target.value); }} style={{ ...inputStyle, colorScheme: "dark" }} /></div>
        {/* ── Inline subsection path builder ── */}
        {props.sectionId && props.sectionChildren && (
          <SubpathPicker
            sectionId={props.sectionId}
            sectionChildren={props.sectionChildren}
            nodeId={nodeId}
            onNodeChange={function(v){ setNodeId(v); }}
            onCreateChild={props.onCreateChild}
          />
        )}
        <div style={{ marginBottom: 24 }}><label style={labelStyle}>{t.description}</label><textarea value={desc} onChange={function (e) { setDesc(e.target.value); }} placeholder={t.photoPlaceholder} rows={3} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }} /></div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={props.onClose} style={{ padding: "8px 18px", background: "transparent", border: "1px solid " + C.divider, borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 13, cursor: "pointer" }}>{t.cancel}</button>
          <button onClick={handleSave} disabled={!src || uploading || src === "uploading"} style={{ padding: "8px 20px", background: (src && !uploading && src !== "uploading") ? C.text : "rgba(226,223,216,0.1)", border: "none", borderRadius: 4, color: (src && !uploading && src !== "uploading") ? C.bg : C.faint, fontFamily: F.b, fontSize: 13, fontWeight: 500, cursor: (src && !uploading && src !== "uploading") ? "pointer" : "not-allowed" }}>{uploading ? "Uploading..." : t.save}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Recursive tree node list for SectionManager ─── */
function TreeNodeList(props) {
  var nodes = props.nodes || [];
  var depth = props.depth || 0;
  var t = props.t;
  return (
    <div>
      {nodes.map(function(node) {
        var isTarget = props.dragOver && props.dragOver.nodeId === node.id;
        return (
          <div key={node.id} style={{ marginBottom: 2 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 4px", borderRadius: 4, background: isTarget ? "rgba(200,176,124,0.1)" : "transparent", border: isTarget ? ("1px dashed " + C.accent) : "1px solid transparent", transition: "all .15s" }}
              draggable
              onDragStart={function(e){ e.stopPropagation(); props.setDrag({ nodeId: node.id }); }}
              onDragEnd={function(){ props.setDrag(null); props.setDragOver(null); }}
              onDragOver={function(e){ e.preventDefault(); e.stopPropagation(); if(props.drag && props.drag.nodeId !== node.id) props.setDragOver({ nodeId: node.id }); }}
              onDragLeave={function(e){ e.stopPropagation(); props.setDragOver(null); }}
              onDrop={function(e){ e.stopPropagation(); props.onDrop(node.id, false); }}>
              <span style={{ cursor: "grab", color: C.faint, fontSize: 11, lineHeight: 1 }}>⠿</span>
              {depth > 0 && <span style={{ color: C.faint, opacity: 0.4, fontSize: 9, flexShrink: 0 }}>{"—".repeat(depth)}</span>}
              <input value={node.name} onChange={function(e){ props.onRename(node.id, e.target.value, false); }}
                onClick={function(e){ e.stopPropagation(); }}
                style={{ flex: 1, padding: "2px 6px", background: "transparent", border: "1px solid transparent", borderRadius: 3, color: depth === 0 ? C.sub : C.faint, fontFamily: F.b, fontSize: depth === 0 ? 13 : 12, outline: "none" }}
                onFocus={function(e){ e.target.style.borderColor = C.divider; }}
                onBlur={function(e){ e.target.style.borderColor = "transparent"; }} />
              <button onClick={function(){ props.onAdd(node.id, false); }} title="Add child" style={{ background: "transparent", border: "none", color: C.faint, cursor: "pointer", padding: 0, fontSize: 0, opacity: 0.5 }}><Ic d="M12 5v14M5 12h14" s={13} /></button>
              <button onClick={function(){ props.onRemove(node.id); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: 0.25, padding: 0, fontSize: 0 }}><Ic d="M18 6L6 18M6 6l12 12" s={13} /></button>
            </div>
            {(node.children || []).length > 0 && (
              <div style={{ marginLeft: 16 }}>
                <TreeNodeList nodes={node.children} depth={depth + 1} parentId={node.id} parentIsSection={false}
                  drag={props.drag} dragOver={props.dragOver} setDrag={props.setDrag} setDragOver={props.setDragOver}
                  onAdd={props.onAdd} onRemove={props.onRemove} onRename={props.onRename} onDrop={props.onDrop} t={t} />
              </div>
            )}
          </div>
        );
      })}
      <button onClick={function(){ props.onAdd(props.parentId, props.parentIsSection); }}
        style={{ background: "transparent", border: "none", color: C.faint, fontFamily: F.b, fontSize: 11, cursor: "pointer", padding: "3px 4px", display: "flex", alignItems: "center", gap: 3, opacity: 0.55, marginTop: 2 }}>
        <Ic d="M12 5v14M5 12h14" s={13} /> {depth === 0 ? t.addSub : t.addSubSub}
      </button>
    </div>
  );
}

/* ─── Section Manager with drag-to-regroup ─── */
function SectionManager(props) {
  var [items, setItems] = useState(function() { return JSON.parse(JSON.stringify(props.sections)); });
  var t = useT();
  var [drag, setDrag] = useState(null); // { type:'sub'|'subsub', secId, subId?, ssId? }
  var [dragOver, setDragOver] = useState(null); // { type, secId, subId? }

  // ── Section ops ──
  function addSection() { setItems(items.concat({ id: uid(), name: "New Section", subs: [] })); }
  function removeSection(id) { setItems(items.filter(function (i) { return i.id !== id; })); }
  function renameSection(id, n) { setItems(items.map(function (i) { return i.id === id ? { ...i, name: n } : i; })); }
  function moveSectionUp(i) { if (i === 0) return; var a = items.slice(); var tmp = a[i-1]; a[i-1] = a[i]; a[i] = tmp; setItems(a); }
  function moveSectionDown(i) { if (i === items.length-1) return; var a = items.slice(); var tmp = a[i+1]; a[i+1] = a[i]; a[i] = tmp; setItems(a); }

  // ── Child node ops (all use recursive tree helpers) ──
  function addChildNode(parentId, isSection) {
    var newNode = { id: uid(), name: "New", children: [] };
    if (isSection) {
      setItems(items.map(function(s){ return s.id === parentId ? { ...s, children: (s.children||[]).concat(newNode) } : s; }));
    } else {
      setItems(items.map(function(s){ return { ...s, children: addChildTo(s.children||[], parentId, newNode) }; }));
    }
  }
  function removeChildNode(nodeId) {
    setItems(items.map(function(s){ return { ...s, children: removeNode(s.children||[], nodeId) }; }).filter(function(s){ return s.id !== nodeId; }));
  }
  function renameNode(nodeId, n, isSec) {
    if (isSec) { setItems(items.map(function(s){ return s.id === nodeId ? {...s, name: n} : s; })); }
    else { setItems(items.map(function(s){ return { ...s, children: updateNode(s.children||[], nodeId, function(x){ return {...x, name: n}; }) }; })); }
  }

  // ── Drag-to-regroup: any node can be dragged to any other parent ──
  function handleDrop(targetParentId, targetIsSection) {
    if (!drag) { setDrag(null); setDragOver(null); return; }
    var nodeToMove = null;
    items.forEach(function(s){
      var found = findNode(s.children||[], drag.nodeId);
      if (found) nodeToMove = found;
    });
    if (!nodeToMove) { setDrag(null); setDragOver(null); return; }
    // Remove from old location, add to new
    var withRemoved = items.map(function(s){ return { ...s, children: removeNode(s.children||[], drag.nodeId) }; });
    var withAdded;
    if (targetIsSection) {
      withAdded = withRemoved.map(function(s){ return s.id === targetParentId ? { ...s, children: (s.children||[]).concat(nodeToMove) } : s; });
    } else {
      withAdded = withRemoved.map(function(s){ return { ...s, children: addChildTo(s.children||[], targetParentId, nodeToMove) }; });
    }
    setItems(withAdded);
    setDrag(null); setDragOver(null);
  }

  var doStyle = { outline: "2px dashed " + C.accent };

  return (
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 7000, background: "rgba(8,10,14,0.9)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .2s ease" }}>
      <div onClick={function (e) { e.stopPropagation(); }} style={{ background: C.surface, borderRadius: 10, padding: 28, width: "90vw", maxWidth: 560, maxHeight: "85vh", overflowY: "auto", border: "1px solid " + C.divider, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <h3 style={{ fontFamily: F.h, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>{t.sections}</h3>
          <button onClick={props.onClose} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer" }}><XIcon /></button>
        </div>
        <div style={{ fontFamily: F.b, fontSize: 11, color: C.faint, marginBottom: 20, letterSpacing: "0.04em" }}>Drag subsections and sub-subsections to regroup them between categories</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {items.map(function (item, idx) {
            var isDropTarget = dragOver && dragOver.type === "sub" && dragOver.secId === item.id;
            return (
              <div key={item.id} style={{ background: isDropTarget ? "rgba(200,176,124,0.12)" : C.accentDim, borderRadius: 8, padding: "10px 12px", border: isDropTarget ? ("1px dashed " + C.accent) : "1px solid transparent", transition: "all .15s" }}
                onDragOver={function(e){ e.preventDefault(); if(drag) setDragOver({type:"sec",secId:item.id}); }}
                onDragLeave={function(){ setDragOver(null); }}
                onDrop={function(){ if(drag) handleDrop(item.id, true); }}>
                {/* Section row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <button onClick={function () { moveSectionUp(idx); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: idx === 0 ? 0.2 : 0.5, padding: 0, fontSize: 0 }}><ChevUp /></button>
                    <button onClick={function () { moveSectionDown(idx); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: idx === items.length - 1 ? 0.2 : 0.5, padding: 0, fontSize: 0 }}><ChevDown /></button>
                  </div>
                  <input value={item.name} onChange={function (e) { renameSection(item.id, e.target.value); }} style={{ flex: 1, padding: "4px 8px", background: "transparent", border: "1px solid transparent", borderRadius: 3, color: C.text, fontFamily: F.h, fontSize: 15, fontWeight: 600, outline: "none" }} />
                  <button onClick={function () { removeSection(item.id); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: 0.35, padding: 2, fontSize: 0 }}><Trash /></button>
                </div>

                {/* Children — recursive */}
                <div style={{ marginLeft: 24, marginTop: 4 }}>
                  <TreeNodeList nodes={item.children||[]} depth={1} parentId={item.id} parentIsSection={true}
                    drag={drag} dragOver={dragOver} setDrag={setDrag} setDragOver={setDragOver}
                    onAdd={addChildNode} onRemove={removeChildNode} onRename={renameNode} onDrop={handleDrop} t={t} />
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={addSection} style={{ width: "100%", padding: 10, background: "transparent", border: "1px dashed " + C.faint, borderRadius: 6, color: C.sub, fontFamily: F.b, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}><Plus /> {t.addSection}</button>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={props.onClose} style={{ padding: "8px 18px", background: "transparent", border: "1px solid " + C.divider, borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 13, cursor: "pointer" }}>{t.cancel}</button>
          <button onClick={function () { props.onSave(items); }} style={{ padding: "8px 20px", background: C.text, border: "none", borderRadius: 4, color: C.bg, fontFamily: F.b, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t.save}</button>
        </div>
      </div>
    </div>
  );
}

/* ─── About Page ─── */
function AboutPage(props) {
  var about = props.about;
  var [editing, setEditing] = useState(false);
  var [portrait, setPortrait] = useState(about.portrait || "");
  var [text, setText] = useState(about.text || "");
  var [uploadingPortrait, setUploadingPortrait] = useState(false);
  var fr = useRef();
  var t = useT();
  function handleFile(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    setUploadingPortrait(true);
    prepareAndUpload(f).then(function (url) {
      setPortrait(url);
      setUploadingPortrait(false);
    }).catch(function () {
      alert("Upload failed. Please try again.");
      setUploadingPortrait(false);
    });
  }
  function doSave() { props.onSave({ portrait: portrait, text: text }); setEditing(false); }
  useEffect(function () { setPortrait(about.portrait || ""); setText(about.text || ""); }, [about]);

  if (editing) {
    return (
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "60px 20px", animation: "fadeIn .3s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h2 style={{ fontFamily: F.h, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>{t.edit}</h2>
          <button onClick={function () { setEditing(false); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer" }}><XIcon /></button>
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>{t.portrait}</label>
          {uploadingPortrait ? (
            <div style={{ border: "1px solid " + C.divider, borderRadius: 6, padding: "60px 20px", textAlign: "center", background: C.accentDim }}>
              <div style={{ fontFamily: F.b, color: C.sub, fontSize: 13 }}>Uploading...</div>
            </div>
          ) : portrait ? (
            <div style={{ position: "relative", borderRadius: 4, overflow: "hidden" }}>
              <img src={portrait} alt="" style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block" }} />
              <button onClick={function () { fr.current && fr.current.click(); }} style={{ position: "absolute", bottom: 10, right: 10, padding: "5px 14px", background: "rgba(12,15,20,0.75)", border: "none", borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 12, cursor: "pointer" }}>{t.change}</button>
            </div>
          ) : (
            <div onClick={function () { fr.current && fr.current.click(); }} style={{ border: "1px dashed " + C.faint, borderRadius: 6, padding: "60px 20px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ color: C.sub, marginBottom: 6 }}><Camera /></div>
              <div style={{ fontFamily: F.b, color: C.sub, fontSize: 13 }}>{t.uploadPortrait}</div>
            </div>
          )}
          <input ref={fr} type="file" accept="image/*,.heic,.heif,.HEIC,.HEIF" onChange={handleFile} style={{ display: "none" }} />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>{t.text}</label>
          <textarea value={text} onChange={function (e) { setText(e.target.value); }} placeholder={t.textPlaceholder} rows={8} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.8, fontSize: 15 }} />
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={function () { setEditing(false); }} style={{ padding: "8px 18px", background: "transparent", border: "1px solid " + C.divider, borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 13, cursor: "pointer" }}>{t.cancel}</button>
          <button onClick={doSave} style={{ padding: "8px 20px", background: C.text, border: "none", borderRadius: 4, color: C.bg, fontFamily: F.b, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t.save}</button>
        </div>
      </div>
    );
  }
  if (!portrait && !text) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px", animation: "fadeIn .4s ease" }}>
        <div style={{ color: C.sub, marginBottom: 16 }}><Camera /></div>
        <div style={{ fontFamily: F.b, fontSize: 14, color: C.sub, marginBottom: 24 }}>{t.aboutPrompt}</div>
        <button onClick={function () { setEditing(true); }} style={{ padding: "8px 20px", background: C.text, border: "none", borderRadius: 4, color: C.bg, fontFamily: F.b, fontSize: 13, fontWeight: 500, cursor: "pointer" }}><Edit /> {t.setupProfile}</button>
      </div>
    );
  }
  function renderLine(line, i) {
    var tr = line.trim();
    if (!tr) return <div key={i} style={{ height: 20 }} />;
    var fi = text.split("\n").findIndex(function (l) { return l.trim(); });
    if (fi === i && tr.length < 40) return <h2 key={i} style={{ fontFamily: F.h, fontSize: "clamp(28px,4vw,48px)", fontWeight: 800, color: C.text, lineHeight: 1.1, marginBottom: 20 }}>{tr}</h2>;
    return <p key={i} style={{ fontFamily: F.b, fontSize: 15, color: C.sub, lineHeight: 1.9, fontWeight: 300, marginBottom: 12, fontStyle: tr.length < 60 ? "italic" : "normal" }}>{tr}</p>;
  }
  return (
    <div style={{ animation: "fadeIn .6s ease", maxWidth: 1100, margin: "0 auto", padding: "40px 0 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: (portrait && text) ? "1fr 1fr" : "1fr", gap: 0, minHeight: "70vh", alignItems: "center" }}>
        {portrait && (
          <div style={{ position: "relative", overflow: "hidden", height: text ? "clamp(400px,70vh,700px)" : "clamp(400px,75vh,750px)", animation: "slideUp .7s ease backwards" }}>
            <img src={portrait} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {text && <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 80, background: "linear-gradient(to right, transparent, " + C.bg + ")" }} />}
          </div>
        )}
        {text && <div style={{ padding: portrait ? "0 40px" : "40px 20px", maxWidth: portrait ? undefined : 600, margin: portrait ? undefined : "0 auto", animation: "slideUp .7s ease .15s backwards" }}>{text.split("\n").map(renderLine)}</div>}
      </div>
      <div style={{ textAlign: "right", padding: "20px 20px 0" }}>
        <button onClick={function () { setEditing(true); }} style={{ padding: "6px 14px", background: "transparent", border: "1px solid " + C.divider, borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 12, cursor: "pointer" }}><Edit /> {t.editProfile}</button>
      </div>
    </div>
  );
}



/* ─── Bulk Upload Modal ─── */
function BulkUploader(props) {
  var [files, setFiles] = useState(props.preloadFiles || []);
  var [nodeId, setNodeId] = useState(props.nodeId || "");
  var [progress, setProgress] = useState(0);
  var [total, setTotal] = useState(0);
  var [running, setRunning] = useState(false);
  var [dropOver, setDropOver] = useState(false);
  var fr = useRef();
  var t = useT();

  useEffect(function() {
    if (props.preloadFiles && props.preloadFiles.length) setFiles(props.preloadFiles);
  }, [props.preloadFiles]);

  function handleFiles(e) {
    var selected = Array.from(e.target.files || []);
    setFiles(selected);
  }
  function handleDrop(e) {
    e.preventDefault(); setDropOver(false);
    var dropped = Array.from(e.dataTransfer.files || []).filter(function(f){ return f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name||""); });
    if (dropped.length) setFiles(function(prev){ return prev.concat(dropped); });
  }

  function handleStart() {
    if (files.length === 0 || running) return;
    setRunning(true);
    setTotal(files.length);
    setProgress(0);
    var results = [];
    var chain = Promise.resolve();
    files.forEach(function (f) {
      chain = chain.then(function () {
        return prepareAndUpload(f).then(function (url) {
          results.push({
            id: uid(),
            src: url,
            title: f.name.replace(/\.[^.]+$/, ""),
            description: "",
            date: new Date(f.lastModified).toISOString().slice(0, 16),
            nodeId: nodeId,
          });
          setProgress(function (p) { return p + 1; });
        }).catch(function () {
          setProgress(function (p) { return p + 1; });
        });
      });
    });
    chain.then(function () {
      setRunning(false);
      props.onDone(results);
    });
  }

  return (
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 7000, background: "rgba(8,10,14,0.9)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .2s ease" }}>
      <div onClick={function (e) { e.stopPropagation(); }} style={{ background: C.surface, borderRadius: 10, padding: 28, width: "90vw", maxWidth: 480, border: "1px solid " + C.divider, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontFamily: F.h, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>{t.bulkAdd}</h3>
          <button onClick={props.onClose} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer" }}><XIcon /></button>
        </div>

        {/* File picker — click or drag */}
        <div style={{ marginBottom: 20 }}>
          <div
            onClick={function () { fr.current && fr.current.click(); }}
            onDragOver={function (e) { e.preventDefault(); setDropOver(true); }}
            onDragLeave={function () { setDropOver(false); }}
            onDrop={handleDrop}
            style={{ border: "1px dashed " + (dropOver ? C.accent : files.length ? C.accent : C.faint), borderRadius: 6, padding: "32px 20px", textAlign: "center", cursor: "pointer", background: dropOver ? C.accentDim : files.length ? "rgba(200,176,124,0.06)" : "transparent", transition: "all .2s" }}>
            <div style={{ color: dropOver ? C.accent : files.length ? C.accent : C.sub, marginBottom: 8 }}><Upload /></div>
            <div style={{ fontFamily: F.b, fontSize: 13, color: dropOver ? C.accent : files.length ? C.accent : C.sub }}>
              {dropOver ? "Drop photos here" : files.length ? files.length + " photos selected" : "Click or drag photos here"}
            </div>
            <div style={{ fontFamily: F.b, fontSize: 11, color: C.faint, marginTop: 6 }}>
              {files.length ? <span style={{ cursor: "pointer", textDecoration: "underline", color: C.sub }} onClick={function(e){ e.stopPropagation(); setFiles([]); }}>Clear</span> : "JPG, PNG, WebP · multiple files supported"}
            </div>
          </div>
          <input ref={fr} type="file" accept="image/*,.heic,.heif,.HEIC,.HEIF" multiple onChange={handleFiles} style={{ display: "none" }} />
        </div>

        {/* Subsection selector */}
        {props.sectionChildren && props.sectionChildren.length >= 0 && (
          <SubpathPicker
            sectionId={"_bulk"}
            sectionChildren={props.sectionChildren || []}
            nodeId={nodeId}
            onNodeChange={function(v){ setNodeId(v); }}
            onCreateChild={function(parentId, name){
              if (props.onCreateChild) return props.onCreateChild(parentId, name);
              return uid();
            }}
          />
        )}

        {/* Progress */}
        {running && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: F.b, fontSize: 13, color: C.sub, marginBottom: 8 }}>
              {t.uploading} {progress} {t.of} {total}...
            </div>
            <div style={{ height: 3, background: C.divider, borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", background: C.accent, width: (total ? (progress / total * 100) : 0) + "%", transition: "width .3s" }} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={props.onClose} disabled={running} style={{ padding: "8px 18px", background: "transparent", border: "1px solid " + C.divider, borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 13, cursor: "pointer" }}>{t.cancel}</button>
          <button onClick={handleStart} disabled={files.length === 0 || running} style={{ padding: "8px 20px", background: files.length && !running ? C.text : "rgba(226,223,216,0.1)", border: "none", borderRadius: 4, color: files.length && !running ? C.bg : C.faint, fontFamily: F.b, fontSize: 13, fontWeight: 500, cursor: files.length && !running ? "pointer" : "not-allowed" }}>
            {running ? t.uploading + "..." : t.bulkAdd + " (" + files.length + ")"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Bulk Move Bar ─── */
function BulkMoveBar(props) {
  var selected = props.selected || [];
  var sections = props.sections || [];
  var curChildren = props.curChildren || [];
  var curSectionId = props.curSectionId;
  var [showMenu, setShowMenu] = useState(false);
  var t = useT();
  if (selected.length === 0) return null;
  return (
    <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 600, background: C.surface, border: "1px solid " + C.accentBorder, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "fadeIn .2s ease", whiteSpace: "nowrap" }}>
      <span style={{ fontFamily: F.b, fontSize: 13, color: C.accent, fontWeight: 500 }}>{selected.length} selected</span>
      <div style={{ width: 1, height: 18, background: C.divider }} />
      <div style={{ position: "relative" }}>
        <button onClick={function () { setShowMenu(!showMenu); }} style={{ padding: "6px 14px", background: C.accentDim, border: "1px solid " + C.accentBorder, borderRadius: 6, color: C.accent, fontFamily: F.b, fontSize: 12, cursor: "pointer", fontWeight: 500 }}>
          {t.bulkMove} ▾
        </button>
        {showMenu && (
          <div style={{ position: "absolute", bottom: "calc(100% + 8px)", left: 0, background: C.surface, border: "1px solid " + C.divider, borderRadius: 8, padding: 4, minWidth: 200, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 10 }}>
            {/* Move to subsection within same section */}
            {curChildren.length > 0 && (
              <div>
                <div style={{ padding: "6px 12px", fontSize: 10, color: C.faint, fontFamily: F.b, textTransform: "uppercase", letterSpacing: "0.1em" }}>Subsection</div>
                <button onClick={function () { props.onMoveSub(""); setShowMenu(false); }} style={{ display: "block", width: "100%", padding: "7px 12px", background: "transparent", border: "none", color: C.sub, fontFamily: F.b, fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4 }}>{t.none}</button>
                {flattenTree({ id: "_root", children: curChildren }).slice(1).map(function (node) {
                  return (
                    <button key={node.id} onClick={function () { props.onMoveSub(node.id); setShowMenu(false); }} style={{ display: "block", width: "100%", padding: "7px 12px", background: "transparent", border: "none", color: C.text, fontFamily: F.b, fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4 }}>{node.name}</button>
                  );
                })}
                <div style={{ height: 1, background: C.divider, margin: "4px 0" }} />
              </div>
            )}
            {/* Move to other section */}
            <div style={{ padding: "6px 12px", fontSize: 10, color: C.faint, fontFamily: F.b, textTransform: "uppercase", letterSpacing: "0.1em" }}>Section</div>
            {sections.filter(function (s) { return s.id !== curSectionId; }).map(function (s) {
              return (
                <button key={s.id} onClick={function () { props.onMoveSection(s.id); setShowMenu(false); }} style={{ display: "block", width: "100%", padding: "7px 12px", background: "transparent", border: "none", color: C.text, fontFamily: F.b, fontSize: 13, textAlign: "left", cursor: "pointer", borderRadius: 4 }}>{s.name}</button>
              );
            })}
          </div>
        )}
      </div>
      <button onClick={props.onDeselect} style={{ padding: "6px 12px", background: "transparent", border: "1px solid " + C.divider, borderRadius: 6, color: C.sub, fontFamily: F.b, fontSize: 12, cursor: "pointer" }}>{t.deselectAll}</button>
    </div>
  );
}

/* ─── Hero Image Uploader ─── */
function HeroUploader(props) {
  var [uploading, setUploading] = useState(false);
  var fr = useRef();
  function handleFile(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    setUploading(true);
    prepareAndUpload(f).then(function (url) {
      props.onUpload(url);
      setUploading(false);
    }).catch(function () {
      alert("Upload failed");
      setUploading(false);
    });
  }
  return (
    <div style={{ position: "absolute", bottom: 24, right: 28 }}>
      <button onClick={function () { fr.current && fr.current.click(); }} style={{
        padding: "7px 16px", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.2)", borderRadius: 3,
        color: "rgba(255,255,255,0.6)", fontFamily: F.b, fontSize: 10,
        cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", transition: "all .2s"
      }}>
        {uploading ? "Uploading..." : (props.heroImage ? "Change Cover" : "Set Cover")}
      </button>
      <input ref={fr} type="file" accept="image/*,.heic,.heif,.HEIC,.HEIF" onChange={handleFile} style={{ display: "none" }} />
    </div>
  );
}


/* ─── HEIC conversion ─── */
/* heic2any is loaded from CDN at runtime — graceful fallback if unavailable */
function convertIfHeic(file) {
  var name = file.name || "";
  var isHeic = /\.(heic|heif)$/i.test(name) || file.type === "image/heic" || file.type === "image/heif";
  if (!isHeic) return Promise.resolve(file);
  /* Lazy-load heic2any from CDN */
  return new Promise(function(resolve, reject) {
    if (window.heic2any) {
      window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 })
        .then(function(blob) {
          var converted = new File([blob], name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
          resolve(converted);
        }).catch(reject);
    } else {
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
      script.onload = function() {
        window.heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 })
          .then(function(blob) {
            var converted = new File([blob], name.replace(/\.(heic|heif)$/i, ".jpg"), { type: "image/jpeg" });
            resolve(converted);
          }).catch(reject);
      };
      script.onerror = function() { resolve(file); }; /* fallback: upload as-is */
      document.head.appendChild(script);
    }
  });
}

function compressIfNeeded(file) {
  var MAX_BYTES = 8 * 1024 * 1024; // 8MB
  if (file.size <= MAX_BYTES) return Promise.resolve(file);
  return new Promise(function(resolve) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function() {
      URL.revokeObjectURL(url);
      // Calculate scale factor to reach target size
      var ratio = Math.sqrt(MAX_BYTES / file.size);
      var w = Math.round(img.naturalWidth * ratio);
      var h = Math.round(img.naturalHeight * ratio);
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(function(blob) {
        if (!blob) { resolve(file); return; }
        var compressed = new File([blob], file.name, { type: "image/jpeg" });
        // If still too big, compress harder (lower quality)
        if (compressed.size > MAX_BYTES) {
          canvas.toBlob(function(blob2) {
            resolve(blob2 ? new File([blob2], file.name, { type: "image/jpeg" }) : file);
          }, "image/jpeg", 0.7);
        } else {
          resolve(compressed);
        }
      }, "image/jpeg", 0.88);
    };
    img.onerror = function() { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

function prepareAndUpload(file) {
  return convertIfHeic(file)
    .then(function(f) { return compressIfNeeded(f); })
    .then(function(f) { return uploadToCloudinary(f); });
}

/* ─── Tree helpers (recursive, unlimited depth) ─── */
function flattenTree(node) {
  var result = [node];
  (node.children || []).forEach(function(c){ flattenTree(c).forEach(function(x){ result.push(x); }); });
  return result;
}
function findNode(nodes, id) {
  for (var i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return nodes[i];
    var found = findNode(nodes[i].children || [], id);
    if (found) return found;
  }
  return null;
}
function updateNode(nodes, id, fn) {
  return nodes.map(function(n) {
    if (n.id === id) return fn(n);
    return { ...n, children: updateNode(n.children || [], id, fn) };
  });
}
function removeNode(nodes, id) {
  return nodes
    .filter(function(n){ return n.id !== id; })
    .map(function(n){ return { ...n, children: removeNode(n.children || [], id) }; });
}
function addChildTo(nodes, parentId, child) {
  return nodes.map(function(n) {
    if (n.id === parentId) return { ...n, children: (n.children||[]).concat(child) };
    return { ...n, children: addChildTo(n.children || [], parentId, child) };
  });
}
/* Get ancestry path [id, id, ...] from root to a node */
function getPath(nodes, targetId, path) {
  path = path || [];
  for (var i = 0; i < nodes.length; i++) {
    var p = path.concat(nodes[i].id);
    if (nodes[i].id === targetId) return p;
    var found = getPath(nodes[i].children || [], targetId, p);
    if (found) return found;
  }
  return null;
}

/* ═══════════════════════ */
/* ─── MAIN APP ─── */
/* ═══════════════════════ */
export default function App() {
  var [lang, setLang] = useState("en");
  var [sections, setSections] = useState([
    { id: uid(), name: "Landscapes", children: [
      { id: uid(), name: "Yosemite", children: [{ id: uid(), name: "Valley", children: [] }, { id: uid(), name: "Glacier Point", children: [] }] },
      { id: uid(), name: "Big Sur", children: [] }
    ]},
    { id: uid(), name: "Portraits", children: [] },
    { id: uid(), name: "Street", children: [
      { id: uid(), name: "Tokyo", children: [{ id: uid(), name: "Shibuya", children: [] }, { id: uid(), name: "Shinjuku", children: [] }] },
      { id: uid(), name: "Paris", children: [] }
    ]},
  ]);
  var [photos, setPhotos] = useState({});
  var [about, setAbout] = useState({});
  var [siteName, setSiteName] = useState("PORTFOLIO");
  var [activeTab, setActiveTab] = useState("about");
  var [activeNodeId, setActiveNodeId] = useState(""); // id of selected sub/sub-sub/... node, "" = show all
  var [editing, setEditing] = useState(null);
  var [lightbox, setLightbox] = useState(null);
  var [showMgr, setShowMgr] = useState(false);
  var [toast, setToast] = useState(null);
  var [loaded, setLoaded] = useState(false);
  var [editName, setEditName] = useState(false);
  var [selected, setSelected] = useState([]);
  var [showBulk, setShowBulk] = useState(false);
  var [pageDragOver, setPageDragOver] = useState(false);
  var [pageDragFiles, setPageDragFiles] = useState(null);
  var [heroImage, setHeroImage] = useState("");
  var [scrolled, setScrolled] = useState(false);
  var [showHeroUpload, setShowHeroUpload] = useState(false);
  var [aspects, setAspects] = useState({});

  var t = dict[lang] || dict.en;
  var contentRef = useRef(null);
  function scrollToContent() {
    setTimeout(function () {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  }

  useEffect(function () {
    load().then(function (d) {
      if (d) {
        if (d.sections) setSections(d.sections);
        if (d.photos) setPhotos(d.photos);
        if (d.about) setAbout(d.about);
        if (d.siteName) setSiteName(d.siteName);
        if (d.lang) setLang(d.lang);
        if (d.heroImage) setHeroImage(d.heroImage);
      }
      setLoaded(true);
    });
  }, []);
  useEffect(function () { if (loaded) persist({ sections: sections, photos: photos, about: about, siteName: siteName, lang: lang, heroImage: heroImage }); }, [sections, photos, about, siteName, lang, heroImage, loaded]);
  useEffect(function () {
    if (activeTab.startsWith("gallery_")) {
      var i = parseInt(activeTab.split("_")[1]);
      if (i >= sections.length) setActiveTab(sections.length > 0 ? "gallery_0" : "about");
    }
  }, [sections, activeTab]);

  // Reset node filter when switching sections
  useEffect(function () { setActiveNodeId(""); setSelected([]); }, [activeTab]);

  // Scroll detection for nav transparency
  useEffect(function () {
    function onScroll() { setScrolled(window.scrollY > window.innerHeight * 0.7); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return function () { window.removeEventListener("scroll", onScroll); };
  }, []);

  // Window-level drag-to-upload (avoids onDragLeave firing on child elements)
  useEffect(function () {
    var counter = 0; // track enter/leave on nested elements
    function onDragEnter(e) {
      if (!curSection) return;
      var hasFiles = e.dataTransfer && Array.from(e.dataTransfer.types).indexOf("Files") >= 0;
      if (!hasFiles) return;
      counter++;
      setPageDragOver(true);
    }
    function onDragLeave() {
      counter--;
      if (counter <= 0) { counter = 0; setPageDragOver(false); }
    }
    function onDragOver(e) {
      if (!curSection) return;
      var hasFiles = e.dataTransfer && Array.from(e.dataTransfer.types).indexOf("Files") >= 0;
      if (hasFiles) e.preventDefault();
    }
    function onDrop(e) {
      counter = 0;
      setPageDragOver(false);
      if (!curSection) return;
      var files = Array.from(e.dataTransfer.files).filter(function(f){ return f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name||""); });
      if (files.length > 0) {
        e.preventDefault();
        setPageDragFiles(files);
        setShowBulk(true);
      }
    }
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return function () {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [curSection]);

  function getAllDescendantIds(sectionChildren, nodeId) {
    // Returns nodeId + all descendant ids
    var node = findNode(sectionChildren, nodeId);
    if (!node) return [];
    return flattenTree(node).map(function(n){ return n.id; });
  }
  function getSorted(sid, nodeId) {
    var sec = sections.find(function(s){ return s.id === sid; });
    var list = (photos[sid] || []).slice();
    if (nodeId && sec) {
      var ids = getAllDescendantIds(sec.children || [], nodeId);
      list = list.filter(function (p) { return ids.indexOf(p.nodeId) >= 0; });
    }
    list.sort(function (a, b) { if (!a.date && !b.date) return 0; if (!a.date) return 1; if (!b.date) return -1; return new Date(b.date) - new Date(a.date); });
    return list;
  }
  function savePhoto(photo) {
    var sid = editing.sectionId; var ex = photos[sid] || [];
    var idx = ex.findIndex(function (p) { return p.id === photo.id; });
    var updated = idx >= 0 ? ex.map(function (p, i) { return i === idx ? photo : p; }) : ex.concat(photo);
    setPhotos({ ...photos, [sid]: updated }); setEditing(null); setToast(idx >= 0 ? t.updated : t.added);
  }
  function deletePhoto(sid, pid) { setPhotos({ ...photos, [sid]: (photos[sid] || []).filter(function (p) { return p.id !== pid; }) }); setToast(t.removed); }
  function movePhoto(sid, pid, tid) {
    var s = photos[sid] || []; var p = s.find(function (x) { return x.id === pid; }); if (!p) return;
    setPhotos({ ...photos, [sid]: s.filter(function (x) { return x.id !== pid; }), [tid]: (photos[tid] || []).concat(p) }); setToast(t.moved);
  }
  function bulkSave(newPhotos) {
    if (!curSection) return;
    var sid = curSection.id;
    var ex = photos[sid] || [];
    setPhotos({ ...photos, [sid]: ex.concat(newPhotos) });
    setShowBulk(false);
    setToast(newPhotos.length + " " + t.added);
  }
  function bulkMoveSub(nodeId) {
    if (!curSection) return;
    var sid = curSection.id;
    var updated = (photos[sid] || []).map(function (p) {
      return selected.indexOf(p.id) >= 0 ? { ...p, nodeId: nodeId } : p;
    });
    setPhotos({ ...photos, [sid]: updated });
    setSelected([]);
    setToast(t.bulkMoved);
  }
  function bulkMoveSection(tid) {
    if (!curSection) return;
    var sid = curSection.id;
    var staying = (photos[sid] || []).filter(function (p) { return selected.indexOf(p.id) < 0; });
    var moving = (photos[sid] || []).filter(function (p) { return selected.indexOf(p.id) >= 0; });
    setPhotos({ ...photos, [sid]: staying, [tid]: (photos[tid] || []).concat(moving) });
    setSelected([]);
    setToast(t.bulkMoved);
  }
  function toggleSelect(pid) {
    setSelected(function (prev) {
      return prev.indexOf(pid) >= 0 ? prev.filter(function (x) { return x !== pid; }) : prev.concat(pid);
    });
  }
  function createChildNode(parentId, name) {
    // parentId = section.id → adds top-level child; otherwise finds node in tree
    var newId = uid();
    var newNode = { id: newId, name: name, children: [] };
    if (curSection && parentId === curSection.id) {
      setSections(sections.map(function(s){
        return s.id === curSection.id ? { ...s, children: (s.children||[]).concat(newNode) } : s;
      }));
    } else {
      setSections(sections.map(function(s){
        return { ...s, children: addChildTo(s.children || [], parentId, newNode) };
      }));
    }
    return newId;
  }
  function saveSections(ns) { setSections(ns); setShowMgr(false); setToast(t.saved); }
  function saveAbout(a) { setAbout(a); setToast(t.saved); }

  var totalPhotos = Object.values(photos).reduce(function (a, b) { return a + b.length; }, 0);
  var curIdx = activeTab.startsWith("gallery_") ? parseInt(activeTab.split("_")[1]) : null;
  var curSection = curIdx !== null ? sections[curIdx] : null;
  var curChildren = curSection ? (curSection.children || []) : [];
  var curPhotos = curSection ? getSorted(curSection.id, activeNodeId) : [];
  var allCurPhotos = curSection ? getSorted(curSection.id, "") : [];

  return (
    <LangCtx.Provider value={lang}>
      <link href={FONTS} rel="stylesheet" />
      <style>{
        "* { box-sizing: border-box; margin: 0; padding: 0; }" +
        "::-webkit-scrollbar { width: 4px; height: 4px; }" +
        "::-webkit-scrollbar-track { background: transparent; }" +
        "::-webkit-scrollbar-thumb { background: " + C.divider + "; border-radius: 2px; }" +
        "@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }" +
        "@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }" +
        "@keyframes cardIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }" +
        "@keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }" +
        "@keyframes scrollBob { 0%, 100% { opacity: 0.3; transform: translateX(-50%) translateY(0); } 50% { opacity: 0.7; transform: translateX(-50%) translateY(8px); } }"
      }</style>

      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.b }}>

        {/* ── Floating Nav — transparent over hero, solid after scroll ── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          transition: "background .4s ease, border-color .4s ease",
          background: scrolled ? C.bg : "transparent",
          borderBottom: scrolled ? ("1px solid " + C.divider) : "1px solid transparent",
        }}>
          <div style={{ display: "flex", alignItems: "center", padding: "0 40px", height: 56, maxWidth: 1400, margin: "0 auto" }}>
            {editName ? (
              <input autoFocus value={siteName}
                onChange={function (e) { setSiteName(e.target.value); }}
                onBlur={function () { setEditName(false); }}
                onKeyDown={function (e) { if (e.key === "Enter") setEditName(false); }}
                style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.3)", fontFamily: F.h, fontSize: 13, fontWeight: 700, color: "#fff", outline: "none", letterSpacing: "0.16em", width: 180 }} />
            ) : (
              <span onClick={function () { setEditName(true); }} style={{ fontFamily: F.h, fontSize: 13, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: scrolled ? C.text : "#fff", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>{siteName}</span>
            )}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
              <button onClick={function () { setActiveTab("about"); setActiveNodeId(""); scrollToContent(); }} style={{ padding: "0 18px", height: 56, background: "transparent", border: "none", borderBottom: activeTab === "about" ? ("1px solid " + (scrolled ? C.accent : "#fff")) : "1px solid transparent", color: scrolled ? (activeTab === "about" ? C.text : C.sub) : (activeTab === "about" ? "#fff" : "rgba(255,255,255,0.5)"), fontFamily: F.b, fontSize: 11, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", transition: "all .2s" }}>{t.about}</button>
              {sections.map(function (s, i) {
                var key = "gallery_" + i; var a = activeTab === key;
                var hasSubs = s.children && s.children.length > 0;
                return (
                  <div key={s.id} style={{ position: "relative", display: "flex", alignItems: "center" }}
                    onMouseEnter={function (e) {
                      var mega = document.getElementById("mega_" + s.id);
                      if (mega) { mega.style.opacity = "1"; mega.style.pointerEvents = "auto"; mega.style.transform = "translateY(0)"; }
                    }}
                    onMouseLeave={function (e) {
                      var mega = document.getElementById("mega_" + s.id);
                      if (mega) { mega.style.opacity = "0"; mega.style.pointerEvents = "none"; mega.style.transform = "translateY(-4px)"; }
                    }}>
                    <button onClick={function () { setActiveTab(key); setActiveNodeId(""); scrollToContent(); }}
                      style={{ padding: "0 18px", height: 56, background: "transparent", border: "none", borderBottom: a ? ("1px solid " + (scrolled ? C.accent : "#fff")) : "1px solid transparent", color: scrolled ? (a ? C.text : C.sub) : (a ? "#fff" : "rgba(255,255,255,0.5)"), fontFamily: F.b, fontSize: 11, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", transition: "all .2s" }}>
                      {s.name}
                    </button>
                    {hasSubs && s.children && (
                      <div id={"mega_" + s.id} style={{
                        position: "fixed", top: 56, left: 0, right: 0, zIndex: 300,
                        opacity: 0, pointerEvents: "none", transform: "translateY(-4px)",
                        transition: "opacity .22s ease, transform .22s ease",
                        background: scrolled ? "rgba(18,21,28,0.97)" : "rgba(8,10,14,0.96)",
                        backdropFilter: "blur(20px)",
                        borderBottom: "1px solid rgba(255,255,255,0.07)",
                      }}>
                        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 40px 44px", display: "flex", gap: 0 }}>
                          {(s.children||[]).map(function (sub, si) {
                            return (
                              <div key={sub.id} style={{ flex: 1, paddingRight: 32, borderRight: si < (s.children||[]).length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none", paddingLeft: si > 0 ? 32 : 0 }}>
                                <button onClick={function () { setActiveTab(key); setActiveNodeId(sub.id); scrollToContent(); var mega = document.getElementById("mega_" + s.id); if(mega){mega.style.opacity="0";mega.style.pointerEvents="none";} }}
                                  style={{ background: "transparent", border: "none", padding: "0 0 14px 0", cursor: "pointer", textAlign: "left", width: "100%", display: "block" }}>
                                  <span style={{ fontFamily: F.h, fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: activeNodeId === sub.id && activeTab === key ? C.accent : "rgba(255,255,255,0.85)", borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: 10, display: "block", transition: "color .15s" }}>
                                    {sub.name}
                                  </span>
                                </button>
                                {(sub.children || []).map(function (ss) {
                                  return (
                                    <button key={ss.id} onClick={function () { setActiveTab(key); setActiveNodeId(ss.id); scrollToContent(); var mega = document.getElementById("mega_" + s.id); if(mega){mega.style.opacity="0";mega.style.pointerEvents="none";} }}
                                      style={{ display: "block", background: "transparent", border: "none", padding: "7px 0", cursor: "pointer", textAlign: "left", width: "100%" }}>
                                      <span style={{ fontFamily: F.b, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: activeNodeId === ss.id && activeTab === key ? C.accent : "rgba(255,255,255,0.45)", transition: "color .15s" }}>{ss.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button onClick={function () { setLang(lang === "en" ? "cn" : "en"); }} style={{ padding: "5px 10px", background: "transparent", border: "1px solid " + (scrolled ? C.divider : "rgba(255,255,255,0.2)"), borderRadius: 3, color: scrolled ? C.sub : "rgba(255,255,255,0.55)", fontFamily: F.b, fontSize: 10, cursor: "pointer", letterSpacing: "0.08em" }}>{lang === "en" ? "中文" : "EN"}</button>
              <button onClick={function () { setShowMgr(true); }} style={{ padding: "5px 10px", background: "transparent", border: "1px solid " + (scrolled ? C.divider : "rgba(255,255,255,0.2)"), borderRadius: 3, color: scrolled ? C.sub : "rgba(255,255,255,0.55)", fontFamily: F.b, fontSize: 10, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" }}>{t.manage}</button>
            </div>
          </div>
        </nav>

        {/* ── Hero — full viewport cover image ── */}
        <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#080a0e" }}>
          {heroImage ? (
            <img src={heroImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg, #0c0f18 0%, #0a0c15 60%, #0d0b12 100%)" }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 35%, rgba(0,0,0,0.5) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" }}>
            <div style={{ fontFamily: F.h, fontSize: "clamp(52px,9vw,108px)", fontWeight: 800, color: "#fff", letterSpacing: "0.06em", lineHeight: 0.9, textTransform: "uppercase" }}>{siteName}</div>
            <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.3)", margin: "28px auto" }} />
            <div style={{ fontFamily: F.b, fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: "0.22em", textTransform: "uppercase" }}>
              {totalPhotos} {totalPhotos === 1 ? t.photo : t.photos}
            </div>
          </div>
          <HeroUploader heroImage={heroImage} onUpload={function (url) { setHeroImage(url); }} />
          <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", animation: "scrollBob 2s ease-in-out infinite" }}>
            <div style={{ width: 1, height: 44, background: "rgba(255,255,255,0.2)" }} />
          </div>
        </div>

        {/* ── Content ── */}
        <main ref={contentRef} style={{ padding: "60px 40px 100px", maxWidth: 1200, margin: "0 auto", minHeight: "60vh", position: "relative" }}>

          {activeTab === "about" && <AboutPage about={about} onSave={saveAbout} />}

          {curSection && (
            <div key={curSection.id} style={{ animation: "fadeIn .3s ease" }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 12 }}>
                <div>
                  <h2 style={{ fontFamily: F.h, fontSize: 24, fontWeight: 700, color: C.text }}>{curSection.name}</h2>
                  <span style={{ fontFamily: F.b, fontSize: 12, color: C.faint, letterSpacing: "0.06em" }}>
                    {allCurPhotos.length} {allCurPhotos.length === 1 ? t.photo : t.photos}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={function () { setShowBulk(true); }} style={{ padding: "8px 14px", background: "transparent", border: "1px solid " + C.divider, borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Upload /> {t.bulkAdd}</button>
                  <button onClick={function () { setEditing({ sectionId: curSection.id }); }} style={{ padding: "8px 16px", background: C.text, border: "none", borderRadius: 4, color: C.bg, fontFamily: F.b, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Plus /> {t.add}</button>
                </div>
              </div>

              {/* Floating subsection panel */}

              <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, alignItems: "start" }}>
                {curPhotos.map(function (p, i) {
                  var isPortrait = aspects[p.id] !== "landscape";
                  return (
                    <div key={p.id} style={{ gridColumn: isPortrait ? "span 2" : "span 1", position: "relative", animation: "cardIn .5s ease backwards", animationDelay: (i * 0.04) + "s" }}>
                      <PhotoCard photo={p}
                        onEdit={function (x) { setEditing({ sectionId: curSection.id, photo: x }); }}
                        onDelete={function (id) { deletePhoto(curSection.id, id); }}
                        onView={function (x) { if (selected.length > 0) { toggleSelect(p.id); } else { setLightbox(x); } }}
                        onMove={function (pid, tid) { movePhoto(curSection.id, pid, tid); }}
                        onDims={function (w, h) { setAspects(function (prev) { return { ...prev, [p.id]: h > w ? "portrait" : "landscape" }; }); }}
                        sections={sections} currentSection={curSection.id} />
                      <div onClick={function (e) { e.stopPropagation(); toggleSelect(p.id); }} style={{ position: "absolute", top: 10, left: 10, width: 20, height: 20, borderRadius: 4, border: "2px solid " + (selected.indexOf(p.id) >= 0 ? C.accent : "rgba(226,223,216,0.4)"), background: selected.indexOf(p.id) >= 0 ? C.accent : "rgba(12,15,20,0.5)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", backdropFilter: "blur(4px)" }}>
                        {selected.indexOf(p.id) >= 0 && <span style={{ color: C.bg, fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {curPhotos.length === 0 && (
                <div onClick={function () { setEditing({ sectionId: curSection.id }); }} style={{ border: "1px dashed " + C.faint, borderRadius: 6, padding: "60px 20px", textAlign: "center", cursor: "pointer", maxWidth: 400, margin: "40px auto" }}>
                  <div style={{ color: C.sub, marginBottom: 8 }}><ImgIc /></div>
                  <div style={{ fontFamily: F.b, fontSize: 14, color: C.sub }}>{t.addFirstPhoto}</div>
                </div>
              )}
            </div>
          )}

          {sections.length === 0 && activeTab !== "about" && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.sub }}>
              <div style={{ marginBottom: 12 }}><Folder /></div>
              <div style={{ fontFamily: F.h, fontSize: 18, fontWeight: 600, color: C.text }}>{t.noSections}</div>
              <div style={{ fontFamily: F.b, fontSize: 13, marginTop: 6 }}>{t.noSectionsHint}</div>
            </div>
          )}
        </main>

        <footer style={{ textAlign: "center", padding: "32px 20px 48px", borderTop: "1px solid " + C.divider }}>
          <div style={{ fontFamily: F.h, fontSize: 11, color: C.faint, letterSpacing: "0.14em", textTransform: "uppercase" }}>{siteName}</div>
        </footer>
      </div>

      {showBulk && curSection && <BulkUploader sectionChildren={curChildren} nodeId={activeNodeId} preloadFiles={pageDragFiles} onDone={function(photos){ bulkSave(photos); setPageDragFiles(null); }} onClose={function () { setShowBulk(false); setPageDragFiles(null); }} />
      }
      <BulkMoveBar selected={selected} sections={sections} curChildren={curChildren} curSectionId={curSection ? curSection.id : ""} onMoveSub={bulkMoveSub} onMoveSection={bulkMoveSection} onDeselect={function () { setSelected([]); }} />
      {pageDragOver && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(12,15,20,0.4)", backdropFilter: "blur(2px)" }}>
          <div style={{ fontFamily: F.h, fontSize: 22, fontWeight: 700, color: C.accent, letterSpacing: "0.08em", textTransform: "uppercase", background: "rgba(12,15,20,0.9)", padding: "20px 40px", borderRadius: 6, border: "1px solid " + C.accentBorder }}>Drop to upload</div>
        </div>
      )}
      {editing && <PhotoEditor photo={editing.photo || {}} sectionId={curSection ? curSection.id : ""} sectionChildren={curChildren} onSave={savePhoto} onClose={function () { setEditing(null); }} onCreateChild={createChildNode} />}
      {lightbox && <Lightbox photo={lightbox} photos={curPhotos} onClose={function () { setLightbox(null); }} onNav={function (p) { setLightbox(p); }} />}
      {showMgr && <SectionManager sections={sections} onSave={saveSections} onClose={function () { setShowMgr(false); }} />}
      {toast && <Toast msg={toast} onDone={function () { setToast(null); }} />}
    </LangCtx.Provider>
  );
}
