// chatApi.js

// Connect to WebSocket for a given team
export const connectToChat = (teamId, token, onMessage) => {
  if (!teamId || !token) return null;

  const ws = new WebSocket(
    `ws://localhost:8000/api/chat/ws/${teamId}?token=${token}`
  );

  ws.onopen = () => console.log("WebSocket connected for team", teamId);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error("Failed to parse chat message:", err);
    }
  };

  ws.onclose = (event) => {
    console.log(`WebSocket disconnected for team ${teamId}`, event.code, event.reason);
  };

  ws.onerror = (error) => {
    console.error("WebSocket error for team", teamId, error);
  };

  return ws;
};

// Send a one-off message via fetch API (optional fallback)
export const sendMessage = async (payload, token) => {
  try {
    const res = await fetch("http://localhost:8000/api/chat/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Failed to send message");
    return await res.json();
  } catch (err) {
    console.error("sendMessage error:", err);
    throw err;
  }
};
