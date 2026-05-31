const {
  registerService,
  loginService,
  getMeService,
} = require("../services/authService");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const { user, token } = await registerService(name, email, password);

  res.status(201).json({
    message: "User registered successfully",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const { user, token } = await loginService(email, password);

  res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};

const getMe = async (req, res) => {
  const user = await getMeService(req.user.userId);
  res.status(200).json({ message: "Retrivel successful", user });
};

module.exports = { register, login, getMe };
