import React, { useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../Assets/css/login.css"; // Ensure this file exists and has all the necessary styling

const SignUp = () => {
  const [user, setUser] = useState({
    name: "",
    username: "",
    phone: "",
    password: "",
  });

  const handleInputs = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
    console.log(user);
  };

  const submitForm = async () => {
    // Basic form validation
    if (!user.name || !user.username || !user.phone || !user.password) {
      toast.warn("Please fill all the fields", {
        position: "top-center",
        autoClose: 2000,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
        draggable: true,
        textAlign: "center",
      });
      return;
    }

    // Make the API request
    try {
      const response = await axios.post(`http://localhost:5000/register`, user);
      const message = response.data.msg;
      const status = response.status;

      if (status === 200) {
        toast.success(`${message}`, {
          position: "top-center",
          autoClose: 2000,
          pauseOnHover: false,
          pauseOnFocusLoss: false,
          draggable: true,
          textAlign: "center",
        });
        setTimeout(() => {
          window.location.href = "/signin";
        }, 1500);
      } else if (status === 202) {
        toast.warn(`${message}`, {
          position: "top-center",
          autoClose: 2000,
          pauseOnHover: false,
          pauseOnFocusLoss: false,
          draggable: true,
          textAlign: "center",
        });
      }
    } catch (error) {
      console.error("Error during registration:", error);
      toast.error("Something went wrong. Please try again later.", {
        position: "top-center",
        autoClose: 2000,
        pauseOnHover: false,
        pauseOnFocusLoss: false,
        draggable: true,
        textAlign: "center",
      });
    }
  };

  return (
    <div className="login-top">
      <div className="login-inner-top-left" style={{ padding: "3rem" }}>
        <div className="login-title">bookWise</div>
        <div className="login-title-below">Register Your Account</div>
        <div className="login-signup-call">
          Already Have Account? <a href="/signin">SignIn</a>
        </div>

        <div className="login-form">
          <div className="login-field">
            <i className="login-icon fas fa-user"></i>
            <input
              type="text"
              className="login-input"
              name="name"
              placeholder="Your Name"
              onChange={handleInputs}
            />
          </div>

          <div className="login-field">
            <i className="login-icon fas fa-envelope"></i>
            <input
              type="text"
              className="login-input"
              name="username"
              placeholder="Email"
              onChange={handleInputs}
            />
          </div>

          <div className="login-field">
            <i className="login-icon fas fa-phone"></i>
            <input
              type="text"
              className="login-input"
              name="phone"
              placeholder="Your Phone Number"
              onChange={handleInputs}
            />
          </div>

          <div className="login-field">
            <i className="login-icon fas fa-lock"></i>
            <input
              type="password"
              className="login-input"
              name="password"
              placeholder="Password"
              onChange={handleInputs}
            />
          </div>

          <div className="land-button">
            <div
              className="landing-button-hover"
              style={{ cursor: "pointer" }}
              onClick={submitForm}
            >
              <span>SignUp</span>
            </div>
          </div>

          <ToastContainer />
        </div>
      </div>

      <div className="login-inner-top-right">
        <img
          className="login-img"
          src="https://raw.githubusercontent.com/AnuragRoshan/images/a74c41aa0efd44c9239abed96d88a5ffd11ffe7f/undraw_friendship_mni7.svg"
          alt="Signup Illustration"
        />
      </div>
    </div>
  );
};

export default SignUp;
