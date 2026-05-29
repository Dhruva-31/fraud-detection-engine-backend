const prisma = require("../config/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const AppError = require("../utils/AppError");

const registerService = async (name, email, password) => {

  if (!name || !email || !password) {
      throw new AppError("name, email and password are required", 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 409);
    }

    // Hash the password — 10 salt rounds
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user + behavior profile in one transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, passwordHash }
      });

      // Create an empty behavior profile for the user
      await tx.userBehaviorProfile.create({
        data: { userId: newUser.id }
      });

      return newUser;
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return { user, token }  
}

const loginService = async (email, password) => {
  if (!email || !password) {
      throw new AppError("Email and password are required", 400);
  }

  // Find user
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (!existingUser) {
    throw new AppError("Invalid credentials", 401);
  }

  // Compare password with hash
  const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);

  if (!isPasswordValid) {
    throw new AppError("Invalid credentials", 401);
  }

  // Generate JWT
  const token = jwt.sign(
    { userId: existingUser.id, email: existingUser.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const { hashed_password, ...user } = existingUser;

  return { user, token };
}

const getMeService = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });
  return user;
}
module.exports = {
  registerService,
  loginService,
  getMeService
}