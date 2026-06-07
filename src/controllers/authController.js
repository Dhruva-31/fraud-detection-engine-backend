const {
  registerService,
  loginService,
  getMeService,
  refreshService,
} = require("../services/authService");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  const { user, access_token, refresh_token } = await registerService(name, email, password);

  res.status(201).json({
    message: "User registered successfully",
    access_token,
    refresh_token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const { user, access_token, refresh_token } = await loginService(email, password);

  res.status(200).json({
    message: "Login successful",
    access_token,
    refresh_token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
  });
};

const refresh = async (req, res) =>  {
  const { refresh_token } = req.body;
  const { new_access_token, new_refresh_token } = await refreshService(refresh_token);

  res.status(200).json({
    message: "Refresh successful",
    access_token: new_access_token,
    refresh_token: new_refresh_token
  });
}

const getMe = async (req, res) => {
  const user = await getMeService(req.user.userId);
  res.status(200).json({ message: "Retrivel successful", user });
};

module.exports = { register, login, refresh, getMe };
