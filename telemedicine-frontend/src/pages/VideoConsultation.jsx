import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

// Free video calling via Jitsi Meet's public server (meet.jit.si) - no API key,
// no account, no cost. Anyone with the same room_id lands in the same call.
const JITSI_DOMAIN = "meet.jit.si";

export default function VideoConsultation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");

  // Passed from BookAppointment: { doctorName, initials, roomId }
  const { doctorName, roomId } = location.state || {};
  const room = roomId || `medinexus-${user?.id || "guest"}-fallback`;

  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      const script = document.createElement("script");
      script.src = `https://${JITSI_DOMAIN}/external_api.js`;
      script.async = true;
      script.onload = initJitsi;
      script.onerror = () => setError("Couldn't load the video call. Check your internet connection.");
      document.body.appendChild(script);
    } else {
      initJitsi();
    }

    function initJitsi() {
      if (!containerRef.current) return;
      apiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName: `MediNexus-${room}`,
        parentNode: containerRef.current,
        userInfo: { displayName: user?.full_name || "MediNexus user" },
        configOverwrite: { prejoinPageEnabled: false },
        interfaceConfigOverwrite: { TOOLBAR_BUTTONS: [] }, // we render our own controls below
      });
      apiRef.current.addEventListener("videoConferenceJoined", () => setJoined(true));
      apiRef.current.addEventListener("readyToClose", () => navigate(-1));
    }

    return () => {
      apiRef.current?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  const toggleMic = () => {
    apiRef.current?.executeCommand("toggleAudio");
    setMicOn((v) => !v);
  };
  const toggleCam = () => {
    apiRef.current?.executeCommand("toggleVideo");
    setCamOn((v) => !v);
  };
  const hangUp = () => {
    apiRef.current?.executeCommand("hangup");
    navigate(-1);
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0b1220] font-sans">
      <header className="flex items-center justify-between px-4 sm:px-6 py-4 text-white">
        <div>
          <p className="font-bold">{doctorName ? `Consultation with ${doctorName}` : "Video consultation"}</p>
          <p className="text-xs text-slate-400">
            {joined ? "Connected • free Jitsi Meet video call" : "Connecting..."}
          </p>
        </div>
        <span className="text-xs text-slate-400">Room: {room}</span>
      </header>

      {error && (
        <div className="mx-4 sm:mx-6 rounded-lg bg-red-950 border border-red-800 text-red-200 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex-1 mx-4 sm:mx-6 mb-4 rounded-2xl overflow-hidden bg-black">
        <div ref={containerRef} className="w-full h-full min-h-[60vh]" />
      </div>

      {/* Our own simple control bar (Jitsi's built-in toolbar is disabled above) */}
      <div className="flex items-center justify-center gap-4 pb-6">
        <button
          onClick={toggleMic}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition ${
            micOn ? "bg-white/10 text-white" : "bg-red-600 text-white"
          }`}
        >
          {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </button>
        <button
          onClick={toggleCam}
          className={`h-12 w-12 rounded-full flex items-center justify-center transition ${
            camOn ? "bg-white/10 text-white" : "bg-red-600 text-white"
          }`}
        >
          {camOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </button>
        <button
          onClick={hangUp}
          className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition"
        >
          <PhoneOff className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
