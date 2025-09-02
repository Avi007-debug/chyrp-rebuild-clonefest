import React, { useState } from 'react';
import { UserIcon, LockKeyholeIcon } from './Icons.jsx';

const API_URL = "http://localhost:5000";

const LoginPage = ({ onLoginSuccess, setPage }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        })
        .then(res => res.ok ? res.json() : res.json().then(err => Promise.reject(err)))
        .then(data => onLoginSuccess(data.access_token))
        .catch(err => setError(err.message || 'Login failed'));
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-xl rounded-lg px-8 pt-6 pb-8 mb-4">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Welcome Back</h2>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center text-sm">{error}</p>}
                <div className="mb-4 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><UserIcon className="h-5 w-5"/></span>
                    <input className="shadow-inner appearance-none border rounded w-full py-2 pl-10 pr-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500" id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />
                </div>
                <div className="mb-6 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400"><LockKeyholeIcon /></span>
                    <input className="shadow-inner appearance-none border rounded w-full py-2 pl-10 pr-3 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 dark:border-gray-600 leading-tight focus:outline-none focus:ring-2 focus:ring-pink-500" id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
                </div>
                <div className="flex items-center justify-between">
                    <button className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full transition-all duration-300 transform hover:scale-105" type="submit">
                        Sign In
                    </button>
                </div>
                <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
                    Don't have an account? <button type="button" onClick={() => setPage({ name: 'register' })} className="font-semibold text-pink-600 dark:text-pink-400 hover:underline">Sign Up</button>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;

