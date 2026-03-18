export const AUTH0_DOMAIN = "dev-0ey2zkme2zf6lczu.us.auth0.com";
export const AUTH0_CLIENT_ID = "blre2uWlFex6kcumEbkrU89GJMjmM2Tg";
export const AUTH0_AUDIENCE = "https://barnote.net/";

export const API_BASE_URL = import.meta.env.MODE === "production" 
    ? "https://api.barnote.net" 
    : "";
