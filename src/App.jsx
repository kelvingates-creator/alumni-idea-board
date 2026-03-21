import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const AVATARS = ["🐅","🎓","🧠","🚀","🌟","💼","🦁","🏆","🌍","⚡","🔥","💎","🎯","🦊","🐉","🎪","🌊","🦅","🎭","🏅"];
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
  idea: { bg: "#EFF6FF", border: "#3B82F6", tag: "#1D4ED8", label: "💡 Idea", badge: null, heartColor: "#EF4444", progressColor: "#3B82F6" },
  collaborate: { bg: "#F5F3FF", border: "#7C3AED", tag: "#5B21B6", label: "🤝 Collaborate", badge: "🔥 Gaining Traction", heartColor: "#7C3AED", progressColor: "#7C3AED" },
  win: { bg: "#FFFBEB", border: "#F59E0B", tag: "#B45309", label: "🎉 Win", badge: "⭐ Community Win", heartColor: "#F59E0B", progressColor: "#F59E0B" },
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function HeartRow({ likes, ideaId, votedIds, onLike, heartColor, stage }) {
  const { filled, total } = getStageHearts(likes);
  const alreadyVoted = votedIds.includes(ideaId);
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

// ── Auth Screen ──────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
      });
      if (error) { setError(error.message); setLoading(false); return; }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
    }
    setLoading(false);
    onAuth();
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Enter your email first"); return; }
    await supabase.auth.resetPasswordForEmail(email);
    setError("Password reset email sent!");
  };

  return (
    <div style={a.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        button { font-family: 'DM Sans', sans-serif; }
      `}</style>
      <div style={a.card}>
        <div style={a.logo}>🐅</div>
        <h1 style={a.title}>THEE Alumni Network</h1>
        <p style={a.sub}>{mode === "signin" ? "Welcome back! Sign in to continue." : "Join the network — create your account."}</p>
        <div style={a.toggle}>
          <button style={{ ...a.toggleBtn, ...(mode === "signin" ? a.toggleActive : {}) }}
            onClick={() => { setMode("signin"); setError(""); }}>Sign In</button>
          <button style={{ ...a.toggleBtn, ...(mode === "signup" ? a.toggleActive : {}) }}
            onClick={() => { setMode("signup"); setError(""); }}>Sign Up</button>
        </div>
        {mode === "signup" && (
          <div style={a.formGroup}>
            <label style={a.label}>Your Name *</label>
            <input style={a.input} placeholder="e.g. Jordan Rivera"
              value={name} onChange={e => setName(e.target.value)} />
          </div>
        )}
        <div style={a.formGroup}>
          <label style={a.label}>Email *</label>
          <input style={a.input} type="email" placeholder="your@email.com"
            value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div style={a.formGroup}>
          <label style={a.label}>Password *</label>
          <input style={a.input} type="password" placeholder="••••••••"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
        </div>
        {error && (
          <div style={{
            ...a.error,
            background: error.includes("sent") ? "#F0FDF4" : "#FEF2F2",
            color: error.includes("sent") ? "#166534" : "#DC2626",
            border: `1px solid ${error.includes("sent") ? "#BBF7D0" : "#FECACA"}`,
          }}>{error}</div>
        )}
        <button style={a.submitBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Please wait..." : mode === "signin" ? "Sign In →" : "Create Account →"}
        </button>
        {mode === "signin" && (
          <button style={a.forgotBtn} onClick={handleForgotPassword}>Forgot password?</button>
        )}

        <div style={a.divider}>
          <span style={a.dividerLine} />
          <span style={a.dividerText}>or</span>
          <span style={a.dividerLine} />
        </div>

        <button style={a.googleBtn} onClick={async () => {
          await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: 'https://thee-alumni-board.netlify.app'
            }
          });
        }}>
          <span style={{ fontSize: 18, fontWeight: 800, background: "linear-gradient(to right, #4285F4, #EA4335, #FBBC05, #34A853)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>G</span> Continue with Google
              </button>
        )}
      </div>
    </div>
  );
}

const a = {
  root: { minHeight: "100vh", width: "100vw", background: "#F0F4FF", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 20 },
  card: { background: "#fff", borderRadius: 16, padding: 40, boxShadow: "0 4px 32px rgba(0,0,0,0.1)", width: "100%", maxWidth: 420, border: "1px solid #DBEAFE", animation: "fadeUp 0.3s ease" },
  logo: { fontSize: 48, textAlign: "center", marginBottom: 12 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 900, color: "#1E3A8A", textAlign: "center", marginBottom: 6 },
  sub: { fontSize: 13, color: "#6B7280", textAlign: "center", marginBottom: 24 },
  toggle: { display: "flex", background: "#F0F4FF", borderRadius: 8, padding: 4, marginBottom: 24, gap: 4 },
  toggleBtn: { flex: 1, background: "transparent", border: "none", borderRadius: 6, padding: "8px 0", fontSize: 14, color: "#6B7280", cursor: "pointer", fontWeight: 500 },
  toggleActive: { background: "#1E3A8A", color: "#fff" },
  formGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "1px", color: "#6B7280", textTransform: "uppercase", marginBottom: 6 },
  input: { width: "100%", background: "#F0F4FF", border: "1.5px solid #DBEAFE", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#1E3A8A", outline: "none", fontFamily: "inherit" },
  error: { borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16, fontWeight: 500 },
  submitBtn: { width: "100%", background: "#1E3A8A", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginBottom: 12 },
  forgotBtn: { width: "100%", background: "transparent", border: "none", color: "#93C5FD", fontSize: 13, cursor: "pointer", textAlign: "center" },
  divider: { display: "flex", alignItems: "center", gap: 10, margin: "16px 0" },
  dividerLine: { flex: 1, height: 1, background: "#DBEAFE" },
  dividerText: { fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" },
  googleBtn: { width: "100%", background: "#fff", border: "1.5px solid #DBEAFE", borderRadius: 8, padding: "11px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, color: "#1E3A8A", fontFamily: "inherit", textAlign: "center" },
};

// ── Profile Page ─────────────────────────────────────────
function ProfilePage({ user, onClose }) {
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [cohort, setCohort] = useState("");
  const [avatar, setAvatar] = useState("🐅");
  const [myIdeas, setMyIdeas] = useState([]);
  const [myVotes, setMyVotes] = useState(0);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    fetchProfile();
    fetchMyIdeas();
    fetchMyVotes();
  }, []);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (data) {
      setProfile(data);
      setFullName(data.full_name || user.user_metadata?.full_name || "");
      setBio(data.bio || "");
      setCohort(data.cohort || "");
      setAvatar(data.avatar || "🐅");
    }
  };

  const fetchMyIdeas = async () => {
    const { data } = await supabase
      .from("ideas")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMyIdeas(data || []);
  };

  const fetchMyVotes = async () => {
    const { count } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    setMyVotes(count || 0);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, bio, cohort, avatar })
      .eq("id", user.id);
    if (error) { flash("❌ Error saving profile"); setSaving(false); return; }

    // Also update ideas with new name and avatar
    await supabase
      .from("ideas")
      .update({ author_name: fullName, author_cohort: cohort, avatar })
      .eq("user_id", user.id);

    flash("✅ Profile saved!");
    setSaving(false);
  };

  const wins = myIdeas.filter(i => getStage(i.likes || 0) === "win").length;
  const collaborating = myIdeas.filter(i => getStage(i.likes || 0) === "collaborate").length;

  return (
    <div style={pr.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        button { font-family: 'DM Sans', sans-serif; }
        .avatar-option:hover { transform: scale(1.2); }
        .avatar-option { transition: transform 0.15s; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div style={pr.header}>
        <div style={pr.headerLeft}>
          <span style={{ fontSize: 36 }}>{avatar}</span>
          <div>
            <h1 style={pr.title}>My Profile</h1>
            <p style={pr.sub}>{user.email}</p>
          </div>
        </div>
        <button style={pr.closeBtn} onClick={onClose}>← Back to Board</button>
      </div>

      <div style={pr.body}>

        {/* Stats */}
        <div style={pr.statsRow}>
          {[
            { icon: "💡", value: myIdeas.length, label: "Ideas Posted" },
            { icon: "❤️", value: myVotes, label: "Votes Given" },
            { icon: "🤝", value: collaborating, label: "Collaborating" },
            { icon: "🎉", value: wins, label: "Wins" },
          ].map(stat => (
            <div key={stat.label} style={pr.statCard}>
              <div style={{ fontSize: 24 }}>{stat.icon}</div>
              <div style={pr.statValue}>{stat.value}</div>
              <div style={pr.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        <div style={pr.grid}>
          {/* Edit Profile */}
          <div style={pr.card}>
            <h2 style={pr.cardTitle}>Edit Profile</h2>

            <div style={pr.formGroup}>
              <label style={pr.label}>Display Name</label>
              <input style={pr.input} placeholder="Your name"
                value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>

            <div style={pr.formGroup}>
              <label style={pr.label}>Cohort / Year</label>
              <input style={pr.input} placeholder="e.g. Class of 2019"
                value={cohort} onChange={e => setCohort(e.target.value)} />
            </div>

            <div style={pr.formGroup}>
              <label style={pr.label}>Bio</label>
              <textarea style={pr.textarea} rows={3}
                placeholder="Tell the alumni community about yourself..."
                value={bio} onChange={e => setBio(e.target.value)} />
            </div>

            <div style={pr.formGroup}>
              <label style={pr.label}>Choose Your Avatar</label>
              <div style={pr.avatarGrid}>
                {AVATARS.map(em => (
                  <span key={em} className="avatar-option"
                    onClick={() => setAvatar(em)}
                    style={{
                      fontSize: 28,
                      padding: 6,
                      borderRadius: 8,
                      background: avatar === em ? "#DBEAFE" : "transparent",
                      border: avatar === em ? "2px solid #3B82F6" : "2px solid transparent",
                    }}>
                    {em}
                  </span>
                ))}
              </div>
            </div>

            <button style={pr.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Profile →"}
            </button>
          </div>

          {/* My Ideas */}
          <div style={pr.card}>
            <h2 style={pr.cardTitle}>My Ideas ({myIdeas.length})</h2>
            {myIdeas.length === 0 ? (
              <div style={pr.empty}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💭</div>
                <div style={{ color: "#6B7280", fontSize: 13 }}>No ideas posted yet</div>
              </div>
            ) : (
              <div style={pr.ideaList}>
                {myIdeas.map(idea => {
                  const stage = getStage(idea.likes || 0);
                  const style = STAGE_STYLES[stage];
                  return (
                    <div key={idea.id} style={{
                      ...pr.ideaRow,
                      borderLeft: `3px solid ${style.border}`,
                      background: style.bg,
                    }}>
                      <div style={pr.ideaRowHeader}>
                        <span style={{ ...pr.ideaTag, color: style.tag, background: `${style.border}22` }}>
                          {idea.tag}
                        </span>
                        <span style={{ ...pr.ideaStage, color: style.tag }}>
                          {style.label}
                        </span>
                        <span style={pr.ideaLikes}>❤️ {idea.likes || 0}</span>
                      </div>
                      <p style={pr.ideaText}>{idea.text}</p>
                      <div style={pr.ideaMeta}>{timeAgo(idea.created_at)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {toast && <div style={pr.toast}>{toast}</div>}
    </div>
  );
}

const pr = {
  root: { minHeight: "100vh", width: "100vw", maxWidth: "100vw", background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" },
  header: { background: "#1E3A8A", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: "#FFFFFF" },
  sub: { fontSize: 12, color: "#93C5FD" },
  closeBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 18px", color: "#fff", fontSize: 13, cursor: "pointer" },
  body: { padding: "32px" },
  statsRow: { display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" },
  statCard: { flex: 1, minWidth: 100, background: "#fff", borderRadius: 12, padding: "20px", textAlign: "center", border: "1px solid #DBEAFE", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" },
  statValue: { fontSize: 32, fontWeight: 700, color: "#1E3A8A", lineHeight: 1, margin: "6px 0" },
  statLabel: { fontSize: 11, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.5px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 },
  card: { background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #DBEAFE" },
  cardTitle: { fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: "#1E3A8A", marginBottom: 20 },
  formGroup: { marginBottom: 16 },
  label: { display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "1px", color: "#6B7280", textTransform: "uppercase", marginBottom: 6 },
  input: { width: "100%", background: "#F0F4FF", border: "1.5px solid #DBEAFE", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#1E3A8A", outline: "none", fontFamily: "inherit" },
  textarea: { width: "100%", background: "#F0F4FF", border: "1.5px solid #DBEAFE", borderRadius: 8, padding: "10px 14px", fontSize: 14, color: "#1E3A8A", outline: "none", fontFamily: "inherit", resize: "vertical", lineHeight: 1.6 },
  avatarGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  saveBtn: { background: "#1E3A8A", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8, width: "100%" },
  empty: { textAlign: "center", padding: "40px 20px" },
  ideaList: { display: "flex", flexDirection: "column", gap: 10, maxHeight: 500, overflowY: "auto" },
  ideaRow: { borderRadius: 8, padding: "12px 14px" },
  ideaRowHeader: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" },
  ideaTag: { fontSize: 11, fontWeight: 600, borderRadius: 20, padding: "2px 8px" },
  ideaStage: { fontSize: 11, fontWeight: 600 },
  ideaLikes: { fontSize: 11, color: "#6B7280", marginLeft: "auto" },
  ideaText: { fontSize: 13, color: "#374151", lineHeight: 1.5, marginBottom: 4 },
  ideaMeta: { fontSize: 11, color: "#9CA3AF" },
  toast: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1E3A8A", color: "#FFFFFF", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap" },
};

// ── Admin Panel ──────────────────────────────────────────
function AdminPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState("ideas");
  const [ideas, setIdeas] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [toast, setToast] = useState("");

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const { data: ideasData } = await supabase.from("ideas").select("*").order("created_at", { ascending: false });
    const { data: usersData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setIdeas(ideasData || []);
    setUsers(usersData || []);
    setStats({
      totalIdeas: ideasData?.length || 0,
      totalUsers: usersData?.length || 0,
      totalVotes: ideasData?.reduce((acc, i) => acc + (i.likes || 0), 0) || 0,
      pinnedIdeas: ideasData?.filter(i => i.is_pinned).length || 0,
      hiddenIdeas: ideasData?.filter(i => i.is_hidden).length || 0,
      wins: ideasData?.filter(i => getStage(i.likes || 0) === "win").length || 0,
    });
  };

  const togglePin = async (idea) => {
    await supabase.from("ideas").update({ is_pinned: !idea.is_pinned }).eq("id", idea.id);
    flash(idea.is_pinned ? "📌 Unpinned" : "📌 Pinned to top!");
    fetchAll();
  };

  const toggleHide = async (idea) => {
    await supabase.from("ideas").update({ is_hidden: !idea.is_hidden }).eq("id", idea.id);
    flash(idea.is_hidden ? "👁 Unhidden" : "🚫 Hidden from board");
    fetchAll();
  };

  const deleteIdea = async (idea) => {
    await supabase.from("ideas").delete().eq("id", idea.id);
    flash("🗑 Deleted");
    fetchAll();
  };

  const toggleBan = async (user) => {
    await supabase.from("profiles").update({ is_banned: !user.is_banned }).eq("id", user.id);
    flash(user.is_banned ? "✅ User unbanned" : "🚫 User banned");
    fetchAll();
  };

  const toggleAdmin = async (user) => {
    await supabase.from("profiles").update({ is_admin: !user.is_admin }).eq("id", user.id);
    flash(user.is_admin ? "👤 Admin removed" : "👑 Admin granted");
    fetchAll();
  };

  return (
    <div style={p.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { font-family: 'DM Sans', sans-serif; }
        .admin-row:hover { background: rgba(30,58,138,0.04) !important; }
      `}</style>
      <div style={p.header}>
        <div style={p.headerLeft}>
          <span style={{ fontSize: 24 }}>👑</span>
          <div>
            <h1 style={p.title}>Admin Panel</h1>
            <p style={p.sub}>THEE Alumni Network</p>
          </div>
        </div>
        <button style={p.closeBtn} onClick={onClose}>← Back to Board</button>
      </div>
      <div style={p.statsBar}>
        {[
          { label: "Total Ideas", value: stats.totalIdeas, icon: "💡" },
          { label: "Total Users", value: stats.totalUsers, icon: "👥" },
          { label: "Total Votes", value: stats.totalVotes, icon: "❤️" },
          { label: "Pinned", value: stats.pinnedIdeas, icon: "📌" },
          { label: "Hidden", value: stats.hiddenIdeas, icon: "🚫" },
          { label: "Wins", value: stats.wins, icon: "🎉" },
        ].map(stat => (
          <div key={stat.label} style={p.statCard}>
            <div style={p.statIcon}>{stat.icon}</div>
            <div style={p.statValue}>{stat.value}</div>
            <div style={p.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>
      <div style={p.tabs}>
        {["ideas", "users"].map(tab => (
          <button key={tab} style={{ ...p.tab, ...(activeTab === tab ? p.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}>
            {tab === "ideas" ? `💡 Ideas (${ideas.length})` : `👥 Users (${users.length})`}
          </button>
        ))}
      </div>
      {activeTab === "ideas" && (
        <div style={p.body}>
          {ideas.map(idea => (
            <div key={idea.id} className="admin-row" style={{
              ...p.row,
              background: idea.is_hidden ? "#FEF2F2" : idea.is_pinned ? "#F0FDF4" : "#fff",
              borderLeft: `4px solid ${idea.is_hidden ? "#EF4444" : idea.is_pinned ? "#22C55E" : "#DBEAFE"}`,
            }}>
              <div style={p.rowMain}>
                <div style={p.rowHeader}>
                  <span style={p.rowAuthor}>{idea.author_name || "Unknown"}</span>
                  <span style={p.rowTag}>{idea.tag}</span>
                  <span style={p.rowStage}>{getStage(idea.likes || 0)}</span>
                  {idea.is_pinned && <span style={p.pinnedBadge}>📌 Pinned</span>}
                  {idea.is_hidden && <span style={p.hiddenBadge}>🚫 Hidden</span>}
                </div>
                <p style={p.rowText}>{idea.text}</p>
                <div style={p.rowMeta}>
                  <span>❤️ {idea.likes || 0} votes</span>
                  <span>{timeAgo(idea.created_at)}</span>
                </div>
              </div>
              <div style={p.rowActions}>
                <button style={{ ...p.actionBtn, background: idea.is_pinned ? "#DCFCE7" : "#F0F4FF", color: idea.is_pinned ? "#166534" : "#1E3A8A" }}
                  onClick={() => togglePin(idea)}>{idea.is_pinned ? "Unpin" : "📌 Pin"}</button>
                <button style={{ ...p.actionBtn, background: idea.is_hidden ? "#FEF9C3" : "#FEF2F2", color: idea.is_hidden ? "#854D0E" : "#DC2626" }}
                  onClick={() => toggleHide(idea)}>{idea.is_hidden ? "👁 Unhide" : "🚫 Hide"}</button>
                <button style={{ ...p.actionBtn, background: "#FEF2F2", color: "#DC2626" }}
                  onClick={() => deleteIdea(idea)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {activeTab === "users" && (
        <div style={p.body}>
          {users.map(user => (
            <div key={user.id} className="admin-row" style={{
              ...p.row,
              background: user.is_banned ? "#FEF2F2" : "#fff",
              borderLeft: `4px solid ${user.is_banned ? "#EF4444" : user.is_admin ? "#F59E0B" : "#DBEAFE"}`,
            }}>
              <div style={p.rowMain}>
                <div style={p.rowHeader}>
                  <span style={{ fontSize: 20 }}>{user.avatar || "🐅"}</span>
                  <span style={p.rowAuthor}>{user.full_name || user.email || "Unknown"}</span>
                  {user.cohort && <span style={p.rowTag}>{user.cohort}</span>}
                  {user.is_admin && <span style={p.adminBadge}>👑 Admin</span>}
                  {user.is_banned && <span style={p.bannedBadge}>🚫 Banned</span>}
                </div>
                {user.bio && <p style={p.rowText}>{user.bio}</p>}
                <div style={p.rowMeta}>
                  <span>{user.email}</span>
                  <span>Joined {timeAgo(user.created_at)}</span>
                </div>
              </div>
              <div style={p.rowActions}>
                <button style={{ ...p.actionBtn, background: user.is_admin ? "#FEF3C7" : "#F0F4FF", color: user.is_admin ? "#B45309" : "#1E3A8A" }}
                  onClick={() => toggleAdmin(user)}>{user.is_admin ? "Remove Admin" : "👑 Make Admin"}</button>
                <button style={{ ...p.actionBtn, background: user.is_banned ? "#F0FDF4" : "#FEF2F2", color: user.is_banned ? "#166534" : "#DC2626" }}
                  onClick={() => toggleBan(user)}>{user.is_banned ? "✅ Unban" : "🚫 Ban"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && <div style={p.toast}>{toast}</div>}
    </div>
  );
}

const p = {
  root: { minHeight: "100vh", width: "100vw", maxWidth: "100vw", background: "#F0F4FF", fontFamily: "'DM Sans', sans-serif" },
  header: { background: "#1C1208", padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  title: { fontFamily: "'Playfair Display', serif", fontSize: 26, fontWeight: 900, color: "#FFF8E7" },
  sub: { fontSize: 12, color: "#8a7560" },
  closeBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 18px", color: "#fff", fontSize: 13, cursor: "pointer" },
  statsBar: { display: "flex", gap: 16, padding: "24px 32px", flexWrap: "wrap", background: "#fff", borderBottom: "1px solid #DBEAFE" },
  statCard: { flex: 1, minWidth: 100, background: "#F0F4FF", borderRadius: 12, padding: "16px 20px", textAlign: "center", border: "1px solid #DBEAFE" },
  statIcon: { fontSize: 24, marginBottom: 6 },
  statValue: { fontSize: 28, fontWeight: 700, color: "#1E3A8A", lineHeight: 1 },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" },
  tabs: { display: "flex", gap: 8, padding: "16px 32px", background: "#fff", borderBottom: "1px solid #DBEAFE" },
  tab: { background: "transparent", border: "1.5px solid #DBEAFE", borderRadius: 20, padding: "6px 20px", fontSize: 13, cursor: "pointer", color: "#1E3A8A", fontWeight: 500 },
  tabActive: { background: "#1E3A8A", borderColor: "#1E3A8A", color: "#fff" },
  body: { padding: "24px 32px", display: "flex", flexDirection: "column", gap: 12 },
  row: { borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", transition: "background 0.15s" },
  rowMain: { flex: 1, minWidth: 200 },
  rowHeader: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 },
  rowAuthor: { fontWeight: 600, fontSize: 14, color: "#1E3A8A" },
  rowTag: { background: "#EFF6FF", color: "#1D4ED8", fontSize: 11, borderRadius: 20, padding: "2px 8px", fontWeight: 600 },
  rowStage: { background: "#F5F3FF", color: "#5B21B6", fontSize: 11, borderRadius: 20, padding: "2px 8px", fontWeight: 600 },
  pinnedBadge: { background: "#DCFCE7", color: "#166534", fontSize: 11, borderRadius: 20, padding: "2px 8px", fontWeight: 600 },
  hiddenBadge: { background: "#FEE2E2", color: "#DC2626", fontSize: 11, borderRadius: 20, padding: "2px 8px", fontWeight: 600 },
  adminBadge: { background: "#FEF3C7", color: "#B45309", fontSize: 11, borderRadius: 20, padding: "2px 8px", fontWeight: 600 },
  bannedBadge: { background: "#FEE2E2", color: "#DC2626", fontSize: 11, borderRadius: 20, padding: "2px 8px", fontWeight: 600 },
  rowText: { fontSize: 13, color: "#374151", lineHeight: 1.5, marginBottom: 6 },
  rowMeta: { display: "flex", gap: 16, fontSize: 11, color: "#9CA3AF" },
  rowActions: { display: "flex", gap: 8, flexWrap: "wrap" },
  actionBtn: { border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" },
  toast: { position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "#1C1208", color: "#FFF8E7", borderRadius: 8, padding: "11px 22px", fontSize: 14, fontWeight: 500, zIndex: 999, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap" },
};

// ── Main App ─────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [votedIds, setVotedIds] = useState([]);
  const [view, setView] = useState("board");
  const [filterTag, setFilterTag] = useState("All");
  const [filterStage, setFilterStage] = useState("All");
  const [name, setName] = useState("");
  const [userAvatar, setUserAvatar] = useState("🐅");
  const [cohort, setCohort] = useState("");
  const [text, setText] = useState("");
  const [tag, setTag] = useState(TAGS[0]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setName(session.user.user_metadata?.full_name || session.user.email);
        fetchProfile(session.user.id);
        fetchVotes(session.user.id);
      }
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setName(session.user.user_metadata?.full_name || session.user.email);
        fetchProfile(session.user.id);
        fetchVotes(session.user.id);
      } else {
        setIsAdmin(false);
        setVotedIds([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;
    fetchIdeas();
    const channel = supabase
      .channel("ideas-channel")
      .on("postgres_changes", { event: "*", schema: "public", table: "ideas" }, () => fetchIdeas())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [authReady, user]);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setIsAdmin(data.is_admin || false);
      setUserAvatar(data.avatar || "🐅");
      if (data.full_name) setName(data.full_name);
      if (data.cohort) setCohort(data.cohort);
    }
  };

  const fetchVotes = async (userId) => {
    const { data } = await supabase.from("votes").select("idea_id").eq("user_id", userId);
    if (data) setVotedIds(data.map(v => v.idea_id));
  };

  const fetchIdeas = async () => {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .eq("is_hidden", false)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error) setIdeas(data || []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setName("");
    setIsAdmin(false);
    setVotedIds([]);
    setUserAvatar("🐅");
  };

  const handleSubmit = async () => {
    if (!text.trim() || !name.trim()) { flash("⚠️ Name and idea are required"); return; }
    const { error } = await supabase.from("ideas").insert({
      text: text.trim(), tag,
      author_name: name.trim(),
      author_cohort: cohort.trim(),
      avatar: userAvatar,
      likes: 0,
      user_id: user?.id || null,
      user_email: user?.email || null,
      is_pinned: false,
      is_hidden: false,
    });
    if (error) { flash("❌ Error posting idea"); return; }
    await fetchIdeas();
    setText("");
    setTag(TAGS[0]);
    setView("board");
    flash("🎉 Your idea is live on the board!");
  };

  const handleLike = async (idea) => {
    if (votedIds.includes(idea.id)) { flash("⚠️ You already voted on this idea!"); return; }
    const newLikes = (idea.likes || 0) + 1;
    const oldStage = getStage(idea.likes || 0);
    const newStage = getStage(newLikes);
    const { error: voteError } = await supabase.from("votes").insert({ user_id: user.id, idea_id: idea.id });
    if (voteError) { flash("❌ Error recording vote"); return; }
    const { error: likeError } = await supabase.from("ideas").update({ likes: newLikes }).eq("id", idea.id);
    if (likeError) { flash("❌ Error updating vote"); return; }
    setVotedIds([...votedIds, idea.id]);
    await fetchIdeas();
    if (newStage !== oldStage) {
      if (newStage === "collaborate") flash("🔥 This idea is gaining traction!");
      if (newStage === "win") flash("⭐ This idea just became a Community Win!");
    }
  };

  const handleDelete = async (idea) => {
    if (idea.user_id !== user?.id && !isAdmin) { flash("⚠️ You can only delete your own ideas!"); return; }
    await supabase.from("ideas").delete().eq("id", idea.id);
    await fetchIdeas();
    flash("🗑 Removed");
  };

  if (view === "admin" && isAdmin) return <AdminPanel onClose={() => setView("board")} />;
  if (view === "profile") return <ProfilePage user={user} onClose={() => { setView("board"); fetchProfile(user.id); }} />;

  const filtered = ideas.filter(i => {
    const tagMatch = filterTag === "All" || i.tag === filterTag;
    const stageMatch = filterStage === "All" || getStage(i.likes || 0) === filterStage;
    return tagMatch && stageMatch;
  });

  const winCount = ideas.filter(i => getStage(i.likes || 0) === "win").length;
  const colabCount = ideas.filter(i => getStage(i.likes || 0) === "collaborate").length;

  if (!authReady) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#F0F4FF" }}>
      <div style={{ fontSize: 48 }}>🐅</div>
    </div>
  );

  if (!user) return <AuthScreen onAuth={() => supabase.auth.getSession()} />;

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
            <button style={s.userPill} onClick={() => setView("profile")}>
              {isAdmin ? "👑" : userAvatar} {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
            </button>
            {isAdmin && (
              <button style={s.adminBtn} onClick={() => setView("admin")}>👑 Admin</button>
            )}
            <button style={s.signOutBtn} onClick={handleSignOut}>Sign Out</button>
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
                <input style={{ ...s.input, background: "#E8F0FE" }} value={name} readOnly />
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
                  <button key={t} style={{ ...s.tagChip, ...(tag === t ? s.tagChipActive : {}) }}
                    onClick={() => setTag(t)}>{t}</button>
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

        {view === "board" && (
          <>
            <div className="filter-bar">
              {["All", ...TAGS].map(t => (
                <button key={t}
                  style={{ ...s.filterBtn, ...(filterTag === t ? s.filterActive : {}) }}
                  onClick={() => setFilterTag(t)}>{t}</button>
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
                <button style={s.submitBtn} onClick={() => setView("submit")}>Share the First Idea →</button>
              </div>
            ) : (
              <div className="ideas-grid">
                {filtered.map((idea, i) => {
                  const stage = getStage(idea.likes || 0);
                  const style = STAGE_STYLES[stage];
                  const cardClass = stage === "win" ? "card-win" : stage === "collaborate" ? "card-collaborate" : "card";
                  const isMyIdea = user && idea.user_id === user.id;
                  const canDelete = isMyIdea || isAdmin;
                  return (
                    <div key={idea.id} className={cardClass}
                      style={{
                        ...s.card,
                        background: style.bg,
                        borderTop: `4px solid ${idea.is_pinned ? "#22C55E" : style.border}`,
                        animationDelay: `${Math.min(i * 0.05, 0.3)}s`,
                      }}>
                      {idea.is_pinned && <div style={s.pinnedBanner}>📌 Pinned by Admin</div>}
                      {style.badge && (
                        <div style={{
                          ...s.stageBadgeCard,
                          background: stage === "win" ? "#FEF3C7" : "#EDE9FE",
                          color: stage === "win" ? "#B45309" : "#5B21B6",
                          border: `1px solid ${style.border}`,
                        }}>{style.badge}</div>
                      )}
                      <div style={s.cardHeader}>
                        <div style={s.avatar}>{idea.avatar || "🐅"}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ ...s.authorName, color: style.tag }}>
                            {idea.author_name || "Alumni"}
                            {isMyIdea && <span style={s.myBadge}>you</span>}
                          </div>
                          {idea.author_cohort && <div style={s.authorCohort}>{idea.author_cohort}</div>}
                        </div>
                        {canDelete && <button style={s.deleteX} onClick={() => handleDelete(idea)}>✕</button>}
                      </div>
                      <span style={{ ...s.cardTag, color: style.tag, background: `${style.border}22` }}>{idea.tag}</span>
                      <p style={s.cardText}>{idea.text}</p>
                      <div style={s.progressBar}>
                        <div style={{ ...s.progressFill, width: `${getProgressPct(idea.likes || 0)}%`, background: style.progressColor }} />
                      </div>
                      <div style={s.cardFooter}>
                        <span style={s.timeAgo}>{timeAgo(idea.created_at)}</span>
                        <HeartRow
                          likes={idea.likes || 0}
                          ideaId={idea.id}
                          votedIds={votedIds}
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
      <div style={s.footerNote}>⚡ THEE Alumni Network · Ideas → Collaborate → Win</div>
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
  userPill: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#fff", fontWeight: 600, cursor: "pointer" },
  adminBtn: { background: "#F59E0B", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  postBtn: { background: "#FFFFFF", color: "#1E3A8A", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" },
  cancelBtn: { background: "transparent", color: "#BFDBFE", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "10px 20px", fontSize: 14, cursor: "pointer", whiteSpace: "nowrap" },
  signOutBtn: { background: "transparent", color: "#93C5FD", border: "1px solid rgba(147,197,253,0.3)", borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" },
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
  pinnedBanner: { background: "#DCFCE7", color: "#166534", fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "4px 10px", alignSelf: "flex-start" },
  stageBadgeCard: { borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, alignSelf: "flex-start", letterSpacing: "0.3px" },
  cardHeader: { display: "flex", alignItems: "center", gap: 10 },
  avatar: { fontSize: 26, lineHeight: 1, flexShrink: 0 },
  authorName: { fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 6 },
  myBadge: { background: "#DBEAFE", color: "#1E3A8A", fontSize: 10, borderRadius: 10, padding: "1px 7px", fontWeight: 600 },
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
