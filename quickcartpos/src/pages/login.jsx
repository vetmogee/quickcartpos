// ./pages/Login.jsx
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vklhijpnqinceiindbmo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbGhpanBucWluY2VpaW5kYm1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3MjQ1MTksImV4cCI6MjA0NDMwMDUxOX0.IvFBFW_1q7rUCVhZjUXo1e7vGPGQZAQ7Nvn1RK5MAeE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        
        // Attempt to sign in the user
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // Check if the error is due to invalid credentials
            if (error.message.includes('Invalid login credentials')) {
                setMessage('Invalid email or password. Please try again.');
            } else {
                setMessage(error.message);
            }
        } else {
            setMessage('Login successful!');
            // Redirect or perform other actions after successful login
        }
    };

    return (
        <div>
            <h1>Login</h1>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            <div>{message}</div>
        </div>
    );
};

export default Login;