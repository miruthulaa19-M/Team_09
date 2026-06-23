import { useState } from "react";
import "../styles/AdminLogin.css";

function AdminLogin() {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
  const nameRegex = /^[a-zA-Z\s]+$/;
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9]).{6,}$/;

  const emptyLoginValues = {
    email: "",
    password: "",
  };

  const emptyRegisterValues = {
    name: "",
    email: "",
    password: "",
  };

  const [isRegister, setIsRegister] = useState(false);
  const [loginValues, setLoginValues] = useState(emptyLoginValues);
  const [registerValues, setRegisterValues] = useState(emptyRegisterValues);
  const [loginErrors, setLoginErrors] = useState(emptyLoginValues);
  const [registerErrors, setRegisterErrors] = useState(emptyRegisterValues);
  const [successMessage, setSuccessMessage] = useState("");

  const validateEmail = (email) => {
    if (!email.trim()) {
      return "This field is required";
    }

    if (!emailRegex.test(email)) {
      return "Email must be a valid @gmail.com address";
    }

    return "";
  };

  const validatePassword = (password) => {
    if (!password.trim()) {
      return "This field is required";
    }

    if (!passwordRegex.test(password)) {
      return "Password must be at least 6 characters and include both letters and numbers";
    }

    return "";
  };

  const validateName = (name) => {
    if (!name.trim()) {
      return "This field is required";
    }

    if (name.trim().length < 2 || !nameRegex.test(name)) {
      return "Name must contain letters only";
    }

    return "";
  };

  const handleLoginChange = (event) => {
    const { name, value } = event.target;

    setLoginValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleRegisterChange = (event) => {
    const { name, value } = event.target;

    setRegisterValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setSuccessMessage("");

    const nextErrors = {
      email: validateEmail(loginValues.email),
      password: validatePassword(loginValues.password),
    };

    setLoginErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setSuccessMessage("Login Successful!");
  };

  const handleRegister = (event) => {
    event.preventDefault();
    setSuccessMessage("");

    const nextErrors = {
      name: validateName(registerValues.name),
      email: validateEmail(registerValues.email),
      password: validatePassword(registerValues.password),
    };

    setRegisterErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setSuccessMessage("Successfully Registered! You can now log in.");
    setRegisterValues(emptyRegisterValues);
  };

  const toggleForm = () => {
    setIsRegister((currentValue) => !currentValue);
    setSuccessMessage("");
    setLoginErrors(emptyLoginValues);
    setRegisterErrors(emptyRegisterValues);
  };

  return (

    <div className="admin-container">

      <div className="admin-box">

        <h1 className="brand-title">VendorMS</h1>
        <h2>{isRegister ? "Create Account" : "Admin Login"}</h2>

        {successMessage && (
          <p className="success-message">
            {successMessage}
          </p>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin} noValidate>

          {isRegister && (
            <div className="input-group">

              <label htmlFor="register-name">Name</label>

              <input
                id="register-name"
                name="name"
                type="text"
                placeholder="Enter Name"
                value={registerValues.name}
                onChange={handleRegisterChange}
              />

              {registerErrors.name && (
                <span className="error-message">{registerErrors.name}</span>
              )}

            </div>
          )}

          <div className="input-group">

            <label htmlFor={isRegister ? "register-email" : "login-email"}>
              Email
            </label>

            <input
              id={isRegister ? "register-email" : "login-email"}
              name="email"
              type="email"
              placeholder="example@gmail.com"
              value={isRegister ? registerValues.email : loginValues.email}
              onChange={isRegister ? handleRegisterChange : handleLoginChange}
            />

            {(isRegister ? registerErrors.email : loginErrors.email) && (
              <span className="error-message">
                {isRegister ? registerErrors.email : loginErrors.email}
              </span>
            )}

          </div>

          <div className="input-group">

            <label htmlFor={isRegister ? "register-password" : "login-password"}>
              Password
            </label>

            <input
              id={isRegister ? "register-password" : "login-password"}
              name="password"
              type="password"
              placeholder="Enter Password"
              value={isRegister ? registerValues.password : loginValues.password}
              onChange={isRegister ? handleRegisterChange : handleLoginChange}
            />

            {(isRegister ? registerErrors.password : loginErrors.password) && (
              <span className="error-message">
                {isRegister ? registerErrors.password : loginErrors.password}
              </span>
            )}

          </div>

          {!isRegister && (
            <div className="forgot">

              <a href="#">Forgot Password?</a>

            </div>
          )}

          <button
            className="signup-btn"
            type="submit"
          >
            {isRegister ? "Sign Up" : "Login"}
          </button>

        </form>

        <p className="signin-text">

          {isRegister ? "Do you already have an account?" : "Don't have an account?"}

          <span
            onClick={toggleForm}
            role="button"
            tabIndex="0"
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                toggleForm();
              }
            }}
          >
            {isRegister ? "Click Here Sign In" : "Sign Up"}
          </span>

        </p>

      </div>

    </div>

  );

}

export default AdminLogin;
