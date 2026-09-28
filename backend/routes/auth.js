const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = '7d'; // 7-day token

function signToken(user) {
  return jwt.sign(
    { userId: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

function safeUser(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    username: user.username,
    email: user.email,
    phone: user.phone || '',
    location: user.location || '',
    city: user.city || '',
    state: user.state || '',
    country: user.country || '',
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      fullName, username, email, password, confirmPassword,
      phone, location, city, state, country,
    } = req.body;

    // Required-field validation
    const missing = [];
    if (!fullName?.trim()) missing.push('fullName');
    if (!username?.trim()) missing.push('username');
    if (!email?.trim()) missing.push('email');
    if (!password) missing.push('password');
    if (!confirmPassword) missing.push('confirmPassword');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
        fields: missing,
      });
    }

    // Email format
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Invalid email address format.' });
    }

    // Username format
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(username.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Username must be 3–30 characters and contain only letters, numbers, underscores, dots, or hyphens.',
      });
    }

    // Password length
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    // Confirm password
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match.' });
    }

    // Duplicate checks
    const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const existingUsername = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username is already taken. Please choose another.' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const newUser = await User.create({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      passwordHash,
      phone: phone?.trim() || '',
      location: location?.trim() || '',
      city: city?.trim() || '',
      state: state?.trim() || '',
      country: country?.trim() || '',
      role: 'user',
    });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully. Please sign in.',
      user: safeUser(newUser),
    });
  } catch (err) {
    // Mongoose duplicate-key error (belt-and-suspenders)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      return res.status(409).json({
        success: false,
        message: field === 'email'
          ? 'An account with this email already exists.'
          : 'Username is already taken. Please choose another.',
      });
    }
    console.error('[Auth] Register error:', err.message);
    return res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = username OR email

    if (!identifier?.trim() || !password) {
      return res.status(400).json({ success: false, message: 'Username/email and password are required.' });
    }

    // Find user by email OR username — always select passwordHash for verification
    const user = await User.findOne({
      $or: [
        { email: identifier.trim().toLowerCase() },
        { username: identifier.trim().toLowerCase() },
      ],
    }).select('+passwordHash');

    // Generic error — don't reveal whether account exists
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username/email or password.' });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: safeUser(user),
    });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me   (protected)
// ──────────────────────────────────────────────────────────────────────────────
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User no longer exists.' });
    }
    return res.status(200).json({ success: true, user: safeUser(user) });
  } catch (err) {
    console.error('[Auth] /me error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch user.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/profile   (protected) — update profile
// ──────────────────────────────────────────────────────────────────────────────
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, location, city, state, country } = req.body;

    // Disallow changing username/email/role/password via this endpoint
    const updateData = {};
    if (fullName?.trim()) updateData.fullName = fullName.trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (location !== undefined) updateData.location = location.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (state !== undefined) updateData.state = state.trim();
    if (country !== undefined) updateData.country = country.trim();

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: safeUser(user),
    });
  } catch (err) {
    console.error('[Auth] Profile update error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/change-password   (protected)
// ──────────────────────────────────────────────────────────────────────────────
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'All password fields are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters.' });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ success: false, message: 'New passwords do not match.' });
    }

    const user = await User.findById(req.user.userId).select('+passwordHash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await user.save();

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (err) {
    console.error('[Auth] Change password error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout   (no server-side state; client clears token)
// ──────────────────────────────────────────────────────────────────────────────
router.post('/logout', authenticateToken, (req, res) => {
  // JWT is stateless. The client discards the token.
  // Add token blacklisting here if stricter security is needed.
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

module.exports = router;
