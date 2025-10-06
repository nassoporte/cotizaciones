import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000',
});

// Request interceptor to add the auth token to headers
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration (401 errors)
apiClient.interceptors.response.use(
    (response) => response, // Pass through successful responses
    (error) => {
        // Check if the error is a 401 Unauthorized
        if (error.response && error.response.status === 401) {
            // Only handle if there is a token, to avoid loops on the login page
            if (localStorage.getItem('token')) {
                localStorage.removeItem('token');
                alert('Su sesión ha expirado. Por favor, inicie sesión nuevamente.');
                window.location.href = '/'; // Redirect to login page
            }
        }
        // For all other errors, just pass them on
        return Promise.reject(error);
    }
);

export default apiClient;
