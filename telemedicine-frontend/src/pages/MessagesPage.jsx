import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Send, MessageSquare } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

export default function MessagesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState("");

  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadConversations = () => {
    setLoadingList(true);
    api
      .get("/api/messages/conversations")
      .then(({ data }) => {
        setConversations(data);
        if (data.length > 0 && activeId === null) {
          setActiveId(data[0].other_user_id);
        }
      })
      .catch(() =>
        setListError(
          "Couldn't load conversations. Messages only appear once you have a real booked appointment with someone."
        )
      )
      .finally(() => setLoadingList(false));
  };

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeId === null) return;
    setLoadingThread(true);
    api
      .get(`/api/messages/${activeId}`)
      .then(({ data }) => setThread(data))
      .catch(() => setThread([]))
      .finally(() => setLoadingThread(false));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    try {
      const { data } = await api.post("/api/messages/", {
        receiver_id: activeId,
        content: text,
      });
      setThread((prev) => [...prev, data]);
      setDraft("");
      loadConversations();
    } catch {
      // no-op: keep the draft so the user can retry sending
    } finally {
      setSending(false);
    }
  };

  const activeConvo = conversations.find((c) => c.other_user_id === activeId);

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans flex flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6 py-4 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">Messages</h1>
      </header>

      <div className="flex-1 flex min-h-0 max-w-5xl w-full mx-auto">
        {/* CONVERSATION LIST */}
        <aside className="w-64 sm:w-72 shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
          {loadingList ? (
            <p className="p-4 text-sm text-slate-500">Loading...</p>
          ) : listError ? (
            <p className="p-4 text-sm text-slate-500">{listError}</p>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">
                No conversations yet. Book an appointment first, then you can message your doctor here.
              </p>
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.other_user_id}
                onClick={() => setActiveId(c.other_user_id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 transition ${
                  activeId === c.other_user_id ? "bg-teal-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {c.other_user_name}
                  </p>
                  {c.unread_count > 0 && (
                    <span className="shrink-0 rounded-full bg-teal-600 text-white text-[10px] font-bold px-1.5 py-0.5">
                      {c.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{c.last_message}</p>
              </button>
            ))
          )}
        </aside>

        {/* THREAD */}
        <main className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {activeId === null ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
              Select a conversation
            </div>
          ) : (
            <>
              <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white">
                <p className="text-sm font-bold text-slate-900">
                  {activeConvo?.other_user_name || "Conversation"}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3">
                {loadingThread ? (
                  <p className="text-sm text-slate-400">Loading messages...</p>
                ) : (
                  thread.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.sender_id === user?.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                          m.sender_id === user?.id
                            ? "bg-teal-700 text-white rounded-br-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>
              <div className="px-4 sm:px-6 py-3 border-t border-slate-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 min-w-0 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="shrink-0 rounded-xl bg-teal-700 hover:bg-teal-800 text-white p-2.5 transition disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
