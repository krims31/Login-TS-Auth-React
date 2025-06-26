export const AUTH_CONFIG = {
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scope: 'openid email profile',
  },
  github: {
    clientId: process.env.REACT_APP_GITHUB_CLIENT_ID || '',
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'user:email',
  }
};