const API_BASE_URL = "http://localhost:8080/api/knowledge";

export const knowledgeService = {
  getAllArticles: async () => {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error("Failed to fetch knowledge base");
    return response.json();
  },

  searchArticles: async (query) => {
    const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Search failed");
    return response.json();
  },

  createArticle: async (article) => {
    const response = await fetch(API_BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(article),
    });
    if (!response.ok) throw new Error("Failed to save threat rule");
    return response.json();
  },

  toggleStatus: async (id) => {
    const response = await fetch(`${API_BASE_URL}/${id}/toggle`, {
      method: "PATCH",
    });
    if (!response.ok) throw new Error("Failed to toggle rule status");
    return response.json();
  }
};