import React, { createContext, useState, useContext, useEffect } from 'react';
import apiClient from '../api/axios'; // Use the configured axios instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [loading, setLoading] = useState(true); // To handle initial auth check

    useEffect(() => {
        const checkLoggedIn = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // The apiClient interceptor automatically adds the token to headers
                    const response = await apiClient.get('/accounts/me');
                    setAccount(response.data);
                } catch (error) {
                    console.error("Invalid token, logging out", error);
                    localStorage.removeItem('token'); // Clean up invalid token
                    setAccount(null);
                }
            }
            setLoading(false);
        };

        checkLoggedIn();
    }, []);

    const login = async (username, password) => {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        try {
            const response = await apiClient.post('/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });
            
            const { access_token } = response.data;
            localStorage.setItem('token', access_token);
            
            // After getting token, fetch user data
            const accountResponse = await apiClient.get('/accounts/me');
            setAccount(accountResponse.data);
            setLoading(false);
            return true; // Indicate success

        } catch (error) {
            console.error("Login failed", error);
            localStorage.removeItem('token');
            setAccount(null);
            setLoading(false);
            return false; // Indicate failure
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setAccount(null);
    };

    const authContextValue = {
        isAuthenticated: !!account,
        account,
        loading,
        login,
        logout,
    };

    // While checking auth, you can render a loader or nothing
    if (loading) {
        return <div>Loading...</div>; // Or a proper spinner component
    }

    return (
        <AuthContext.Provider value={authContextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
