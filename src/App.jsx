import { useState } from "react";
import { useFireproof } from "use-fireproof";

const TAGS = ["💡 Idea", "🤝 Collaborate", "📢 Announce", "❓ Question", "🎉 Win"];
const AVATARS = ["🎓","🧠","🚀","🌟","💼","🦁","🎯","🏆","🌍","⚡"];
const COLORS = [
  { bg: "#EFF6FF", border: "#3B82F6", tag: "#1D4ED8" },
  { bg: "#EEF2FF", border: "#6366F1", tag: "#4338CA" },
  { bg: "#F0F9FF", border: "#0EA5E9", tag: "#0369A1" },
  { bg: "#DBEAFE", border: "#2563EB", tag: "#1E40AF" },
  { bg: "#E0F2FE", border: "#38BDF8", tag: "#0284C7" },
];

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

export default function App() {
  const { database, useLiveQuery, useDocument } = useFireproof("alumni-idea-board-v1");
  const { docs: ideas } = useLiveQuery("createdAt", { descending: true });
  const [view, setView] = useState("board");
  const [filterTag, setFilterTag] = useState("All");
  const [name, setName] = useState("");
  const [cohort, setCohort] = useState("");
  const [toast, setToast] = useState("");
  const [likedIds, setLikedIds] = useState([]);

  const { doc, merge, submit, reset } = useDocument(() => ({
    text: "",
    tag: TAGS[0],
    authorName: "",
    authorCohort: "",
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    colorIndex: Math.floor(Math.random() * COLORS.length),
    likes: 0,
    createdAt: Date.now(),
  }));

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleSubmit = async () => {
    if (!doc.text.trim() || !name.trim()) { 
      flash("⚠️ Name and idea are required"); 
      return; 
    }
    const ideaToSave = {
      text: doc.text.trim(),
      tag: doc.tag,
      authorName: name.trim(),
      authorCohort: cohort.trim(),
      avatar: doc.avatar,
      colorIndex: doc.colorIndex,
      likes: 0,
      createdAt: Date.now(),
    };
    await database.put(ideaToSave);
    reset();
    setName("");
    setCohort("");
    setView("board");
    flash("🎉 Your idea is live on the board!");
  };

  const handleLike = async (idea) => {
    if (likedIds.includes(idea._id)) return;
    setLikedIds([...likedIds, idea._id]);
    await database.put({ ...idea, likes: (idea.likes || 0) + 1 });
  };

  const handleDelete = async (idea) => {
    await database.del(idea._id);
    flash("🗑 Removed");
  };

  const filtered = filterTag === "All" ? ideas : ideas.filter(i => i.tag === filterTag);

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .card { animation: fadeUp 0.3s ease both; transition: transform 0.2s, box-shadow 0.2s; }
        .card:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(0,0,0,0.15) !important; }
        button { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div>
            <div style={s.eyebrow}>EST. 2024</div>
            <h1 style={s.title}>THEE Alumni Network</h1>
            <p style={s.sub}>Share ideas · Collaborate · Celebrate wins</p>
          </div>
          <div style={s.headerRight}>
            <div style={s.livePill}>
              <span style={s.liveDot} />
              {ideas.length} ideas live
            </div>
            <button style={view === "submit" ? s.cancelBtn : s.postBtn}
              onClick={() => setView(view === "submit" ? "board" : "submit")}>
              {view === "submit" ? "← Back" : "+ Share Idea"}
            </button>
          </div>
        </div>
      </div>

      <div style={s.body}>

        {/* Submit Form */}
        {view === "submit" && (
          <div style={s.formCard}>
            <h2 style={s.formTitle}>What's on your mind?</h2>
            <p style={s.formSub}>Your idea appears on the board instantly for all alumni to see.</p>
            <div style={s.formGrid}>
              <div style={s.formGroup}>
                <label style={s.label}>Your Name *</label>
                <input style={s.input} placeholder="e.g. Jordan Rivera"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Cohort / Year</label>
                <input style={s.input} placeholder="e.g. Class of 2019"
                  value={cohort} onChange={e => setCohort(e.target.value)} />
              </div>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Tag</label>
              <div style={s.tagRow}>
                {TAGS.map(t => (
                  <button key={t}
                    style={{ ...s.tagChip, ...(doc.tag === t ? s.tagChipActive : {}) }}
                    onClick={() => merge({ tag: t })}>{t}</button>
                ))}
              </div>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Your Idea *</label>
              <textarea style={s.textarea} rows={4}
                placeholder="Share your idea, question, announcement, or win..."
                value={doc.text} onChange={e => merge({ text: e.target.value })} />
            </div>
            <button style={s.submitBtn} onClick={handleSubmit}>
              Post to Board →
            </button>
          </div>
        )}

        {/* Board */}
        {view === "board" && (
          <>
            <div style={s.filterBar}>
              {["All", ...TAGS].map(tag => (
                <button key={tag}
                  style={{ ...s.filterBtn, ...(filterTag === tag ? s.filterActive : {}) }}
                  onClick={() => setFilterTag(tag)}>{tag}</button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💭</div>
                <div style={s.emptyTitle}>No ideas yet</div>
                <div style={s.emptySub}>Be the first to post something!</div>
                <button style={s.submitBtn} onClick={() => setView("submit")}>
                  Share the First Idea →
                </button>
              </div>
            ) : (
              <div style={s.grid}>
                {filtered.map((idea, i) => {
                  const color = COLORS[idea.colorIndex % COLORS.length] || COLORS[0];
                  const liked = likedIds.includes(idea._id);
                  return (
                    <div key={idea._id} className="card"
                      style={{ ...s.card, background: color.bg, borderTop: `4px solid ${color.border}`, animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}>
                      <div style={s.cardHeader}>
                        <div style={s.avatar}>{idea.avatar || "🎓"}</div>
                        <div style={{ flex: 1 }}>
                          <div style={s.authorName}>{idea.authorName || "Alumni"}</div>
                          {idea.authorCohort && <div style={s.authorCohort}>{idea.authorCohort}</div>}
                        </div>
                        <button style={s.deleteX} onClick={() => handleDelete(idea)}>✕</button>
                      </div>
                      <span style={{ ...s.cardTag, color: color.tag, background: `${color.border}22` }}>
                        {idea.tag}
                      </span>
                      <p style={s.cardText}>{idea.text}</p>
                      <div style={s.cardFooter}>
                        <span style={s.timeAgo}>{timeAgo(idea.createdAt)}</span>
                        <button style={{ ...s.likeBtn, ...(liked ? s.likeBtnActive : {}) }}
                          onClick={() => handleLike(idea)}>
                          {liked ? "❤️" : "🤍"} {idea.likes || 0}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {toast && <div style={s.toast}>{toast}</div>}
      <div style={s.footerNote}>⚡ THEE Alumni Network · Powered by Fireproof</div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" },
  header: { background: "#1E3A8A", padding: "24px 32px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,0.25)" },
  headerInner: { maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap" },
  eyebrow: { fontSize: 10, letterSpacing: "3px", color: "#93C5FD", fontWeight: 600, marginBottom: 4 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 900, color: "#FFFFFF", lineHeight: 1, marginBottom: 6 },
  sub: { fontSize: 13, color: "#BFDBFE" },
  headerRight: { display: "flex", alignItems: "center", gap: 12 },
  livePill: { display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#FFFFFF", fontWeight: 600 },
  liveDot: { width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite", boxShadow: "0 0 6px #4ADE80" },
  postBtn: { background: "#FFFFFF", color: "#1E3A8A", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  cancelBtn: { background: "transparent", color: "#BFDBFE", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer" },
  body: { maxWidth: 1100, margin: "0 auto", padding: "32px 24px 60px" },
  formCard: { background: "#fff", borderRadius: 16, padding: 36, boxShadow: "0 4px 32px rgba(0,0,0,0.08)", maxWidth: 680, margin: "0 auto", border: "1px solid #DBEAFE" },
  formTitle: { fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#1E3A8A", marginBottom: 6 },
  formSub: { fontSize: 13, color: "#6B7280", marginBottom: 28 },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 },
  formGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "1px", color: "#6B7280", textTransform: "uppercase", marginBottom: 6 },
  input: { width: "100%", background: "#F0F4FF", border: "1.5px solid #DBEAFE", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#1E3A8A", outline: "none", fontFamily: "inherit" },
  textarea: { width: "100%", background: "#F0F4FF", border: "1.5px solid #DBEAFE", borderRadius: 8, padding: "12px 14px", fontSize: 14, color: "#1E3A8A", resize: "vertical", outline: "none", lineHeight: 1.6, fontFamily: "inherit" },
  tagRow: { display: "flex", flexWrap: "wrap", gap: 8 },
  tagChip: { background: "#F0F4FF", border: "1.5px solid #DBEAFE", borderRadius: 20, padding: "5px 14px", fontSize: 13, cursor: "pointer", color: "#1E3A8A" },
  tagChipActive: { background: "#1E3A8A", borderColor: "#1E3A8A", color: "#fff" },
  submitBtn: { background: "#1E3A8A", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 },
  filterBar: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 28 },
  filterBtn: { background: "transparent", border: "1.5px solid #DBEAFE", borderRadius: 20, padding: "6px 16px", fontSize: 13, cursor: "pointer", color: "#1E3A8A" },
  filterActive: { background: "#1E3A8A", borderColor: "#1E3A8A", color: "#fff" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 },
  card: { borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 12 },
  cardHeader: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { fontSize: 28, lineHeight: 1 },
  authorName: { fontWeight: 600, fontSize: 14, color: "#1E3A8A" },
  authorCohort: { fontSize: 11, color: "#6B7280" },
  deleteX: { background: "transparent", border: "none", color: "#CBD5E1", cursor: "pointer", fontSize: 12, padding: "2px 4px" },
  cardTag: { display: "inline-block", fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "3px 10px", alignSelf: "flex-start" },
  cardText: { fontSize: 14, color: "#1E3A8A", lineHeight: 1.65, flex: 1 },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(30,58,138,0.1)" },
  timeAgo: { fontSize: 11, color: "#93C5FD" },
  likeBtn: { background: "transparent", border: "none", cursor: "pointer", fontSize: 13, color: "#93C5FD", display: "flex", alignItems: "center", gap: 4, padding: "2px 6px", borderRadius: 6, fontFamily: "inherit" },
  likeBtnActive: { color: "#EF4444" },
  empty: { textAlign: "center", padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#1E3A8A", fontWeight: 700 },
  emptySub: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  toast: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1E3A8A", color: "#FFFFFF", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap", border: "1px solid rgba(147,197,253,0.3)" },
  footerNote: { textAlign: "center", fontSize: 11, color: "#93C5FD", padding: "0 0 24px", letterSpacing: "0.3px" },
};