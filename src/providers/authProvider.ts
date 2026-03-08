import type { AuthProvider } from "@refinedev/core";
import { Auth0ContextInterface } from "@auth0/auth0-react";

export const authProvider = (
  auth0: Auth0ContextInterface
): AuthProvider => {
  const {
    isAuthenticated,
    user,
    logout,
    loginWithRedirect,
    isLoading,
    getAccessTokenSilently,
  } = auth0;

  return {
    login: async () => {
      loginWithRedirect();
      return {
        success: true,
      };
    },
    logout: async () => {
      logout({ logoutParams: { returnTo: window.location.origin } });
      return {
        success: true,
      };
    },
    onError: async (error: any) => {
      console.error(error);
      return { error };
    },
    check: async () => {
      if (isLoading) {
        return { authenticated: true }; // prevent redirect while loading
      }
      try {
        const token = await getAccessTokenSilently();
        if (token) {
          return {
            authenticated: true,
          };
        }
      } catch (error) {
        return {
          authenticated: false,
          redirectTo: "/login",
        };
      }
      return {
        authenticated: isAuthenticated,
        redirectTo: "/login",
      };
    },
    getPermissions: async () => null,
    getIdentity: async () => {
      if (user) {
        return {
          ...user,
          avatar: user.picture,
        };
      }
      return null;
    },
  };
};
