const decodeToken = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload;
    } catch (err) {
      console.error("Error decoding token:", err);
      return null;
    }
  };

export default decodeToken;