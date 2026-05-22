import { useState } from "react";
import "./App.css";
import LoginScreen from "./components/LoginScreen";
import DashboardApp from "./components/DashboardApp";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  return <DashboardApp onLogout={() => setIsLoggedIn(false)} />;
}

export default App;
