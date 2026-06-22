import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../utils/api';

// יצירת הקונטקסט
const AuthContext = createContext(null);

// Provider קומפוננט שיעטוף את האפליקציה
export const AuthProvider = ({ children }) => {
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refresh_token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // בדיקת טוקנים קיימים בטעינת האפליקציה
  useEffect(() => {
    const storedAccessToken = localStorage.getItem('access_token');
    const storedRefreshToken = localStorage.getItem('refresh_token');

    if (storedAccessToken) {
      setAccessToken(storedAccessToken);

      // אופציונלי: שליפת פרטי המשתמש מהשרת
      // אם אין נקודת קצה לשליפת פרטי משתמש, אפשר להסיר את זה
      if (false) { // כרגע מושבת עד שיש API מתאים
        fetchUserProfile(storedAccessToken);
      }
    }

    if (storedRefreshToken) {
      setRefreshToken(storedRefreshToken);
    }

    setLoading(false);
  }, []);

  // פונקציה לשליפת פרטי המשתמש - לא בשימוש כרגע, תוכל להפעיל אם יש API מתאים
  const fetchUserProfile = async (token) => {
    try {
      const response = await axios.get(API_URL + "/api/user/profile/", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // אם קיבלנו 401, ננסה לרענן את הטוקן
      if (error.response?.status === 401 && refreshToken) {
        refreshAccessToken();
      }
    }
  };

  // פונקציית כניסה למערכת
  const login = async (username, password) => {
    try {
      const response = await axios.post(API_URL + "/api/login/", {
        username,
        password
      });

      const { access, refresh } = response.data;

      // שמירת הטוקנים באחסון מקומי
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);

      // עדכון המצב הגלובלי
      setAccessToken(access);
      setRefreshToken(refresh);

      return access;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // פונקציית רענון טוקן
  const refreshAccessToken = async () => {
    if (!refreshToken) return null;

    try {
      const response = await axios.post(API_URL + "/api/token/refresh/", {
        refresh: refreshToken
      });

      const newAccessToken = response.data.access;

      // עדכון הטוקן באחסון המקומי
      localStorage.setItem('access_token', newAccessToken);

      // עדכון המצב
      setAccessToken(newAccessToken);

      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // במקרה של שגיאה, נבצע התנתקות
      logout();
      return null;
    }
  };

  // פונקציית יציאה מהמערכת
  const logout = () => {
    // ניקוי האחסון המקומי
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // איפוס המצב
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  // הגדרת האינטרספטור של axios לטיפול אוטומטי בריענון טוקנים
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // הוספת טוקן אוטומטית לכל בקשה שיוצאת אם אין כבר כותרת אוטוריזציה
        if (accessToken && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // אם קיבלנו 401 ועוד לא ניסינו לרענן את הטוקן בבקשה זו
        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          originalRequest._retry = true;

          try {
            // ריענון הטוקן
            const newToken = await refreshAccessToken();

            if (newToken) {
              // עדכון הבקשה המקורית עם הטוקן החדש
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              // שליחה מחדש של הבקשה המקורית
              return axios(originalRequest);
            }
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    // ניקוי האינטרספטורים בעת הסרת הקומפוננטה
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [accessToken, refreshToken]);

  // הערכים שיהיו זמינים דרך הקונטקסט
  const value = {
    accessToken,
    user,
    loading,
    isAuthenticated: !!accessToken,
    login,
    logout,
    refreshAccessToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// הוק נוח לשימוש בקונטקסט
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};