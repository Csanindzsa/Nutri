/**
 * Helper function to safely parse JSON responses and handle errors
 */
export const parseApiResponse = async (response: Response) => {
  // Check if response is ok
  if (!response.ok) {
    // Check if response is HTML
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
      const htmlText = await response.text();
      console.error("Received HTML error:", htmlText);
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
    }
    
    // Try to parse as JSON
    try {
      const errorData = await response.json();
      throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
    } catch (e) {
      // If JSON parsing fails, return raw text or status
      try {
        const text = await response.text();
        throw new Error(`API Error: ${text || response.statusText}`);
      } catch {
        throw new Error(`Request failed with status: ${response.status}`);
      }
    }
  }
  
  // For successful responses, parse JSON
  return response.json();
};

/**
 * Create headers with authentication
 */
export const createAuthHeaders = (accessToken: string | null) => {
  return {
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
  };
};
