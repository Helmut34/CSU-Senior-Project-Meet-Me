import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Header from "./components/Header";
import About from "./components/About";
import Features from "./components/Features";
import GetStarted from "./components/GetStarted";
import Footer from "./components/Footer";
import LoginPage from "./components/LoginPage";
import Dashboard from "./components/Dashboard";
import PartyPage from "./components/PartyPage";
import { Toaster } from "react-hot-toast";
import { authAPI } from "./components/services/api";

function App() {
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // check if user is already logged in (session cookie)
  useEffect(() => {
    authAPI
      .me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      document.querySelector("html").classList.remove("is-preload");
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    navigate("/dashboard");
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Header />
              <About />
              <Features />
              <GetStarted />
              <Footer />
            </>
          }
        />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard
                user={user}
                onLogout={handleLogout}
                userLocation={userLocation}
                onLocationFound={setUserLocation}
              />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/party/:partyId"
          element={
            user ? (
              <PartyPage user={user} />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App;
