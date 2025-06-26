import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { motion } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { FaUser } from 'react-icons/fa'

const firebaseConfig = {
	apiKey: '<API_KEY>',
	authDomain: '<AUTH_DOMAIN>',
	projectId: '<PROJECT_ID>',
}

const app = initializeApp(firebaseConfig)

const auth = getAuth(app)

const App: React.FC = () => {
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)
	const [showPassword, setShowPassword] = useState<boolean>(false)
	const [rememberMe, setRememberMe] = useState<boolean>(false)
	const [attempts, setAttempts] = useState<number>(0)
	const [captchaRequired, setCaptchaRequired] = useState<boolean>(false)

	const [theme, setTheme] = useState<'light' | 'dark'>(() => {
		const savedTheme = localStorage.getItem('theme')
		if (savedTheme) return savedTheme as 'light' | 'dark'
		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? 'dark'
			: 'light'
	})

	console.log(theme)

	useEffect(() => {
		document.documentElement.setAttribute('data-theme', theme)
		localStorage.setItem('theme', theme)
	}, [theme])

	const toggleTheme = () => {
		setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
	}

	const handleGoogleLogin: () => Promise<void> = async () => {
		setAttempts(attempts + 1)
		try {
			const provider = new GoogleAuthProvider()
			const authWindow = window.open('', '_blank', 'width=500,height=600')

			if (!authWindow) {
				console.error('Failed to open Google authentication window')
				return
			}

			const result = await signInWithPopup(auth, provider)
			console.log(result.user)
		} catch (error: unknown) {
			if ((error as CustomError).code === 'auth/popup-closed-by-user') {
				console.log('Popup window was closed by the user')
			} else {
				if (error instanceof Error) {
					setError(error.message)
				} else {
					setError((error as Error).message)
				}
			}
		}
	}

	const someCondition = true

	useEffect(() => {
		if (someCondition) {
			handleGoogleLogin()
		}
	}, [someCondition])

	useEffect(() => {
		if (attempts > 3) {
			setError('Too many login attempts. Please try again later.')
			setCaptchaRequired(true)
		}
		if (captchaRequired) {
			setCaptchaRequired(false)
			setAttempts(0)
		}
	}, [attempts])

	const handleLogin = async (
		email: string,
		password: string,
		remember: boolean
	) => {
		if (remember) {
			localStorage.setItem('rememberedEmail', email)
		} else {
			localStorage.removeItem('rememberedEmail')
		}
		setIsLoading(true)
		setError(null)

		try {
			console.log('Login attempt with:', email, password)
			await new Promise(resolve => setTimeout(resolve, 1500))

			if (email === 'test@example.com' && password === 'password123') {
				console.log('Login successful!')
			} else {
				throw new Error('Invalid credentials')
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Login failed')
		} finally {
			setIsLoading(false)
		}
	}

	useEffect(() => {
		if (error) {
			const timer = setTimeout(() => {
				setError(null)
			}, 3000)
			return () => clearTimeout(timer)
		}
	}, [error])

	const getOAuthUrl = (provider: 'google' | 'github'): string => {
		const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
		const githubClientId = import.meta.env.VITE_GITHUB_CLIENT_ID

		if (!googleClientId || !githubClientId) {
			console.error('Google or GitHub client ID is not configured')
			return ''
		}

		try {
			const baseUrls = {
				google: 'https://accounts.google.com/o/oauth2/v2/auth',
				github: 'https://github.com/login/oauth/authorize',
			}

			const params = {
				google: {
					client_id: googleClientId,
					redirect_uri: `${window.location.origin}/auth/google`,
					response_type: 'code',
					scope: 'openid email profile',
					access_type: 'offline',
					prompt: 'consent',
				},
				github: {
					client_id: githubClientId,
					redirect_uri: `${window.location.origin}/auth/github`,
					scope: 'user:email',
				},
			}

			const urlParams = new URLSearchParams()
			Object.entries(params[provider]).forEach(([key, value]) => {
				urlParams.append(key, value.toString())
			})

			return `${baseUrls[provider]}?${urlParams.toString()}`
		} catch (error) {
			console.error(`Error generating ${provider} OAuth URL:`, error)
			return ''
		}
	}

	const getGoogleOAuthUrl = () => getOAuthUrl('google')
	const getGithubOAuthUrl = () => getOAuthUrl('github')

	return (
		<div className='app-container' data-theme={theme}>
			<LoginForm
				onLogin={handleLogin}
				isLoading={isLoading}
				error={error || undefined}
				showPassword={showPassword}
				setShowPassword={setShowPassword}
				rememberMe={rememberMe}
				setRememberMe={setRememberMe}
				getGoogleOAuthUrl={getGoogleOAuthUrl}
				getGithubOAuthUrl={getGithubOAuthUrl}
				theme={theme}
				toggleTheme={toggleTheme}
			/>
		</div>
	)
}

interface LoginFormProps {
	onLogin: (email: string, password: string, remember: boolean) => Promise<void>
	isLoading?: boolean
	error?: string
	showPassword: boolean
	setShowPassword: (showPassword: boolean) => void
	rememberMe: boolean
	setRememberMe: (rememberMe: boolean) => void
	getGoogleOAuthUrl: () => string
	getGithubOAuthUrl: () => string
	theme: 'light' | 'dark'
	toggleTheme: () => void
}

interface FormData {
	email: string
	password: string
}

interface FormErrors {
	email?: string
	password?: string
}

interface CustomError extends Error {
	code: string
}

const LoginForm: React.FC<LoginFormProps> = ({
	onLogin,
	isLoading = false,
	error,
	showPassword,
	setShowPassword,
	rememberMe,
	setRememberMe,
	getGoogleOAuthUrl,
	getGithubOAuthUrl,
	theme,
	toggleTheme,
}) => {
	const [formData, setFormData] = useState<FormData>({
		email: '',
		password: '',
	})

	const handleGoogleLoginClick = () => {
		getGoogleOAuthUrl()
	}

	const [errors, setErrors] = useState<FormErrors>({})
	const [isFocused, setIsFocused] = useState({
		email: false,
		password: false,
	})

	const validateForm = (): boolean => {
		const newErrors: FormErrors = {}

		if (!formData.email) {
			newErrors.email = 'Email is required'
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Please enter a valid email'
		}

		if (!formData.password) {
			newErrors.password = 'Password is required'
		} else if (formData.password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value,
		}))

		if (name === 'email') {
			setErrors(prev => ({
				...prev,
				email: !value
					? 'Email is required'
					: !/\S+@\S+\.\S+/.test(value)
					? 'Invalid email format'
					: undefined,
			}))
		}
	}

	const handleFocus = (field: 'email' | 'password') => {
		setIsFocused(prev => ({
			...prev,
			[field]: true,
		}))
	}

	const handleBlur = (field: 'email' | 'password') => {
		setIsFocused(prev => ({
			...prev,
			[field]: false,
		}))
		validateForm()
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (validateForm()) {
			onLogin(formData.email, formData.password, rememberMe)
		}
	}

	return (
		<div className='login-card'>
			<motion.button
				onClick={toggleTheme}
				whileHover={{ scale: 1.1 }}
				whileTap={{ scale: 0.9 }}
				className='theme-toggle'
				style={{
					position: 'absolute',
					top: '20px',
					right: '20px',
					width: '44px',
					height: '44px',
					borderRadius: '50%',
					border: 'none',
					background: theme === 'light' ? '#f0f0f0' : '#333',
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: '1.4rem',
					zIndex: 100,
					color: theme === 'light' ? '#555' : '#ffd700',
					boxShadow:
						theme === 'light'
							? '0 2px 10px rgba(0, 0, 0, 0.1)'
							: '0 2px 10px rgba(0, 0, 0, 0.3)',
				}}
				aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
			>
				{theme === 'light' ? '🌙' : '☀️'}
			</motion.button>
			<div className='login-icon-container'>
				<svg
					className='login-icon'
					viewBox='0 0 24 24'
					fill='none'
					stroke='currentColor'
					strokeWidth='2'
					strokeLinecap='round'
					strokeLinejoin='round'
				>
					<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'></path>
					<circle cx='12' cy='7' r='4'></circle>
				</svg>
			</div>
			<div className='login-header'>
				<h2>Welcome Back</h2>
				<p>Please enter your credentials to login</p>
			</div>

			{error && <div className='error-message'>{error}</div>}

			<form onSubmit={handleSubmit}>
				<div
					className={`form-group ${isFocused.email ? 'focused' : ''} ${
						errors.email ? 'error' : ''
					}`}
				>
					<label htmlFor='email'>Email</label>
					<FaUser
						style={{
							width: '20px',
							height: '20px',
							margin: '10px',
							marginRight: '2px',
						}}
					/>
					<input
						type='email'
						id='email'
						name='email'
						value={formData.email}
						onChange={handleChange}
						onFocus={() =>
							document.documentElement.style.setProperty('--primary', '#6e8efb')
						}
						onBlur={() => handleBlur('email')}
						disabled={isLoading}
					/>
					{errors.email && <span className='error-text'>{errors.email}</span>}
				</div>
				<div
					className={`form-group ${isFocused.password ? 'focused' : ''} ${
						errors.password ? 'error' : ''
					}`}
				>
					<label htmlFor='password'>Password</label>
					<input
						type={showPassword ? 'text' : 'password'}
						id='password'
						name='password'
						value={formData.password}
						onChange={handleChange}
						onFocus={() => handleFocus('password')}
						onBlur={() => handleBlur('password')}
						disabled={isLoading}
					/>
					<button
						type='button'
						className='toggle-password'
						onClick={() => setShowPassword(!showPassword)}
					>
						<svg
							viewBox='0 0 24 24'
							fill='none'
							xmlns='http://www.w3.org/2000/svg'
							style={{
								width: '24px',
								height: '24px',
								display: 'block',
								margin: '0 auto',
							}}
						>
							<path
								d='M2 2L22 22'
								stroke='#000000'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							></path>
							<path
								d='M6.71277 6.7226C3.66479 8.79527 2 12 2 12C2 12 5.63636 19 12 19C14.0503 19 15.8174 18.2734 17.2711 17.2884M11 5.05822C11.3254 5.02013 11.6588 5 12 5C18.3636 5 22 12 22 12C22 12 21.3082 13.3317 20 14.8335'
								stroke='#000000'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							></path>
							<path
								d='M14 14.2362C13.4692 14.7112 12.7684 15.0001 12 15.0001C10.3431 15.0001 9 13.657 9 12.0001C9 11.1764 9.33193 10.4303 9.86932 9.88818'
								stroke='#000000'
								strokeWidth='2'
								strokeLinecap='round'
								strokeLinejoin='round'
							></path>
						</svg>
					</button>
					{errors.password && (
						<span className='error-text'>{errors.password}</span>
					)}
				</div>

				<div className='options-row'>
					<div className='remember-me'>
						<input
							type='checkbox'
							id='remember'
							checked={rememberMe}
							onChange={e => setRememberMe(e.target.checked)}
						/>
						<label htmlFor='remember'>Remember me</label>
					</div>
					<a href='/forgot-password' className='forgot-password'>
						Forgot password?
					</a>
				</div>

				<motion.button
					whileHover={{ scale: 1.03 }}
					whileTap={{ scale: 0.98 }}
					className='login-button'
				>
					Login
				</motion.button>
			</form>

			<div className='divider'>
				<span>or continue with</span>
			</div>

			<div className='social-login-container'>
				<div className='social-buttons-row'>
					<button
						onClick={() => (window.location.href = getGoogleOAuthUrl())}
						className='social-btn google-btn'
					>
						<div className='btn-content'>
							<svg viewBox='0 0 24 24' width='16' height='16'>
								<path
									d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
									fill='white'
								/>
								<path
									d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
									fill='white'
								/>
								<path
									d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
									fill='white'
								/>
								<path
									d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
									fill='white'
								/>
							</svg>
							<span onClick={handleGoogleLoginClick}>Google</span>
						</div>
					</button>

					<button
						onClick={() => (window.location.href = getGithubOAuthUrl())}
						className='social-btn github-btn'
					>
						<div className='btn-content'>
							<svg viewBox='0 0 24 24' width='16' height='16'>
								<path
									d='M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'
									fill='white'
								/>
							</svg>
							<span>
								<a href='https://github.com/krims31'>GitHub</a>
							</span>
						</div>
					</button>
				</div>
			</div>

			<div className='signup-link'>
				Don't have an account? <a href='/signup'>Sign up</a>
			</div>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
			></motion.div>
		</div>
	)
}

export default App
