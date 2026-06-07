const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/AppError");

const registerService = async (name, email, password) => {
  if (!name || !email || !password) {
    throw new AppError("name, email and password are required", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError("User with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { name, email, passwordHash },
    });

    await tx.userBehaviorProfile.create({
      data: { userId: newUser.id },
    });

    return newUser;
  });

  const access_token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const refresh_token = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );

  return { user, access_token, refresh_token };
};

const loginService = async (email, password) => {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    throw new AppError("Invalid credentials", 401);
  }

  const isPasswordValid = await bcrypt.compare(
    password,
    existingUser.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  const access_token = jwt.sign(
    { userId: existingUser.id, email: existingUser.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const refresh_token = jwt.sign(
    { userId: existingUser.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );

  const { hashed_password, ...user } = existingUser;

  return { user, access_token, refresh_token };
};

const refreshService = async (refresh_token) => {
  if (!refresh_token) {
    throw new AppError("No refresh token provided", 401);
  }

  const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN_SECRET);

  const new_access_token = jwt.sign(
    { userId: decoded.userId, email: decoded.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );

  const new_refresh_token = jwt.sign(
    { userId: decoded.userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "7d" },
  );

  return { new_access_token, new_refresh_token };
};

const getMeService = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
  return user;
};
module.exports = {
  registerService,
  loginService,
  refreshService,
  getMeService,
};
