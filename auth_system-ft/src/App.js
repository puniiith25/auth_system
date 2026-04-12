import React, { useState, useRef } from "react";
import axios from "axios";
import Webcam from "react-webcam";

function App() {
  const API = "http://localhost:8000";
  const webcamRef = useRef(null);
  // usestats
  const [step, setStep] = useState("register");
  const [userId, setUserId] = useState("");
  const [user, setUser] = useState(null);
  // user data .. 
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
// file setstate
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  const register = async () => {
    try {
      if (!form.name || !form.email || !form.password) {
        return setMsg("Fill all fields");
      }

      if (!file) {
        return setMsg("Upload face image");
      }

      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("email", form.email);
      fd.append("password", form.password);
      fd.append("file", file);

      const res = await axios.post(`${API}/register`, fd);

      if (res.data.message) {
        setMsg("Registered successfully ✅");
        setStep("login");
      } else {
        setMsg(res.data.error);
      }

    } catch (err) {
      console.log(err);
      setMsg("Register failed");
    }
  };

  const login = async () => {
    try {
      const res = await axios.post(`${API}/login`, {
        email: form.email,
        password: form.password,
      });

      if (res.data.user_id) {
        setUserId(res.data.user_id);
        setStep("face");
        setMsg("Look at camera 👤");
      } else {
        setMsg(res.data.error);
      }

    } catch (err) {
      setMsg("Login failed");
    }
  };

  const captureAndVerify = async () => {
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      const blob = await fetch(imageSrc).then(res => res.blob());

      const fd = new FormData();
      fd.append("user_id", userId);
      fd.append("file", blob, "face.jpg");

      const res = await axios.post(`${API}/verify-face`, fd);

      if (res.data.user) {
        setUser(res.data.user);
        setMsg("");
        setStep("home");
      } else {
        setMsg(res.data.error);
      }

    } catch (err) {
      setMsg("Face verification failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>🔐 AI Face Auth</h2>

        {/* REGISTER */}
        {step === "register" && (
          <>
            <input
              style={styles.input}
              placeholder="Name"
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <input
              style={styles.input}
              placeholder="Email"
              onChange={e => setForm({ ...form, email: e.target.value })}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              onChange={e => setForm({ ...form, password: e.target.value })}
            />

            <input
              style={styles.input}
              type="file"
              onChange={e => setFile(e.target.files[0])}
            />

            <button style={styles.btn} onClick={register}>
              Register
            </button>

            <p style={styles.link} onClick={() => setStep("login")}>
              Already have account? Login
            </p>
          </>
        )}

        {/* LOGIN */}
        {step === "login" && (
          <>
            <input
              style={styles.input}
              placeholder="Email"
              onChange={e => setForm({ ...form, email: e.target.value })}
            />

            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              onChange={e => setForm({ ...form, password: e.target.value })}
            />

            <button style={styles.btn} onClick={login}>
              Login
            </button>

            <p style={styles.link} onClick={() => setStep("register")}>
              Create account
            </p>
          </>
        )}

        {/* FACE */}
        {step === "face" && (
          <>
            <p>👤 Look at camera</p>

            <div style={styles.cameraBox}>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                style={styles.camera}
              />
            </div>

            <button style={styles.btn} onClick={captureAndVerify}>
              Verify Face
            </button>
          </>
        )}

        {/* HOME */}
        {step === "home" && user && (
          <>
            <h2>🎉 Welcome</h2>

            <div style={styles.profile}>
              <p><b>Name:</b> {user.name}</p>
              <p><b>Email:</b> {user.email}</p>
            </div>

            <button
              style={styles.logout}
              onClick={() => {
                setStep("login");
                setUser(null);
                setMsg("");
              }}
            >
              Logout
            </button>
          </>
        )}

        {msg && <p style={styles.message}>{msg}</p>}
      </div>
    </div>
  );
}

// 🎨 CSS
const styles = {
  container: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b)",
    color: "white",
  },

  card: {
    background: "rgba(30, 41, 59, 0.9)",
    padding: 30,
    borderRadius: 15,
    width: 350,
    textAlign: "center",
    boxShadow: "0 0 30px rgba(0,0,0,0.6)",
  },

  title: {
    marginBottom: 20,
  },

  input: {
    width: "100%",
    padding: 12,
    margin: "10px 0",
    borderRadius: 8,
    border: "none",
  },

  btn: {
    width: "100%",
    padding: 12,
    marginTop: 10,
    background: "#3b82f6",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
  },

  link: {
    marginTop: 10,
    color: "#60a5fa",
    cursor: "pointer",
  },

  cameraBox: {
    margin: "15px 0",
    borderRadius: 12,
    overflow: "hidden",
    border: "2px solid #3b82f6",
  },

  camera: {
    width: "100%",
  },

  profile: {
    marginTop: 20,
    textAlign: "left",
  },

  logout: {
    marginTop: 20,
    padding: 10,
    width: "100%",
    background: "#ef4444",
    border: "none",
    borderRadius: 8,
    color: "white",
    cursor: "pointer",
  },

  message: {
    marginTop: 10,
    fontSize: "14px",
    color: "#93c5fd",
  },
};

export default App;