import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/AuthService';
import { useAuth } from '../services/AuthService';
import './Login.css'; // Create with provided login.css

const Login = () => {
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const navigate = useNavigate();
    const { setAccessToken } = useAuth();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { accessToken } = await login(credentials);
            setAccessToken(accessToken);
            navigate('/dashboard');
        } catch (err: any) {
            alert(err.message || 'Login failed');
        }
    };

    const handleSocialLogin = (provider: string) => {
        window.location.href = `http://localhost:8080/api/auth/${provider}`;
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            <form id="loginForm" onSubmit={onSubmit}>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" name="email" value={credentials.email} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" name="password" value={credentials.password} onChange={handleChange} required />
                </div>
                <button type="submit" className="login-btn">Login</button>
            </form>
            <div className="links">
                <Link to="/register">New User?</Link>
            </div>
            <div className="divider">or continue with</div>
            <button className="social-btn google" onClick={() => handleSocialLogin('google')}>Continue with Google</button>
            <button className="social-btn facebook" onClick={() => handleSocialLogin('facebook')}>Continue with Facebook</button>
            <button className="social-btn github" onClick={() => handleSocialLogin('github')}>Continue with GitHub</button>
        </div>
    );
};

export default Login;