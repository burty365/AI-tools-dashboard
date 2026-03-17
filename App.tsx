import { useState } from "react";

type Reply = {
  id: number;
  name: string;
  text: string;
};

type Post = {
  id: number;
  name: string;
  tag: string;
  text: string;
  image?: string;
  replies: Reply[];
};

export default function App() {
  const [page, setPage] = useState<"home" | "feed">("home");

  const [posts, setPosts] = useState<Post[]>([]);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("Idea");
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>(undefined);

  const [replyInputs, setReplyInputs] = useState<Record<number, string>>({});
  const [replyNames, setReplyNames] = useState<Record<number, string>>({});

  const addPost = () => {
    if (!text.trim()) return;

    const newPost: Post = {
      id: Date.now(),
      name: name.trim() || "Anonymous",
      tag,
      text: text.trim(),
      image,
      replies: [],
    };

    setPosts([newPost, ...posts]);
    setText("");
    setImage(undefined);
    setTag("Idea");
  };

  const addReply = (postId: number) => {
    const replyText = (replyInputs[postId] || "").trim();
    const replyName = (replyNames[postId] || "").trim() || "Anonymous";

    if (!replyText) return;

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              replies: [
                ...post.replies,
                {
                  id: Date.now(),
                  name: replyName,
                  text: replyText,
                },
              ],
            }
          : post
      )
    );

    setReplyInputs((prev) => ({ ...prev, [postId]: "" }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (page === "feed") {
    return (
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          background: "#071535",
          color: "white",
          minHeight: "100vh",
          padding: "40px 20px",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "20px" }}>Team Feed</h1>

        <div style={{ maxWidth: "850px", margin: "0 auto" }}>
          <button
            style={{ ...liveButton, marginBottom: "20px" }}
            onClick={() => setPage("home")}
          >
            ← Back
          </button>

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

            <input
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />

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

            {image && (
              <img
                src={image}
                alt="Preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "240px",
                  borderRadius: "12px",
                  marginBottom: "14px",
                  display: "block",
                }}
              />
            )}

            <button style={liveButton} onClick={addPost}>
              Post to Feed
            </button>
          </div>

          {posts.length === 0 ? (
            <div
              style={{
                background: "#102348",
                padding: "20px",
                borderRadius: "14px",
                textAlign: "center",
              }}
            >
              No posts yet
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                style={{
                  background: "#102348",
                  padding: "18px",
                  borderRadius: "14px",
                  marginBottom: "18px",
                  textAlign: "left",
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
                  <strong>{post.name}</strong>
                  <span
                    style={{
                      background:
                        post.tag === "Bug"
                          ? "#b94141"
                          : post.tag === "Question"
                          ? "#8a6d1f"
                          : post.tag === "Update"
                          ? "#2a6fa1"
                          : "#3f7d36",
                      padding: "6px 10px",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: "bold",
                    }}
                  >
                    {post.tag}
                  </span>
                </div>

                <div style={{ whiteSpace: "pre-wrap", marginBottom: "12px" }}>
                  {post.text}
                </div>

                {post.image && (
                  <img
                    src={post.image}
                    alt="Post"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      borderRadius: "12px",
                      marginBottom: "14px",
                      display: "block",
                    }}
                  />
                )}

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
                        <div style={{ marginTop: "5px" }}>{reply.text}</div>
                      </div>
                    ))
                  )}

                  <input
                    placeholder="Your name"
                    value={replyNames[post.id] || ""}
                    onChange={(e) =>
                      setReplyNames((prev) => ({
                        ...prev,
                        [post.id]: e.target.value,
                      }))
                    }
                    style={inputStyle}
                  />

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
      <h1 style={{ marginBottom: "30px" }}>Nu Age AI Tools</h1>

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

        <button style={comingButton}>🔒 Gmail Converter</button>
        <button style={comingButton}>🔒 Coming Soon</button>
        <button style={comingButton}>🔒 Coming Soon</button>
        <button style={comingButton}>🔒 Coming Soon</button>
        <button style={comingButton}>🔒 Coming Soon</button>
        <button style={comingButton}>🔒 Coming Soon</button>
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
