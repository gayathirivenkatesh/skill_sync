
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

const WS_BASE_URL = API_BASE_URL.replace(/^https:/, "wss:").replace(
  /^http:/,
  "ws:"
);

// Connect to WebSocket for a given team
export const connectToChat = (teamId, token, onMessage) => {
  if (!teamId || !token) return null;

  const ws = new WebSocket(
    `${WS_BASE_URL}/api/chat/ws/${encodeURIComponent(teamId)}?token=${encodeURIComponent(token)}`
  );

  ws.onopen = () => {
    console.log("WebSocket connected for team", teamId);
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error("Failed to parse chat message:", err);
    }
  };

  ws.onclose = (event) => {
    console.log(
      `WebSocket disconnected for team ${teamId}`,
      event.code,
      event.reason
    );
  };

  ws.onerror = (error) => {
    console.error("WebSocket error for team", teamId, error);
  };

  return ws;
};

// Send a one-off message via HTTP API
export const sendMessage = async (payload, token) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to send chat message: HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("sendMessage error:", err);
    throw err;
  }
};
