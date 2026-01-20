import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate with Google OAuth
 * @access  Public
 */
router.post('/google', async (req, res) => {
  try {
    const { googleId, email, displayName, avatarUrl, youtubeRefreshToken } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        error: { message: 'Google ID and email are required' }
      });
    }

    // Check if user exists
    let result = await query('SELECT * FROM users WHERE google_id = $1', [googleId]);

    let user;

    if (result.rows.length === 0) {
      // Create new user
      result = await query(
        `INSERT INTO users (google_id, email, display_name, avatar_url, youtube_refresh_token_encrypted, tier)
         VALUES ($1, $2, $3, $4, $5, 'free')
         RETURNING id, email, google_id, display_name, avatar_url, tier, created_at`,
        [googleId, email, displayName, avatarUrl, youtubeRefreshToken]
      );
      user = result.rows[0];
      console.log('✅ New user created:', user.email);
      // Update existing user - preserve token if not provided
      result = await query(
        `UPDATE users
         SET display_name = $1, 
             avatar_url = $2, 
             youtube_refresh_token_encrypted = COALESCE($3, youtube_refresh_token_encrypted), 
             updated_at = NOW()
         WHERE google_id = $4
         RETURNING id, email, google_id, display_name, avatar_url, tier, created_at`,
        [displayName, avatarUrl, youtubeRefreshToken, googleId]
      );
      user = result.rows[0];
      console.log('✅ User logged in:', user.email);
    }

    // Generate JWT token
    const token = generateToken(user.id);

    // Set token in cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          avatarUrl: user.avatar_url,
          tier: user.tier
        },
        token
      }
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Authentication failed' }
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.email, u.display_name, u.avatar_url, u.tier, u.daily_usage, u.daily_limit, u.total_processed,
              s.status as subscription_status, s.current_period_end
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active'
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    res.json({
      success: true,
      data: { user: result.rows[0] }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to get user' }
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', protect, (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  res.json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
});

export default router;
