import { AUTH_CONFIG } from '../config/auth';

type OAuthProvider = 'google' | 'github';

const useOAuth = () => {
  const getOAuthUrl = (provider: OAuthProvider): string => {
    try {
      const config = AUTH_CONFIG[provider];
      
      if (!config.clientId) {
        throw new Error(`${provider} client ID is not configured`);
      }

      const params = {
        google: {
          client_id: config.clientId,
          redirect_uri: `${window.location.origin}/auth/google`,
          response_type: 'code',
          scope: config.scope,
          access_type: 'offline',
          prompt: 'consent',
        },
        github: {
          client_id: config.clientId,
          redirect_uri: `${window.location.origin}/auth/github`,
          scope: config.scope,
        }
      };

      const urlParams = new URLSearchParams();
      Object.entries(params[provider]).forEach(([key, value]) => {
        if (value !== undefined) {
          urlParams.append(key, value.toString());
        }
      });

      return `${config.authUrl}?${urlParams.toString()}`;
    } catch (error) {
      console.error(`Error generating ${provider} OAuth URL:`, error);
      return '';
    }
  };

  return { getOAuthUrl };
};

export default useOAuth;