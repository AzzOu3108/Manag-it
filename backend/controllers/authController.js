const crypto = require('node:crypto')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { User, RefreshToken } = require('../models/index')
const generateToken = require('../utils/generateToken')
const { builtinModules } = require('node:module')


//hash a refresh token so the raw token is never stored in the DB
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex")

// the user shape the frontend expects {id, fullname, email}
const publicUser = (user) => ({id: user.id, fullname: user.fullName, email: user.email})

// issue an access + refresh pair and store the refresh token (hashed)
const issueTokens = async (user) => {
    const accessToken = generateToken(user.id, "access")
    const refreshToken = generateToken(user.id, "refresh")

    await RefreshToken.create({
        user: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    })

    return {accessToken, refreshToken}
}

const signup = async (req, res) => {
    const {fullName, email, password } = req.body

    if(!fullName || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    try {
        const existing = await User.findOne({email})

        if(existing){
            return res.status(409).json({error: "That email is already registered"})
        }

        const hashedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({ fullName, email, password: hashedPassword})
        const tokens = await issueTokens(user)

        res.status(201).json({...tokens, user: publicUser(user)})
    } catch (error) {
        console.error("Signup error:", error)
        res.status(500).json({error: "Server error."})
    }
}

const login = async (req, res) => {
    const {email, password} = req.body

    if(!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    try {
        const user = await User.findOne({email}).select('+password')
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid email or password." });
        }

        const tokens = await issueTokens(user);

        res.json({ ...tokens, user: publicUser(user) });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Server error." });
    }
}

const refresh = async (req, res) => {
    const {refreshToken} = req.body

    if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required." });
    }

    try {
        const storedToken = await RefreshToken.findOne({tokenHash: hashToken(refreshToken)})
        if (!storedToken) {
            return res.status(403).json({ error: "Invalid refresh token." });
        } 

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

        const user = await User.findById(decoded.sub)
        if (!user) {
            return res.status(403).json({ error: "User not found." });
        }

        res.json({ accessToken: generateToken(user.id, "access") });
    } catch (error) {
        console.error("Refresh token error:", error);
        res.status(500).json({ error: "Server error." });
    }
}

const logout =  async (req, res) => {
   const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      // Revoke the session server-side (best effort — the client clears
      // its tokens regardless).
      await RefreshToken.deleteOne({ tokenHash: hashToken(refreshToken) });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Server error." });
  }
};

const me = async (req, res) => {
  res.json({ user: publicUser(req.user) });
}; 

module.exports = {signup, login, refresh, logout, me}