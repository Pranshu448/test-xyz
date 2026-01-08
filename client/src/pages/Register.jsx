import { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    console.log("REGISTER FORM:", form);
  
    try {
      await registerUser(form);
      alert("Registered successfully");
      navigate("/login");
    } catch (err) {
      console.error("REGISTER ERROR:", err.response?.data);
      alert("Registration failed");
    }
  };
  

  return (
    <>
    <form onSubmit={submit}>
      <h2>Register</h2>

      <input
        placeholder="Name"
        onChange={(e) =>
            setForm({ ...form, username: e.target.value })
        }
        />


      <input
        placeholder="Email"
        onChange={(e) =>
          setForm({ ...form, email: e.target.value })
        }
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) =>
          setForm({ ...form, password: e.target.value })
        }
      />

      <button>Register</button>

    </form>
    <p>
    Already have an account? <Link to="/login">Login</Link>
    </p>
    </>
  );
}
