import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/UserService';
import { logout } from '../services/AuthService';
import { useAuth } from '../services/AuthService';
import './Dashboard.css'; // Create with provided dashboard.css

const Dashboard = () => {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const { clearAuth } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getCurrentUser();
                setCurrentUser(user);
            } catch (err: any) {
                alert(err.message);
            }
        };
        fetchUser();
    }, []);

    const handleLogout = async () => {
        try {
            const res = await logout();
            clearAuth();
            navigate('/');
            alert(res.message);
        } catch (err: any) {
            console.error(err.message);
        }
    };

    return (
        <div className="main-div">
            <h1>🎉 Welcome Back!</h1>
            <p>You’ve successfully logged in. Let’s make today productive!</p>
            <button className="logout-btn" onClick={handleLogout}>Logout</button>
            <div className="user-box">
                {JSON.stringify(currentUser, null, 2)}
            </div>
        </div>
    );
};

export default Dashboard;