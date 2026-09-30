import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { query } from "../db/index.js";

const router = Router();

const sign = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res
      .status(400)
      .json({ message: "Name, email and a 6+ char password are required" });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await query(
      `INSERT INTO users (name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, role`,
      [name, email.toLowerCase(), hash]
    );
    const user = rows[0];
    res.status(201).json({ token: sign(user), user });
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ message: "Email already registered" });
    }
    throw e;
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [
    (email || "").toLowerCase(),
  ]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password || "", user.password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({
    token: sign(user),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export default router;
