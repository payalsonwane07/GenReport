const Joi = require('joi');
const User = require('../models/User');

const themeSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'auto').required(),
});

exports.getTheme = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('theme');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ theme: user.theme || 'auto' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.saveTheme = async (req, res) => {
  try {
    const { error, value } = themeSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { theme: value.theme },
      { new: true }
    ).select('theme name email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ theme: user.theme, message: 'Theme saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTheme = exports.saveTheme;
