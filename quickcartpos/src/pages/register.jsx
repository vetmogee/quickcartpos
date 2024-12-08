// ./pages/Register.jsx
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vklhijpnqinceiindbmo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrbGhpanBucWluY2VpaW5kYm1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg3MjQ1MTksImV4cCI6MjA0NDMwMDUxOX0.IvFBFW_1q7rUCVhZjUXo1e7vGPGQZAQ7Nvn1RK5MAeE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();

        // Attempt to sign up the user
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            // Check if the error is due to the email already being registered
            if (error.message.includes('already registered')) {
                setMessage('This email is already registered. Please log in instead.');
            } else {
                setMessage(error.message);
            }
        } else {
            setMessage('Registration successful! Please check your email for confirmation.');
            // Optionally, redirect to login or another page
        }
    };

    return (
        <div>
            <h1>Register</h1>
            <form onSubmit={handleRegister}>
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
                <button type="submit">Register</button>
            </form>
            <div>{message}</div>
        </div>
    );
};

export default Register;