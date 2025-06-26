/// <reference types="vite/client" />

const getOAuthUrl = (provider: 'google' | 'github'): string => {
  // Для Vite:
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID;

  // Для Create React App (раскомментируйте если используете CRA):
  // const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  // const githubClientId = process.env.REACT_APP_GITHUB_CLIENT_ID;

  if (!googleClientId || !githubClientId) {
    console.error(
      "OAuth Client IDs не найдены! Проверьте:",
      "\n1. Наличие .env файла в корне проекта",
      "\n2. Правильность имен переменных (VITE_ или REACT_APP_)",
      "\n3. Перезапуск сервера после изменений"
    );
    return "/login-error"; // или другая fallback-страница
  }

  try {
    const baseUrls = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      github: 'https://github.com/login/oauth/authorize',
    };

    const params = {
      google: {
        client_id: googleClientId,
        redirect_uri: `${window.location.origin}/auth/google`,
        response_type: 'code',
        scope: 'openid email profile',
      },
      github: {
        client_id: githubClientId,
        redirect_uri: `${window.location.origin}/auth/github`,
        scope: 'user:email',
      },
    };

    const urlParams = new URLSearchParams();
    Object.entries(params[provider]).forEach(([key, value]) => {
      urlParams.append(key, value.toString());
    });

    return `${baseUrls[provider]}?${urlParams.toString()}`;
  } catch (error) {
    console.error(`Ошибка генерации URL для ${provider}:`, error);
    return "/oauth-error";
  }
};