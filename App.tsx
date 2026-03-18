import { useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./src/lib/supabase";

type Reply = {
  id: string;
  name: string;
  text: string;
  createdAt: string;
};

type PostStatus = "Open" | "Solved" | "Archived";
type FilterStatus = "Live" | "Solved" | "Archive";

type Post = {
  id: string;
  name: string;
  tag: string;
  text: string;
  image?: string;
  replies: Reply[];
  createdAt: string;
  status: PostStatus;
};

type CommentRow = {
  id: string;
  content: string | null;
  image_url: string | null;
  parent_id: string | null;
  created_at: string;
  name: string | null;
  tag: string | null;
  status: string | null;
  user_id: string | null;
  user_email: string | null;
};

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
};

export default function App() {
  const [page, setPage] = useState<"home" | "feed">("home");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("Live");

  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const [tag, setTag] = useState("Idea");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);

  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  const timeAgo = (timestamp: string) => {
    const seconds = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;

    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const tagColor = (tagValue: string) => {
    if (tagValue === "Bug") return "#b94141";
    if (tagValue === "Question") return "#8a6d1f";
    if (tagValue === "Update") return "#2a6fa1";
    return "#3f7d36";
  };

  const statusColor = (status: PostStatus) => {
    if (status === "Solved") return "#2f8f4e";
    if (status === "Archived") return "#5b6575";
    return "#d08b28";
  };

  const currentUserName =
    profile?.full_name?.trim() ||
    session?.user?.user_metadata?.full_name ||
    session?.user?.email?.split("@")[0] ||
    "User";

  const currentUserEmail = session?.user?.email || "";

  const ensureProfile = async (user: User, explicitName?: string) => {
    const fallbackName =
      explicitName?.trim() ||
      user.user_metadata?.full_name ||
      user.email?.split("@")[0] ||
      "User";

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Profile load error:", error);
      setProfile({
        id: user.id,
        email: user.email || null,
        full_name: fallbackName,
        role: "staff",
      });
      return;
    }

    if (!data) {
      const { error: insertError } = await supabase.from("profiles").upsert({
        id: user.id,
        email: user.email || null,
        full_name: fallbackName,
      });

      if (insertError) {
        console.error("Profile create error:", insertError);
        setProfile({
          id: user.id,
          email: user.email || null,
          full_name: fallbackName,
          role: "staff",
        });
        return;
      }

      setProfile({
        id: user.id,
        email: user.email || null,
        full_name: fallbackName,
        role: "staff",
      });
      return;
    }

    setProfile(data as Profile);
  };

  useEffect(() => {
    const boot = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
        }

        const session = data?.session ?? null;
        setSession(session);

        if (session?.user) {
          try {
            await ensureProfile(session.user);
          } catch (err) {
            console.error("ensureProfile boot error:", err);
          }
        }
      } catch (err) {
        console.error("auth boot error:", err);
      }
    };

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        try {
          await ensureProfile(session.user);
        } catch (err) {
          console.error("ensureProfile auth change error:", err);
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadPosts = async () => {
    if (!session) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading posts:", error);
      alert(`Load error: ${error.message}`);
      setLoading(false);
      return;
    }

    const rows = (data || []) as CommentRow[];

    const postRows = rows.filter((row) => !row.parent_id);
    const replyRows = rows.filter((row) => !!row.parent_id);

    const mappedPosts: Post[] = postRows.map((post) => ({
      id: post.id,
      name: post.name || "Anonymous",
      tag: post.tag || "Idea",
      text: post.content || "",
      image: post.image_url || undefined,
      createdAt: post.created_at,
      status:
        post.status === "Solved" || post.status === "Archived"
          ? post.status
          : "Open",
      replies: replyRows
        .filter((reply) => reply.parent_id === post.id)
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        .map((reply) => ({
          id: reply.id,
          name: reply.name || "Anonymous",
          text: reply.content || "",
          createdAt: reply.created_at,
        })),
    }));

    setPosts(mappedPosts);
    setLoading(false);
  };

  useEffect(() => {
    if (page === "feed" && session) {
      loadPosts();
    }
  }, [page, session]);

  const uploadImage = async (file: File) => {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

    const { error } = await supabase.storage
      .from("comments")
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      alert(`Upload error: ${error.message}`);
      return null;
    }

    const { data } = supabase.storage.from("comments").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const addPost = async () => {
    if (!session || !text.trim()) return;

    let imageUrl: string | null = null;

    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) return;
    }

    const { error } = await supabase.from("comments").insert([
      {
        content: text.trim(),
        image_url: imageUrl,
        parent_id: null,
        name: currentUserName,
        tag,
        status: "Open",
        user_id: session.user.id,
        user_email: currentUserEmail,
      },
    ]);

    if (error) {
      console.error("Error saving post:", error);
      alert(`Save error: ${error.message}`);
      return;
    }

    setText("");
    setImageFile(null);
    setImagePreview(undefined);
    setTag("Idea");

    await loadPosts();
  };

  const addReply = async (postId: string) => {
    if (!session) return;

    const replyText = (replyInputs[postId] || "").trim();

    if (!replyText) return;

    const { error } = await supabase.from("comments").insert([
      {
        content: replyText,
        parent_id: postId,
        name: currentUserName,
        tag: null,
        status: null,
        user_id: session.user.id,
        user_email: currentUserEmail,
      },
    ]);

    if (error) {
      console.error("Error saving reply:", error);
      alert(`Reply error: ${error.message}`);
      return;
    }

    setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
    await loadPosts();
  };

  const updatePostStatus = async (postId: string, status: PostStatus) => {
    const { error } = await supabase
      .from("comments")
      .update({ status })
      .eq("id", postId);

    if (error) {
      console.error("Error updating status:", error);
      alert(`Status error: ${error.message}`);
      return;
    }

    await loadPosts();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSignUp = async () => {
    if (!authEmail.trim() || !authPassword.trim() || !authName.trim()) {
      alert("Please enter name, email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const { data, error } = await supabase.auth.signUp({
      email: authEmail.trim(),
      password: authPassword,
      options: {
        data: {
          full_name: authName.trim(),
        },
      },
    });

    setAuthLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user && data.session) {
      await ensureProfile(data.user, authName.trim());
      setAuthMessage("Account created and logged in.");
    } else {
      setAuthMessage("Account created. Check email to confirm, then log in.");
    }
  };

  const handleLogin = async () => {
    if (!authEmail.trim() || !authPassword.trim()) {
      alert("Please enter email and password.");
      return;
    }

    setAuthLoading(true);
    setAuthMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: authEmail.trim(),
      password: authPassword,
    });

    setAuthLoading(false);

    if (error) {
      alert(error.message);
      return;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setPage("home");
  };

  const filteredPosts = useMemo(() => {
    if (filter === "Live") {
      return posts.filter((post) => post.status !== "Archived");
    }

    if (filter === "Solved") {
      return posts.filter((post) => post.status === "Solved");
    }

    if (filter === "Archive") {
      return posts.filter((post) => post.status === "Archived");
    }

    return posts;
  }, [posts, filter]);

  const countByStatus = (status: FilterStatus) => {
    if (status === "Live") {
      return posts.filter((post) => post.status !== "Archived").length;
    }

    if (status === "Solved") {
      return posts.filter((post) => post.status === "Solved").length;
    }

    if (status === "Archive") {
      return posts.filter((post) => post.status === "Archived").length;
    }

    return 0;
  };

  if (!session) {
    return (
      <div style={loadingScreenStyle}>
        <div style={authCardStyle}>
          <h1 style={{ marginTop: 0, marginBottom: "10px", color: "white" }}>
            Nu Age AI Tools
          </h1>
          <p style={{ color: "#b7c5d9", marginBottom: "20px" }}>
            Sign in to access Team Feed and tools
          </p>

          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            <button
              style={{
                ...authTabStyle,
                background: authMode === "login" ? "#6cc04a" : "#1a2d57",
              }}
              onClick={() => setAuthMode("login")}
            >
              Login
            </button>
            <button
              style={{
                ...authTabStyle,
                background: authMode === "signup" ? "#6cc04a" : "#1a2d57",
              }}
              onClick={() => setAuthMode("signup")}
            >
              Sign up
            </button>
          </div>

          {authMode === "signup" && (
            <input
              placeholder="Full name"
              value={authName}
              onChange={(e) => setAuthName(e.target.value)}
              style={inputStyle}
            />
          )}

          <input
            placeholder="Email address"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            placeholder="Password"
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            style={inputStyle}
          />

          <button
            style={{ ...liveButton, width: "100%" }}
            onClick={authMode === "login" ? handleLogin : handleSignUp}
            disabled={authLoading}
          >
            {authLoading
              ? "Please wait..."
              : authMode === "login"
              ? "Login"
              : "Create account"}
          </button>

          {authMessage && (
            <div style={{ color: "#b7c5d9", marginTop: "14px" }}>{authMessage}</div>
          )}
        </div>
      </div>
    );
  }

  if (page === "feed") {
    return (
      <>
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            background: "#071535",
            color: "white",
            minHeight: "100vh",
            padding: "40px 20px",
          }}
        >
          <div style={{ maxWidth: "850px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <div>
                <h1 style={{ margin: 0 }}>Team Feed</h1>
                <div style={{ color: "#b7c5d9", marginTop: "6px" }}>
                  Logged in as {currentUserName}
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button style={smallActionButton} onClick={() => setPage("home")}>
                  ← Back
                </button>
                <button
                  style={{ ...smallActionButton, background: "#5b6575" }}
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>

            <div
              style={{
                background: "#102348",
                padding: "20px",
                borderRadius: "14px",
                marginBottom: "25px",
                textAlign: "left",
              }}
            >
              <h2 style={{ marginTop: 0 }}>Create Post</h2>

              <div
                style={{
                  color: "#b7c5d9",
                  marginBottom: "12px",
                  fontSize: "14px",
                }}
              >
                Posting as <strong>{currentUserName}</strong>
              </div>

              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                style={inputStyle}
              >
                <option>Idea</option>
                <option>Bug</option>
                <option>Question</option>
                <option>Update</option>
              </select>

              <textarea
                placeholder="Write your post here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={textAreaStyle}
              />

              <div style={{ marginBottom: "12px" }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>

              {imagePreview && (
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxWidth: "250px",
                    maxHeight: "180px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    marginBottom: "14px",
                    display: "block",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedImage(imagePreview)}
                />
              )}

              <button style={liveButton} onClick={addPost}>
                Post to Feed
              </button>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              {(["Live", "Solved", "Archive"] as FilterStatus[]).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  style={{
                    ...filterButton,
                    background: filter === status ? "#6cc04a" : "#1a2d57",
                    color: "white",
                  }}
                >
                  {status} ({countByStatus(status)})
                </button>
              ))}
            </div>

            {loading ? (
              <div
                style={{
                  background: "#102348",
                  padding: "20px",
                  borderRadius: "14px",
                  textAlign: "center",
                }}
              >
                Loading...
              </div>
            ) : filteredPosts.length === 0 ? (
              <div
                style={{
                  background: "#102348",
                  padding: "20px",
                  borderRadius: "14px",
                  textAlign: "center",
                }}
              >
                No posts in this filter
              </div>
            ) : (
              filteredPosts.map((post) => (
                <div
                  key={post.id}
                  style={{
                    background: "#102348",
                    padding: "18px",
                    borderRadius: "14px",
                    marginBottom: "18px",
                    textAlign: "left",
                    opacity: post.status === "Archived" ? 0.75 : 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "10px",
                      alignItems: "center",
                      marginBottom: "10px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <strong>{post.name}</strong>
                      <div style={{ fontSize: "12px", color: "#a7b4c8", marginTop: "4px" }}>
                        {timeAgo(post.createdAt)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          background: tagColor(post.tag),
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          fontWeight: "bold",
                        }}
                      >
                        {post.tag}
                      </span>

                      <span
                        style={{
                          background: statusColor(post.status),
                          padding: "6px 10px",
                          borderRadius: "999px",
                          fontSize: "13px",
                          fontWeight: "bold",
                        }}
                      >
                        {post.status}
                      </span>
                    </div>
                  </div>

                  <div style={{ whiteSpace: "pre-wrap", marginBottom: "12px" }}>
                    {post.text}
                  </div>

                  {post.image && (
                    <img
                      src={post.image}
                      alt="Post"
                      style={{
                        width: "100%",
                        maxWidth: "250px",
                        maxHeight: "180px",
                        objectFit: "cover",
                        borderRadius: "12px",
                        marginBottom: "14px",
                        display: "block",
                        cursor: "pointer",
                      }}
                      onClick={() => setSelectedImage(post.image)}
                    />
                  )}

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexWrap: "wrap",
                      marginBottom: "14px",
                    }}
                  >
                    {post.status !== "Open" && (
                      <button
                        style={smallActionButton}
                        onClick={() => updatePostStatus(post.id, "Open")}
                      >
                        Re-open
                      </button>
                    )}

                    {post.status !== "Solved" && (
                      <button
                        style={smallActionButton}
                        onClick={() => updatePostStatus(post.id, "Solved")}
                      >
                        Mark Solved
                      </button>
                    )}

                    {post.status !== "Archived" && (
                      <button
                        style={{ ...smallActionButton, background: "#5b6575" }}
                        onClick={() => updatePostStatus(post.id, "Archived")}
                      >
                        Archive
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      background: "#0b1a38",
                      padding: "14px",
                      borderRadius: "12px",
                      marginTop: "10px",
                    }}
                  >
                    <h3 style={{ marginTop: 0, fontSize: "16px" }}>Replies</h3>

                    {post.replies.length === 0 ? (
                      <p style={{ color: "#b7c5d9" }}>No replies yet</p>
                    ) : (
                      post.replies.map((reply) => (
                        <div
                          key={reply.id}
                          style={{
                            background: "#1a2d57",
                            padding: "10px",
                            borderRadius: "10px",
                            marginBottom: "10px",
                          }}
                        >
                          <strong>{reply.name}</strong>
                          <div style={{ fontSize: "12px", color: "#a7b4c8", marginTop: "4px" }}>
                            {timeAgo(reply.createdAt)}
                          </div>
                          <div style={{ marginTop: "5px" }}>{reply.text}</div>
                        </div>
                      ))
                    )}

                    <textarea
                      placeholder="Write a reply..."
                      value={replyInputs[post.id] || ""}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [post.id]: e.target.value,
                        }))
                      }
                      style={{
                        ...textAreaStyle,
                        minHeight: "80px",
                        marginBottom: "10px",
                      }}
                    />

                    <button style={liveButton} onClick={() => addReply(post.id)}>
                      Reply
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {selectedImage && (
          <div
            onClick={() => setSelectedImage(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.85)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "20px",
              cursor: "pointer",
            }}
          >
            <img
              src={selectedImage}
              alt="Full size"
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "90%",
                maxHeight: "90%",
                borderRadius: "12px",
                boxShadow: "0 0 30px rgba(0,0,0,0.4)",
              }}
            />
          </div>
        )}
      </>
    );
  }

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        background: "#071535",
        color: "white",
        minHeight: "100vh",
        textAlign: "center",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "30px",
          }}
        >
          <div style={{ textAlign: "left" }}>
            <h1 style={{ margin: 0 }}>Nu Age AI Tools</h1>
            <div style={{ color: "#b7c5d9", marginTop: "6px" }}>
              Logged in as {currentUserName}
            </div>
          </div>

          <button
            style={{ ...smallActionButton, background: "#5b6575" }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "18px",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          <button
            style={liveButton}
            onClick={() => {
              window.open("https://nuage-route-planner.vercel.app", "_blank");
            }}
          >
            Route Planner
          </button>

          <button style={liveButton} onClick={() => setPage("feed")}>
            Team Feed
          </button>

          <a
  href="https://gmail-com-m4q1.vercel.app/"
  target="_blank"
  rel="noreferrer"
  className="tool-card live"
>
  <div className="tool-card-header">
    <h3>Gmail Converter</h3>
    <span className="beta-badge">BETA</span>
  </div>
  <p>
    Convert long email chains into cleaner, more manageable notes for the office
    team to add into Commusoft.
  </p>
</a>
          <button style={comingButton}>🔒 Coming Soon</button>
          <button style={comingButton}>🔒 Coming Soon</button>
          <button style={comingButton}>🔒 Coming Soon</button>
          <button style={comingButton}>🔒 Coming Soon</button>
          <button style={comingButton}>🔒 Coming Soon</button>
        </div>
      </div>
    </div>
  );
}

const liveButton = {
  padding: "22px",
  borderRadius: "12px",
  border: "none",
  background: "#6cc04a",
  color: "white",
  fontSize: "18px",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

const comingButton = {
  padding: "22px",
  borderRadius: "12px",
  border: "none",
  background: "#334766",
  color: "#a7b4c8",
  fontSize: "18px",
  cursor: "not-allowed",
  fontWeight: "bold" as const,
};

const filterButton = {
  padding: "10px 14px",
  borderRadius: "999px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold" as const,
  fontSize: "14px",
};

const smallActionButton = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#6cc04a",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold" as const,
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  marginBottom: "12px",
  boxSizing: "border-box" as const,
};

const textAreaStyle = {
  width: "100%",
  minHeight: "110px",
  padding: "12px",
  borderRadius: "10px",
  border: "none",
  marginBottom: "12px",
  boxSizing: "border-box" as const,
  resize: "vertical" as const,
};

const loadingScreenStyle = {
  fontFamily: "Arial, sans-serif",
  background: "#071535",
  color: "white",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const authCardStyle = {
  width: "100%",
  maxWidth: "420px",
  background: "#102348",
  padding: "24px",
  borderRadius: "16px",
  boxSizing: "border-box" as const,
  textAlign: "left" as const,
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};

const authTabStyle = {
  flex: 1,
  padding: "12px",
  border: "none",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold" as const,
};
