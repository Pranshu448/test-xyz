import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  // If already logged in, go to chat
  if (user) {
    return <Navigate to="/chat" />;
  }

  return (
    <div>
      <h1>Welcome</h1>
      <p>Please choose an option:</p>

      <Link to="/login">
        <button>Login</button>
      </Link>

      <br /><br />

      <Link to="/register">
        <button>Register</button>
      </Link>
    </div>
  );
}
