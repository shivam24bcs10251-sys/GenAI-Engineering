// Handles all API communication with the backend

export async function sendChatMessage(personaId, messages) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personaId, messages })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong. Please try again.');
  }

  return data.response;
}
