import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/AuthService';
import './Register.css'; // Create this file with provided register.css content

const Register = () => {
    const [userDetails, setUserDetails] = useState({
        firstName: '',
        lastName: '',
        dob: '',
        address: '',
        phone: '',
        email: '',
        password: '',
    });

    const navigate = useNavigate();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserDetails({ ...userDetails, [e.target.name]: e.target.value });
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await registerUser(userDetails);
            navigate('/');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="register-container">
            <h2>Create Account</h2>
            <form id="registerForm" onSubmit={onSubmit}>
                <div className="input-group">
                    <label htmlFor="firstName">First Name</label>
                    <input type="text" name="firstName" value={userDetails.firstName} onChange={handleChange} required />
                </div>
                {/* Repeat for other fields */}
                <div className="input-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input type="text" name="lastName" value={userDetails.lastName} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="dob">Date of Birth</label>
                    <input type="date" name="dob" value={userDetails.dob} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="address">Address</label>
                    <input type="text" name="address" value={userDetails.address} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="phone">Phone</label>
                    <input type="tel" name="phone" value={userDetails.phone} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input type="email" name="email" value={userDetails.email} onChange={handleChange} required />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password</label>
                    <input type="password" name="password" value={userDetails.password} onChange={handleChange} required />
                </div>
                <button type="submit" className="register-btn">Register</button>
            </form>
        </div>
    );
};

export default Register;