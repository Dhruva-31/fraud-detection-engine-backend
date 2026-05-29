const { registerService, loginService, getMeService } = require("../services/authService")

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const { user, token } = await registerService(name, email, password);

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Register error:\n", error);
    res.status(error.statusCode || 500).json({ message: error.message});
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await loginService(email, password)

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:\n", error);
    res.status(error.statusCode || 500).json({ message: error.message});
  }
};

const getMe = async (req, res) => {
  try {
    const user = await getMeService(req.user.userId);

    res.status(200).json({message: "Retrivel successful", user });

  } catch (error) {
    console.error("GetMe error:\n", error);
    res.status(error.statusCode || 500).json({ message: error.message});
  }
};

module.exports = { register, login, getMe };