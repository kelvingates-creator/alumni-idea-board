import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AVATARS = ["🐅","🎓","🧠","🚀","🌟","💼","🦁","🏆","🌍","⚡"];
const TAGS = ["💡 Idea", "🤝 Collaborate", "📢 Announce", "❓ Question"];
const STAGE_THRESHOLDS = { collaborate: 5, win: 10 };

function getStage(likes) {
  if (likes >= STAGE_THRESHOLDS.win) return "win";
  if (likes >= STAGE_THRESHOLDS.collaborate) return "collaborate";
  return "idea";
}

function getStageHearts(likes) {
  const stage = getStage(likes);
  if (stage === "idea") return { filled: likes, total: 5 };
  if (stage === "collaborate") return { filled: likes - STAGE_THRESHOLDS.collaborate, total: 5 };
  return { filled: 5, total: 5 };
}

function getProgressPct(likes) {
  return Math.min((likes / STAGE_THRESHOLDS.win) * 100, 100);
}

const STAGE_STYLES = {
  idea: {
    bg: "#EFF6FF", border: "#3B82F6", tag: "#1D4ED8",
    label: "💡 Idea", badge: null,
    heartColor: "#EF4444", progressColor: "#3B82F6",
  },
  collaborate: {
    bg: "#F5F3FF", border: "#7C3AED", tag: "#5B21B6",
    label: "🤝 Collaborate", badge: "🔥 Gaining Traction",
    heartColor: "#7C3AED", progressColor: "#7C3AED",
  },
  win: {
    bg: "#FFFBEB", border: "#F59E0B", tag: "#B45309",
    label: "🎉 Win", badge: "⭐ Community Win",
    heartColor: "#F59E0B", progressColor: "#F59E0B",
  },
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function HeartRow({ likes, ideaId, likedIds, onLike, heartColor, stage }) {
  const { filled, total } = getStageHearts(likes);
  const alreadyVoted = likedIds.includes(ideaId);
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => {
        const isFilled = i < filled;
        return (
          <span key={i} onClick={onLike}
            title={alreadyVoted ? "You already voted" : "Cast your vote"}
            style={{
              fontSize: 20, cursor: alreadyVoted ? "not-allowed" : "pointer",
              transition: "transform 0.15s, opacity 0.15s",
              transform: isFilled ? "scale(1.15)" : "scale(1)",
              opacity: isFilled ? 1 : alreadyVoted ? 0.2 : 0.35,
              userSelect: "none",
            }}>
            {isFilled ? (stage === "win" ? "⭐" : "❤️") : "🤍"}
          </span>
        );
      })}
    </div>
  );
}

export default function App() {
  const [ideas, setIdeas] = useState([]);
  const [view, setView] = useState("board");
  const [filterTag, setFilterTag] = useState("All");
  const [filterStage, setFilterStage] = useState("All");
  const [name, setName] = useState("");
  const [cohort, setCohort] = useState("");
  const [text, setText] = useState("");
  const [tag, setTag] = useState(TAGS[0]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem("likedIds") || "[]"); } catch { return []; }
  });

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  // Load ideas on mount
  useEffect(() => {
    fetchIdeas();
    
    // Real-time subscription
    const channel = supabase
      .channel("ideas-channel")
      .on("postgres_changes", 
        { event: "*", schema: "public", table: "ideas" },
        () => { fetchIdeas(); }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const fetchIdeas = async () => {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setIdeas(data || []);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!text.trim() || !name.trim()) {
      flash("⚠️ Name and idea are required");
      return;
    }
    const { error } = await supabase.from("ideas").insert({
      text: text.trim(),
      tag,
      author_name: name.trim(),
      author_cohort: cohort.trim(),
      avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
      likes: 0,
    });
    if (error) { flash("❌ Error posting idea"); return; }
    await fetchIdeas();
    setText("");
    setTag(TAGS[0]);
    setName("");
    setCohort("");
    setView("board");
    flash("🎉 Your idea is live on the board!");
  };

  const handleLike = async (idea) => {
    if (likedIds.includes(idea.id)) {
      flash("⚠️ You already voted on this idea!");
      return;
    }
    const newLikes = (idea.likes || 0) + 1;
    const oldStage = getStage(idea.likes || 0);
    const newStage = getStage(newLikes);
    const updatedIds = [...likedIds, idea.id];
    setLikedIds(updatedIds);
    localStorage.setItem("likedIds", JSON.stringify(updatedIds));
    const { error } = await supabase
      .from("ideas")
      .update({ likes: newLikes })
      .eq("id", idea.id);
    if (error) { flash("❌ Error updating vote"); return; }
    await fetchIdeas();
    if (newStage !== oldStage) {
      if (newStage === "collaborate") flash("🔥 This idea is gaining traction!");
      if (newStage === "win") flash("⭐ This idea just became a Community Win!");
    }
  };

  const handleDelete = async (idea) => {
    await supabase.from("ideas").delete().eq("id", idea.id);
    flash("🗑 Removed");
  };

  const filtered = ideas.filter(i => {
    const tagMatch = filterTag === "All" || i.tag === filterTag;
    const stageMatch = filterStage === "All" || getStage(i.likes || 0) === filterStage;
    return tagMatch && stageMatch;
  });

  const winCount = ideas.filter(i => getStage(i.likes || 0) === "win").length;
  const colabCount = ideas.filter(i => getStage(i.likes || 0) === "collaborate").length;

  return (
    <div style={s.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 16px rgba(124,58,237,0.3); } 50% { box-shadow: 0 0 28px rgba(124,58,237,0.6); } }
        @keyframes goldglow { 0%,100% { box-shadow: 0 0 20px rgba(245,158,11,0.4); } 50% { box-shadow: 0 0 36px rgba(245,158,11,0.7); } }
        .card { animation: fadeUp 0.3s ease both; transition: transform 0.2s; }
        .card:hover { transform: translateY(-3px); }
        .card-collaborate { animation: fadeUp 0.3s ease both, glow 2.5s ease-in-out infinite; }
        .card-collaborate:hover { transform: translateY(-3px); }
        .card-win { animation: fadeUp 0.3s ease both, goldglow 2s ease-in-out infinite; }
        .card-win:hover { transform: translateY(-3px); }
        button { font-family: 'DM Sans', sans-serif; }
        .header-inner { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
        .header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .ideas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px; }
        .filter-bar { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
        .tag-row { display: flex; flex-wrap: wrap; gap: 8px; }
        @media (max-width: 768px) {
          .header-title { font-size: 22px !important; }
          .form-grid { grid-template-columns: 1fr !important; }
          .ideas-grid { grid-template-columns: 1fr 1fr !important; }
          .form-card { padding: 24px !important; }
          .body { padding: 20px 16px 60px !important; }
        }
        @media (max-width: 480px) {
          .header-inner { flex-direction: column; align-items: flex-start; }
          .header-right { width: 100%; justify-content: space-between; }
          .ideas-grid { grid-template-columns: 1fr !important; }
          .header-title { font-size: 20px !important; }
          .post-btn { font-size: 13px !important; padding: 8px 14px !important; }
          .form-card { padding: 20px !important; margin: 0 !important; }
          .filter-btn { font-size: 12px !important; padding: 5px 10px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={s.header}>
        <div className="header-inner">
          <div>
            <div style={s.eyebrow}>EST. 2024</div>
            <h1 className="header-title" style={s.title}>THEE Alumni Network</h1>
            <p style={s.sub}>Share ideas · Collaborate · Celebrate wins</p>
          </div>
          <div className="header-right">
            {winCount > 0 && <div style={s.winPill}>⭐ {winCount} Win{winCount > 1 ? "s" : ""}</div>}
            {colabCount > 0 && <div style={s.colabPill}>🔥 {colabCount} Trending</div>}
            <div style={s.livePill}>
              <span style={s.liveDot} />
              <span style={{ color: "#fff", fontSize: 12, fontWeight: 600 }}>{ideas.length} ideas</span>
            </div>
            <button className="post-btn"
              style={view === "submit" ? s.cancelBtn : s.postBtn}
              onClick={() => setView(view === "submit" ? "board" : "submit")}>
              {view === "submit" ? "← Back" : "+ Share Idea"}
            </button>
          </div>
        </div>
      </div>

      {/* Stage Filter Bar */}
      <div style={s.stageBar}>
        <div style={s.stageBarInner}>
          {[
            { key: "All", label: "🗂 All", count: ideas.length },
            { key: "idea", label: "💡 Ideas", count: ideas.filter(i => getStage(i.likes||0) === "idea").length },
            { key: "collaborate", label: "🤝 Collaborating", count: colabCount },
            { key: "win", label: "🎉 Wins", count: winCount },
          ].map(stage => (
            <button key={stage.key}
              style={{ ...s.stageBtn, ...(filterStage === stage.key ? s.stageBtnActive : {}) }}
              onClick={() => setFilterStage(stage.key)}>
              {stage.label}
              <span style={{ ...s.stagePill, ...(filterStage === stage.key ? s.stagePillActive : {}) }}>
                {stage.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="body" style={s.body}>

        {/* Submit Form */}
        {view === "submit" && (
          <div className="form-card" style={s.formCard}>
            <h2 style={s.formTitle}>What's on your mind?</h2>
            <p style={s.formSub}>Post your idea — the community votes it up through the stages.</p>
            <div style={s.progressHint}>
              <span style={s.progressStep}>💡 Idea</span>
              <span style={s.progressArrow}>❤️❤️❤️❤️❤️ →</span>
              <span style={s.progressStep}>🤝 Collaborate</span>
              <span style={s.progressArrow}>❤️❤️❤️❤️❤️ →</span>
              <span style={s.progressStep}>🎉 Win</span>
            </div>
            <div style={s.voteWarning}>
              ⚠️ Votes are permanent and cannot be undone — read carefully before voting!
            </div>
            <div className="form-grid">
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
              <div className="tag-row">
                {TAGS.map(t => (
                  <button key={t}
                    style={{ ...s.tagChip, ...(tag === t ? s.tagChipActive : {}) }}
                    onClick={() => setTag(t)}>{t}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Your Idea *</label>
              <textarea style={s.textarea} rows={4}
                placeholder="Share your idea, question, announcement, or win..."
                value={text} onChange={e => setText(e.target.value)} />
            </div>
            <button style={s.submitBtn} onClick={handleSubmit}>Post to Board →</button>
          </div>
        )}

        {/* Board */}
        {view === "board" && (
          <>
            <div className="filter-bar">
              {["All", ...TAGS].map(t => (
                <button key={t}
                  style={{ ...s.filterBtn, ...(filterTag === t ? s.filterActive : {}) }}
                  onClick={() => setFilterTag(t)}>{t}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={s.empty}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
                <div style={s.emptyTitle}>Loading ideas...</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={s.empty}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💭</div>
                <div style={s.emptyTitle}>No ideas here yet</div>
                <div style={s.emptySub}>Be the first to post something!</div>
                <button style={s.submitBtn} onClick={() => setView("submit")}>
                  Share the First Idea →
                </button>
              </div>
            ) : (
              <div className="ideas-grid">
                {filtered.map((idea, i) => {
                  const stage = getStage(idea.likes || 0);
                  const style = STAGE_STYLES[stage];
                  const cardClass = stage === "win" ? "card-win" : stage === "collaborate" ? "card-collaborate" : "card";
                  return (
                    <div key={idea.id} className={cardClass}
                      style={{
                        ...s.card,
                        background: style.bg,
                        borderTop: `4px solid ${style.border}`,
                        animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
                      }}>

                      {style.badge && (
                        <div style={{
                          ...s.stageBadgeCard,
                          background: stage === "win" ? "#FEF3C7" : "#EDE9FE",
                          color: stage === "win" ? "#B45309" : "#5B21B6",
                          border: `1px solid ${style.border}`,
                        }}>
                          {style.badge}
                        </div>
                      )}

                      <div style={s.cardHeader}>
                        <div style={s.avatar}>{idea.avatar || "🐅"}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ ...s.authorName, color: style.tag }}>
                            {idea.author_name || "Alumni"}
                          </div>
                          {idea.author_cohort && (
                            <div style={s.authorCohort}>{idea.author_cohort}</div>
                          )}
                        </div>
                        <button style={s.deleteX} onClick={() => handleDelete(idea)}>✕</button>
                      </div>

                      <span style={{ ...s.cardTag, color: style.tag, background: `${style.border}22` }}>
                        {idea.tag}
                      </span>

                      <p style={s.cardText}>{idea.text}</p>

                      <div style={s.progressBar}>
                        <div style={{
                          ...s.progressFill,
                          width: `${getProgressPct(idea.likes || 0)}%`,
                          background: style.progressColor,
                        }} />
                      </div>

                      <div style={s.cardFooter}>
                        <span style={s.timeAgo}>{timeAgo(idea.created_at)}</span>
                        <HeartRow
                          likes={idea.likes || 0}
                          ideaId={idea.id}
                          likedIds={likedIds}
                          onLike={() => handleLike(idea)}
                          heartColor={style.heartColor}
                          stage={stage}
                        />
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
      <div style={s.footerNote}>
        ⚡ THEE Alumni Network · Ideas → Collaborate → Win
      </div>
    </div>
  );
}

const s = {
  root: { minHeight: "100vh", width: "100vw", maxWidth: "100vw", overflowX: "hidden", background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" },
  header: { background: "#1E3A8A", padding: "20px 24px", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 4px 24px rgba(0,0,0,0.25)", width: "100%" },
  eyebrow: { fontSize: 10, letterSpacing: "3px", color: "#93C5FD", fontWeight: 600, marginBottom: 4 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 900, color: "#FFFFFF", lineHeight: 1, marginBottom: 6 },
  sub: { fontSize: 13, color: "#BFDBFE" },
  livePill: { display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "5px 12px" },
  liveDot: { width: 7, height: 7, borderRadius: "50%", background: "#4ADE80", display: "inline-block", animation: "pulse 1.5s ease-in-out infinite", boxShadow: "0 0 6px #4ADE80", flexShrink: 0 },
  winPill: { background: "rgba(245,158,11,0.2)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#FCD34D", fontWeight: 600 },
  colabPill: { background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#C4B5FD", fontWeight: 600 },
  postBtn: { background: "#FFFFFF", color: "#1E3A8A", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  cancelBtn: { background: "transparent", color: "#BFDBFE", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" },
  stageBar: { background: "#1E3A8A", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "0 24px 12px", width: "100%" },
  stageBarInner: { display: "flex", gap: 8, flexWrap: "wrap" },
  stageBtn: { background: "transparent", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#BFDBFE", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 },
  stageBtnActive: { background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.4)", color: "#FFFFFF" },
  stagePill: { background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "1px 7px", fontSize: 11, color: "#93C5FD" },
  stagePillActive: { background: "rgba(255,255,255,0.2)", color: "#FFFFFF" },
  body: { width: "100%", maxWidth: "100%", margin: "0 auto", padding: "32px 40px 60px" },
  formCard: { background: "#fff", borderRadius: 16, padding: 36, boxShadow: "0 4px 32px rgba(0,0,0,0.08)", maxWidth: 680, margin: "0 auto", border: "1px solid #DBEAFE" },
  formTitle: { fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 700, color: "#1E3A8A", marginBottom: 6 },
  formSub: { fontSize: 13, color: "#6B7280", marginBottom: 12 },
  progressHint: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", background: "#F0F4FF", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12 },
  progressStep: { fontWeight: 600, color: "#1E3A8A", fontSize: 12 },
  progressArrow: { color: "#EF4444", fontSize: 13 },
  voteWarning: { background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 8, padding: "8px 14px", fontSize: 12, color: "#C2410C", marginBottom: 20, fontWeight: 500 },
  formGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "1px", color: "#6B7280", textTransform: "uppercase", marginBottom: 6 },
  input: { width: "100%", background: "#F0F4FF", border: "1.5px solid #DBEAFE", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#1E3A8A", outline: "none", fontFamily: "inherit" },
  textarea: { width: "100%", background: "#F0F4FF", border: "1.5px solid #DBEAFE", borderRadius: 8, padding: "12px 14px", fontSize: 14, color: "#1E3A8A", resize: "vertical", outline: "none", lineHeight: 1.6, fontFamily: "inherit" },
  tagChip: { background: "#F0F4FF", border: "1.5px solid #DBEAFE", borderRadius: 20, padding: "5px 14px", fontSize: 13, cursor: "pointer", color: "#1E3A8A" },
  tagChipActive: { background: "#1E3A8A", borderColor: "#1E3A8A", color: "#fff" },
  submitBtn: { background: "#1E3A8A", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 },
  filterBtn: { background: "transparent", border: "1.5px solid #DBEAFE", borderRadius: 20, padding: "6px 16px", fontSize: 13, cursor: "pointer", color: "#1E3A8A" },
  filterActive: { background: "#1E3A8A", borderColor: "#1E3A8A", color: "#fff" },
  card: { borderRadius: 12, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", display: "flex", flexDirection: "column", gap: 10 },
  stageBadgeCard: { borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, alignSelf: "flex-start", letterSpacing: "0.3px" },
  cardHeader: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { fontSize: 26, lineHeight: 1, flexShrink: 0 },
  authorName: { fontWeight: 600, fontSize: 14 },
  authorCohort: { fontSize: 11, color: "#6B7280" },
  deleteX: { background: "transparent", border: "none", color: "#CBD5E1", cursor: "pointer", fontSize: 12, padding: "2px 4px", flexShrink: 0 },
  cardTag: { display: "inline-block", fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "3px 10px", alignSelf: "flex-start" },
  cardText: { fontSize: 14, color: "#1E3A8A", lineHeight: 1.65, flex: 1 },
  progressBar: { height: 4, background: "#E2E8F0", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2, transition: "width 0.5s ease" },
  cardFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(30,58,138,0.08)" },
  timeAgo: { fontSize: 11, color: "#93C5FD" },
  empty: { textAlign: "center", padding: "80px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  emptyTitle: { fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#1E3A8A", fontWeight: 700 },
  emptySub: { fontSize: 14, color: "#6B7280", marginBottom: 16 },
  toast: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1E3A8A", color: "#FFFFFF", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap", border: "1px solid rgba(147,197,253,0.3)" },
  footerNote: { textAlign: "center", fontSize: 11, color: "#93C5FD", padding: "0 0 24px", letterSpacing: "0.3px" },
};