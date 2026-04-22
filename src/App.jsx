import { useState, useRef, useEffect, createContext, useContext } from "react";

var FONTS = "https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Noto+Sans+SC:wght@300;400;500;700&display=swap";

/* ─── Storage ─── */
var SKEY = "photo-portfolio-v7";
function load() {
  return new Promise(function (resolve) {
    try {
      var raw = localStorage.getItem(SKEY);
      resolve(raw ? JSON.parse(raw) : null);
    } catch (e) {
      resolve(null);
    }
  });
}
function persist(d) {
  try { localStorage.setItem(SKEY, JSON.stringify(d)); } catch (e) {}
}

/* ─── Cloudinary ─── */
var CLD_CLOUD = "dr4sochhz";
var CLD_PRESET = "portfolio_upload";
function uploadToCloudinary(file) {
  var fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLD_PRESET);
  return fetch("https://api.cloudinary.com/v1_1/" + CLD_CLOUD + "/image/upload", {
    method: "POST",
    body: fd,
  }).then(function (r) { return r.json(); }).then(function (d) {
    if (d.secure_url) return d.secure_url;
    throw new Error("Upload failed");
  });
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
      <div onClick={function () { props.onView(photo); }} style={{ aspectRatio: "3/2", overflow: "hidden", position: "relative", background: C.card }}>
        <img src={photo.src} alt={photo.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform .6s cubic-bezier(.25,.46,.45,.94)", transform: hov ? "scale(1.04)" : "scale(1)" }} />
        <div style={{ position: "absolute", inset: 0, background: hov ? "linear-gradient(to top, rgba(12,15,20,0.82) 0%, rgba(12,15,20,0.2) 40%, transparent 100%)" : "linear-gradient(to top, rgba(12,15,20,0.3) 0%, transparent 30%)", transition: "all .4s ease" }} />
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

/* ─── Photo Editor (with subsection selector) ─── */
function PhotoEditor(props) {
  var photo = props.photo || {};
  var subsections = props.subsections || [];
  var [title, setTitle] = useState(photo.title || "");
  var [desc, setDesc] = useState(photo.description || "");
  var [date, setDate] = useState(photo.date || "");
  var [src, setSrc] = useState(photo.src || "");
  var [subId, setSubId] = useState(photo.subId || "");
  var [uploading, setUploading] = useState(false);
  var fr = useRef();
  var t = useT();
  function handleFile(e) {
    var f = e.target.files && e.target.files[0]; if (!f) return;
    if (!date) setDate(new Date(f.lastModified).toISOString().slice(0, 16));
    setUploading(true);
    setSrc("uploading");
    uploadToCloudinary(f).then(function (url) {
      setSrc(url);
      setUploading(false);
    }).catch(function () {
      alert("Upload failed. Please try again.");
      setSrc("");
      setUploading(false);
    });
  }
  function handleSave() { if (!src) return; props.onSave({ ...photo, id: photo.id || uid(), title: title, description: desc, date: date, src: src, subId: subId }); }
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
            <div onClick={function () { fr.current && fr.current.click(); }} style={{ border: "1px dashed " + C.faint, borderRadius: 6, padding: "40px 20px", textAlign: "center", cursor: "pointer" }}>
              <div style={{ color: C.sub, marginBottom: 6 }}><Upload /></div>
              <div style={{ fontFamily: F.b, color: C.sub, fontSize: 13 }}>{t.clickUpload}</div>
            </div>
          )}
          <input ref={fr} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
        </div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t.title}</label><input value={title} onChange={function (e) { setTitle(e.target.value); }} placeholder={t.untitled} style={inputStyle} /></div>
        <div style={{ marginBottom: 16 }}><label style={labelStyle}>{t.dateTaken}</label><input type="datetime-local" value={date} onChange={function (e) { setDate(e.target.value); }} style={{ ...inputStyle, colorScheme: "dark" }} /></div>
        {subsections.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>{t.subsection}</label>
            <select value={subId} onChange={function (e) { setSubId(e.target.value); }} style={{ ...inputStyle, appearance: "auto" }}>
              <option value="">{t.none}</option>
              {subsections.map(function (s) { return <option key={s.id} value={s.id}>{s.name}</option>; })}
            </select>
          </div>
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

/* ─── Section Manager (with inline subsection editing) ─── */
function SectionManager(props) {
  var [items, setItems] = useState(props.sections.map(function (s) { return { ...s, subs: (s.subs || []).slice() }; }));
  var t = useT();
  function add() { setItems(items.concat({ id: uid(), name: "New Section", subs: [] })); }
  function remove(id) { setItems(items.filter(function (i) { return i.id !== id; })); }
  function rename(id, n) { setItems(items.map(function (i) { return i.id === id ? { ...i, name: n } : i; })); }
  function moveUp(i) { if (i === 0) return; var a = items.slice(); var tmp = a[i - 1]; a[i - 1] = a[i]; a[i] = tmp; setItems(a); }
  function moveDown(i) { if (i === items.length - 1) return; var a = items.slice(); var tmp = a[i + 1]; a[i + 1] = a[i]; a[i] = tmp; setItems(a); }
  function addSub(secId) { setItems(items.map(function (s) { return s.id === secId ? { ...s, subs: s.subs.concat({ id: uid(), name: "New" }) } : s; })); }
  function removeSub(secId, subId) { setItems(items.map(function (s) { return s.id === secId ? { ...s, subs: s.subs.filter(function (x) { return x.id !== subId; }) } : s; })); }
  function renameSub(secId, subId, n) { setItems(items.map(function (s) { return s.id === secId ? { ...s, subs: s.subs.map(function (x) { return x.id === subId ? { ...x, name: n } : x; }) } : s; })); }
  function moveSubUp(secId, i) { setItems(items.map(function (s) { if (s.id !== secId || i === 0) return s; var a = s.subs.slice(); var tmp = a[i-1]; a[i-1] = a[i]; a[i] = tmp; return { ...s, subs: a }; })); }
  function moveSubDown(secId, i) { setItems(items.map(function (s) { if (s.id !== secId || i === s.subs.length - 1) return s; var a = s.subs.slice(); var tmp = a[i+1]; a[i+1] = a[i]; a[i] = tmp; return { ...s, subs: a }; })); }

  return (
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 7000, background: "rgba(8,10,14,0.9)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn .2s ease" }}>
      <div onClick={function (e) { e.stopPropagation(); }} style={{ background: C.surface, borderRadius: 10, padding: 28, width: "90vw", maxWidth: 520, maxHeight: "85vh", overflowY: "auto", border: "1px solid " + C.divider, boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ fontFamily: F.h, fontSize: 18, fontWeight: 600, color: C.text, margin: 0 }}>{t.sections}</h3>
          <button onClick={props.onClose} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer" }}><XIcon /></button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {items.map(function (item, idx) {
            return (
              <div key={item.id} style={{ background: C.accentDim, borderRadius: 8, padding: "10px 12px" }}>
                {/* Section row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <button onClick={function () { moveUp(idx); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: idx === 0 ? 0.2 : 0.5, padding: 0, fontSize: 0 }}><ChevUp /></button>
                    <button onClick={function () { moveDown(idx); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: idx === items.length - 1 ? 0.2 : 0.5, padding: 0, fontSize: 0 }}><ChevDown /></button>
                  </div>
                  <input value={item.name} onChange={function (e) { rename(item.id, e.target.value); }} style={{ flex: 1, padding: "4px 8px", background: "transparent", border: "1px solid transparent", borderRadius: 3, color: C.text, fontFamily: F.h, fontSize: 15, fontWeight: 600, outline: "none" }} />
                  <button onClick={function () { remove(item.id); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: 0.35, padding: 2, fontSize: 0 }}><Trash /></button>
                </div>
                {/* Subsections */}
                <div style={{ marginLeft: 32, marginTop: 6 }}>
                  {item.subs.map(function (sub, si) {
                    return (
                      <div key={sub.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          <button onClick={function () { moveSubUp(item.id, si); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: si === 0 ? 0.15 : 0.4, padding: 0, fontSize: 0 }}><Ic d="M18 15l-6-6-6 6" s={14} /></button>
                          <button onClick={function () { moveSubDown(item.id, si); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: si === item.subs.length - 1 ? 0.15 : 0.4, padding: 0, fontSize: 0 }}><Ic d="M6 9l6 6 6-6" s={14} /></button>
                        </div>
                        <span style={{ color: C.faint, fontSize: 10 }}><TagIc /></span>
                        <input value={sub.name} onChange={function (e) { renameSub(item.id, sub.id, e.target.value); }} style={{ flex: 1, padding: "3px 6px", background: "transparent", border: "1px solid transparent", borderRadius: 3, color: C.sub, fontFamily: F.b, fontSize: 13, outline: "none" }} />
                        <button onClick={function () { removeSub(item.id, sub.id); }} style={{ background: "transparent", border: "none", color: C.sub, cursor: "pointer", opacity: 0.3, padding: 0, fontSize: 0 }}><Ic d="M18 6L6 18M6 6l12 12" s={14} /></button>
                      </div>
                    );
                  })}
                  <button onClick={function () { addSub(item.id); }} style={{ background: "transparent", border: "none", color: C.faint, fontFamily: F.b, fontSize: 12, cursor: "pointer", padding: "4px 0", display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                    <Plus /> {t.addSub}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={add} style={{ width: "100%", padding: 10, background: "transparent", border: "1px dashed " + C.faint, borderRadius: 6, color: C.sub, fontFamily: F.b, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 24 }}><Plus /> {t.addSection}</button>
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
    uploadToCloudinary(f).then(function (url) {
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
          <input ref={fr} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />
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

/* ─── Floating Draggable Subsection Panel ─── */
function SubPanel(props) {
  var subs = props.subs || [];
  var active = props.active;
  var t = useT();

  // Position state — default bottom-left of viewport
  var [pos, setPos] = useState({ x: 32, y: window.innerHeight - 280 });
  var [dragging, setDragging] = useState(false);
  var dragOffset = useRef({ x: 0, y: 0 });
  var panelRef = useRef();

  // Reset position when section changes
  useEffect(function () {
    setPos({ x: 32, y: window.innerHeight - 280 });
  }, [props.sectionId]);

  function onMouseDown(e) {
    // Only drag on the handle area (top bar)
    if (e.target.closest("[data-handle]")) {
      setDragging(true);
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
      e.preventDefault();
    }
  }

  useEffect(function () {
    if (!dragging) return;
    function onMove(e) {
      var nx = e.clientX - dragOffset.current.x;
      var ny = e.clientY - dragOffset.current.y;
      var pw = panelRef.current ? panelRef.current.offsetWidth : 180;
      var ph = panelRef.current ? panelRef.current.offsetHeight : 200;
      nx = Math.max(0, Math.min(window.innerWidth - pw, nx));
      ny = Math.max(0, Math.min(window.innerHeight - ph, ny));
      setPos({ x: nx, y: ny });
    }
    function onUp() { setDragging(false); }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return function () {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  if (subs.length === 0) return null;

  return (
    <div ref={panelRef} onMouseDown={onMouseDown}
      style={{
        position: "fixed", left: pos.x, top: pos.y, zIndex: 500,
        background: C.surface, border: "1px solid " + C.accentBorder,
        borderRadius: 10, width: 180, boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
        userSelect: "none", animation: "fadeIn .25s ease",
      }}>
      {/* Drag handle */}
      <div data-handle="1" style={{
        padding: "10px 14px 8px", cursor: dragging ? "grabbing" : "grab",
        borderBottom: "1px solid " + C.divider, display: "flex", alignItems: "center", gap: 6,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2.5, opacity: 0.3 }}>
          {[0,1,2].map(function (i) {
            return <div key={i} style={{ width: 16, height: 1.5, background: C.text, borderRadius: 1 }} />;
          })}
        </div>
        <span style={{ fontFamily: F.b, fontSize: 10, color: C.faint, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {t.manageSubs}
        </span>
      </div>

      {/* Items */}
      <div style={{ padding: "6px 8px 10px" }}>
        <button onClick={function () { props.onSelect(""); }}
          style={{
            display: "block", width: "100%", padding: "7px 10px", borderRadius: 6, border: "none",
            background: active === "" ? C.accentDim : "transparent",
            color: active === "" ? C.accent : C.sub,
            fontFamily: F.b, fontSize: 13, textAlign: "left", cursor: "pointer", transition: "all .15s",
            borderLeft: active === "" ? "2px solid " + C.accent : "2px solid transparent",
          }}>
          {t.all}
        </button>
        {subs.map(function (sub) {
          var isActive = active === sub.id;
          return (
            <button key={sub.id} onClick={function () { props.onSelect(sub.id); }}
              style={{
                display: "block", width: "100%", padding: "7px 10px", borderRadius: 6, border: "none",
                background: isActive ? C.accentDim : "transparent",
                color: isActive ? C.accent : C.sub,
                fontFamily: F.b, fontSize: 13, textAlign: "left", cursor: "pointer", transition: "all .15s",
                borderLeft: isActive ? "2px solid " + C.accent : "2px solid transparent",
              }}>
              {sub.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════ */
/* ─── MAIN APP ─── */
/* ═══════════════════════ */
export default function App() {
  var [lang, setLang] = useState("en");
  var [sections, setSections] = useState([
    { id: uid(), name: "Landscapes", subs: [{ id: uid(), name: "Yosemite" }, { id: uid(), name: "Big Sur" }] },
    { id: uid(), name: "Portraits", subs: [] },
    { id: uid(), name: "Street", subs: [{ id: uid(), name: "Tokyo" }, { id: uid(), name: "Paris" }] },
  ]);
  var [photos, setPhotos] = useState({});
  var [about, setAbout] = useState({});
  var [siteName, setSiteName] = useState("PORTFOLIO");
  var [activeTab, setActiveTab] = useState("about");
  var [activeSub, setActiveSub] = useState("");
  var [editing, setEditing] = useState(null);
  var [lightbox, setLightbox] = useState(null);
  var [showMgr, setShowMgr] = useState(false);
  var [toast, setToast] = useState(null);
  var [loaded, setLoaded] = useState(false);
  var [editName, setEditName] = useState(false);

  var t = dict[lang] || dict.en;

  useEffect(function () {
    load().then(function (d) {
      if (d) {
        if (d.sections) setSections(d.sections);
        if (d.photos) setPhotos(d.photos);
        if (d.about) setAbout(d.about);
        if (d.siteName) setSiteName(d.siteName);
        if (d.lang) setLang(d.lang);
      }
      setLoaded(true);
    });
  }, []);
  useEffect(function () { if (loaded) persist({ sections: sections, photos: photos, about: about, siteName: siteName, lang: lang }); }, [sections, photos, about, siteName, lang, loaded]);
  useEffect(function () {
    if (activeTab.startsWith("gallery_")) {
      var i = parseInt(activeTab.split("_")[1]);
      if (i >= sections.length) setActiveTab(sections.length > 0 ? "gallery_0" : "about");
    }
  }, [sections, activeTab]);

  // Reset subsection filter when switching sections
  useEffect(function () { setActiveSub(""); }, [activeTab]);

  function getSorted(sid, subFilter) {
    var list = (photos[sid] || []).slice();
    if (subFilter) { list = list.filter(function (p) { return p.subId === subFilter; }); }
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
  function saveSections(ns) { setSections(ns); setShowMgr(false); setToast(t.saved); }
  function saveAbout(a) { setAbout(a); setToast(t.saved); }

  var totalPhotos = Object.values(photos).reduce(function (a, b) { return a + b.length; }, 0);
  var curIdx = activeTab.startsWith("gallery_") ? parseInt(activeTab.split("_")[1]) : null;
  var curSection = curIdx !== null ? sections[curIdx] : null;
  var curSubs = curSection ? (curSection.subs || []) : [];
  var curPhotos = curSection ? getSorted(curSection.id, activeSub) : [];
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
        "@keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }"
      }</style>

      <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: F.b }}>

        {/* Header */}
        <header style={{ padding: "52px 40px 0", textAlign: "center" }}>
          {editName ? (
            <input autoFocus value={siteName} onChange={function (e) { setSiteName(e.target.value); }} onBlur={function () { setEditName(false); }} onKeyDown={function (e) { if (e.key === "Enter") setEditName(false); }}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid " + C.faint, fontFamily: F.h, fontSize: 32, fontWeight: 700, color: C.text, textAlign: "center", outline: "none", letterSpacing: "0.12em", width: "80%", maxWidth: 400 }} />
          ) : (
            <h1 onClick={function () { setEditName(true); }} title={t.clickToEdit} style={{ fontFamily: F.h, fontSize: 32, fontWeight: 700, letterSpacing: "0.12em", color: C.text, cursor: "pointer", display: "inline-block" }}>{siteName}</h1>
          )}
          <div style={{ fontFamily: F.b, fontSize: 11, color: C.faint, marginTop: 10, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            {totalPhotos} {totalPhotos === 1 ? t.photo : t.photos} &middot; {sections.length} {sections.length === 1 ? t.collection : t.collections}
          </div>
        </header>

        {/* Nav */}
        <nav style={{ position: "sticky", top: 0, zIndex: 100, marginTop: 28, padding: "0 20px", background: C.bg }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0, flexWrap: "wrap", padding: "0 0 1px", maxWidth: 1000, margin: "0 auto", borderBottom: "1px solid " + C.divider }}>
            <button onClick={function () { setActiveTab("about"); }} style={{ padding: "14px 20px", background: "transparent", border: "none", borderBottom: activeTab === "about" ? "2px solid " + C.accent : "2px solid transparent", color: activeTab === "about" ? C.text : C.sub, fontFamily: F.b, fontSize: 12.5, cursor: "pointer", fontWeight: activeTab === "about" ? 500 : 400, transition: "all .2s", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: -1 }}>{t.about}</button>
            {sections.map(function (s, i) {
              var key = "gallery_" + i; var a = activeTab === key;
              return (
                <button key={s.id} onClick={function () { setActiveTab(key); }} style={{ padding: "14px 20px", background: "transparent", border: "none", borderBottom: a ? "2px solid " + C.accent : "2px solid transparent", color: a ? C.text : C.sub, fontFamily: F.b, fontSize: 12.5, cursor: "pointer", fontWeight: a ? 500 : 400, transition: "all .2s", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: -1 }}>{s.name}</button>
              );
            })}
            <div style={{ flex: 1 }} />
            <button onClick={function () { setLang(lang === "en" ? "cn" : "en"); }} style={{ padding: "7px 12px", background: "transparent", border: "1px solid " + C.divider, borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 11, cursor: "pointer", marginBottom: 6, marginTop: 6, marginRight: 6, display: "flex", alignItems: "center", gap: 4 }}><Globe /> {lang === "en" ? "\u4e2d\u6587" : "EN"}</button>
            <button onClick={function () { setShowMgr(true); }} style={{ padding: "7px 14px", background: "transparent", border: "1px solid " + C.divider, borderRadius: 4, color: C.sub, fontFamily: F.b, fontSize: 11, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6, marginTop: 6 }}>{t.manage}</button>
          </div>
        </nav>

        {/* Content */}
        <main style={{ padding: "36px 40px 100px", maxWidth: 1200, margin: "0 auto", minHeight: "60vh" }}>

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
                <button onClick={function () { setEditing({ sectionId: curSection.id }); }} style={{ padding: "8px 16px", background: C.text, border: "none", borderRadius: 4, color: C.bg, fontFamily: F.b, fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Plus /> {t.add}</button>
              </div>

              {/* Floating subsection panel */}
              <SubPanel subs={curSubs} active={activeSub} onSelect={function (id) { setActiveSub(id); }} sectionId={curSection.id} />

              <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                {curPhotos.map(function (p, i) {
                  return (
                    <div key={p.id} style={{ animationDelay: (i * 0.04) + "s" }}>
                      <PhotoCard photo={p}
                        onEdit={function (x) { setEditing({ sectionId: curSection.id, photo: x }); }}
                        onDelete={function (id) { deletePhoto(curSection.id, id); }}
                        onView={function (x) { setLightbox(x); }}
                        onMove={function (pid, tid) { movePhoto(curSection.id, pid, tid); }}
                        sections={sections} currentSection={curSection.id} />
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

      {editing && <PhotoEditor photo={editing.photo || {}} subsections={curSubs} onSave={savePhoto} onClose={function () { setEditing(null); }} />}
      {lightbox && <Lightbox photo={lightbox} photos={curPhotos} onClose={function () { setLightbox(null); }} onNav={function (p) { setLightbox(p); }} />}
      {showMgr && <SectionManager sections={sections} onSave={saveSections} onClose={function () { setShowMgr(false); }} />}
      {toast && <Toast msg={toast} onDone={function () { setToast(null); }} />}
    </LangCtx.Provider>
  );
}