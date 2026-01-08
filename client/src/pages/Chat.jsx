import { useEffect, useState } from "react";
import api from "../utils/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Chat() {
    const { user } = useAuth();
    const { socket } = useSocket();
  
    const myId = String(user?._id || "");
  
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
  
    /* ================= LOAD CHAT LIST ================= */
    useEffect(() => {
      if (!user) return;
  
      const loadChats = async () => {
        const res = await api.get("/chats/my-chats");
        setChats(res.data);
      };
  
      loadChats();
    }, [user]);
  
    /* ================= LOAD MESSAGES ================= */
    useEffect(() => {
      if (!activeChat) return;
  
      setMessages([]);
  
      const loadMessages = async () => {
        const res = await api.get(`/messages/chat/${activeChat._id}`);
        setMessages(res.data);
      };
  
      loadMessages();
    }, [activeChat?._id]);
  
    /* ================= RECEIVE MESSAGE ================= */
    useEffect(() => {
      if (!socket) return;
    
      const handleReceive = (msg) => {
        // 1. Update messages if this is the active chat
        if (String(msg.chatId) === String(activeChat?._id)) {
          setMessages((prev) => [...prev, msg]);
        }
    
        // 2. Update the Sidebar (Chats List) - increment unread count for receiver
        // MongoDB Map serializes to an object, so we need to handle both formats
        setChats((prev) =>
          prev.map((chat) => {
            if (String(chat._id) === String(msg.chatId)) {
              // Handle MongoDB Map serialization: unreadCount can be Map or object
              const unreadCountObj = chat.unreadCount instanceof Map 
                ? Object.fromEntries(chat.unreadCount) 
                : (chat.unreadCount || {});
              
              const currentCount = Number(unreadCountObj[myId]) || 0;
              
              // Only increment if I am NOT currently looking at this chat
              // (If viewing chat, badge stays 0 - database is source of truth)
              const newCount = String(msg.chatId) === String(activeChat?._id) ? 0 : currentCount + 1;
              
              return {
                ...chat,
                unreadCount: {
                  ...unreadCountObj,
                  [myId]: newCount,
                },
                lastMessage: msg,
              };
            }
            return chat;
          })
        );
      };
  
      socket.on("receive_message", handleReceive);
      return () => socket.off("receive_message", handleReceive);
    }, [socket, activeChat?._id, myId]);

    /* ================= CHAT READ EVENT (Sender receives when receiver opens chat) ================= */
    useEffect(() => {
      if (!socket) return;

      const handleChatRead = ({ chatId, readerId }) => {
        // ✅ This runs on SENDER side when receiver opens the chat
        // Clear sender's unreadCount for this chat (receiver has seen messages)
        setChats((prev) =>
          prev.map((chat) => {
            if (String(chat._id) === String(chatId)) {
              // Handle MongoDB Map serialization
              const unreadCountObj = chat.unreadCount instanceof Map 
                ? Object.fromEntries(chat.unreadCount) 
                : (chat.unreadCount || {});
              
              return {
                ...chat,
                unreadCount: {
                  ...unreadCountObj,
                  [myId]: 0, // ✅ Clear MY badge (I'm the sender, receiver has read)
                },
              };
            }
            return chat;
          })
        );
      };

      socket.on("chat_read", handleChatRead);
      return () => socket.off("chat_read", handleChatRead);
    }, [socket, myId]);
      
  
    /* ================= SEND MESSAGE ================= */
    // ✅ WHY SEND NOW WORKS:
    // - Explicit type="button" prevents any default form submission behavior
    // - Enter key handler allows submitting via keyboard
    // - Socket check ensures we don't try to emit when socket is null
    // - Message is captured before clearing state
    const sendMessage = (e) => {
      // Prevent default form behavior if triggered from Enter key
      if (e) e.preventDefault();
      
      // Guard checks: socket, activeChat, and non-empty message required
      if (!socket) {
        console.warn("Socket not available");
        return;
      }
      if (!activeChat) {
        console.warn("No active chat selected");
        return;
      }
      const messageContent = message.trim();
      if (!messageContent) return;
  
      // Emit to backend via socket
      socket.emit("send_message", {
        chatId: activeChat._id,
        content: messageContent,
      });
  
      // Optimistic UI update - message appears immediately
      setMessages((prev) => [
        ...prev,
        {
          _id: `temp-${Date.now()}`,
          content: messageContent,
          sender: myId,
          chatId: activeChat._id,
          createdAt: new Date(),
        },
      ]);
  
      // Clear input field
      setMessage("");
    };
  
    /* ================= CHAT CLICK HANDLER ================= */
    const openChat = async (chat) => {
      setActiveChat(chat);
  
      // Handle MongoDB Map serialization to get current unread count
      const unreadCountObj = chat.unreadCount instanceof Map 
        ? Object.fromEntries(chat.unreadCount) 
        : (chat.unreadCount || {});
      const currentUnread = Number(unreadCountObj[myId]) || 0;
  
      // (1) CLEAR MY BADGE IMMEDIATELY (LOCAL) - optimistic update for instant UI feedback
      setChats((prev) =>
        prev.map((c) =>
          String(c._id) === String(chat._id)
            ? {
                ...c,
                unreadCount: {
                  ...unreadCountObj,
                  [myId]: 0,
                },
              }
            : c
        )
      );
  
      // (2) MARK AS READ (BACKEND + SOCKET → SENDER) - only if there were unread messages
      // ✅ WHY BADGE STAYS CLEARED AFTER REFRESH:
      // - This API call updates the database: chat.unreadCount[myId] = 0
      // - Database is the source of truth, not socket events
      // - On page refresh, GET /chats/my-chats returns chats from database
      // - Since database has unreadCount[myId] = 0, badge remains cleared
      // - Socket events are just notifications, they don't replace database state
      if (currentUnread > 0) {
        try {
          await api.post(`/chats/read/${chat._id}`);
        } catch (err) {
          console.error("Failed to mark chat as read:", err);
          // On error, reload chats from server to get accurate state
          const res = await api.get("/chats/my-chats");
          setChats(res.data);
        }
      }
    };
  
  
  
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial" }}>
      {/* ================= CHAT LIST ================= */}
      <div
        style={{
          width: "30%",
          borderRight: "1px solid #ddd",
          overflowY: "auto",
        }}
      >
        <h3 style={{ padding: "10px", margin: 0 }}>Chats</h3>
  
        {chats.map((chat) => {

            if (!chat.participants || chat.participants.length === 0) return null;

            // ✅ Handle MongoDB Map serialization: unreadCount can be Map or object
            // ✅ Database is source of truth - badge reflects persisted unreadCount
            const unreadCountObj = chat.unreadCount instanceof Map 
              ? Object.fromEntries(chat.unreadCount) 
              : (chat.unreadCount || {});
            const unread = Number(unreadCountObj[myId]) || 0;

            const otherUser = chat.participants.find(
            (p) => String(p._id) !== myId
          );
  
          return (
            <div
                key={chat._id}
                onClick={() => openChat(chat)}
                style={{
                    padding: "12px",
                    cursor: "pointer",
                    backgroundColor:
                    activeChat?._id === chat._id ? "#f0f0f0" : "#fff",
                    borderBottom: "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
                >
                <div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong>{otherUser?.username}</strong>

                        {otherUser?.isOnline && (
                            <span
                            style={{
                                width: "8px",
                                height: "8px",
                                backgroundColor: "#3b82f6",
                                borderRadius: "50%",
                            }}
                            />
                        )}
                    </div>

                    <p style={{ margin: "4px 0", fontSize: "13px", color: "#555" }}>
                        {chat.lastMessage?.content || "No messages yet"}
                    </p>
                </div>

                {unread > 0 && (
                    <span
                    style={{
                        minWidth: "20px",
                        height: "20px",
                        backgroundColor: "#2563eb",
                        color: "#fff",
                        borderRadius: "50%",
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                    >
                {unread}
                </span>
                )}
            </div>

          );
        })}
      </div>
  
      {/* ================= CHAT WINDOW ================= */}
      <div
        style={{
          width: "70%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {activeChat ? (
          <>
            {/* MESSAGES */}
            <div
              style={{
                flex: 1,
                padding: "10px",
                overflowY: "auto",
                backgroundColor: "#fafafa",
              }}
            >
              {messages.map((msg, i) => {
                const senderId =
                  typeof msg.sender === "string"
                    ? msg.sender
                    : msg.sender?._id;
  
                if (!senderId) return null;
  
                const isMe = String(senderId) === myId;
  
                return (
                  <div
                    key={msg._id || i}
                    style={{
                      display: "flex",
                      justifyContent: isMe ? "flex-end" : "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "60%",
                        padding: "10px",
                        borderRadius: "10px",
                        backgroundColor: isMe ? "#dcf8c6" : "#ffffff",
                        border: "1px solid #ddd",
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
  
            {/* INPUT BOX */}
            <div
              style={{
                display: "flex",
                padding: "10px",
                borderTop: "1px solid #ddd",
              }}
            >
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => {
                  // Allow sending message with Enter key
                  if (e.key === "Enter" && !e.shiftKey) {
                    sendMessage(e);
                  }
                }}
                placeholder="Type a message"
                style={{
                  flex: 1,
                  padding: "8px",
                  fontSize: "14px",
                }}
              />
              <button
                type="button"
                onClick={sendMessage}
                style={{
                  marginLeft: "10px",
                  padding: "8px 16px",
                  cursor: "pointer",
                }}
              >
                Send
              </button>
            </div>
          </>
        ) : (
          <p style={{ padding: "20px" }}>Select a chat</p>
        )}
      </div>
    </div>
  );
  
  
}

