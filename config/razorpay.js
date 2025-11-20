// src/config/razorpay.js
const assert = require('assert');

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET
} = process.env;

assert(RAZORPAY_KEY_ID, 'RAZORPAY_KEY_ID required');
assert(RAZORPAY_KEY_SECRET, 'RAZORPAY_KEY_SECRET required');
assert(RAZORPAY_WEBHOOK_SECRET, 'RAZORPAY_WEBHOOK_SECRET required');

module.exports = {
  keyId: RAZORPAY_KEY_ID,
  keySecret: RAZORPAY_KEY_SECRET,
  webhookSecret: RAZORPAY_WEBHOOK_SECRET,
  apiBase: 'https://api.razorpay.com/v1'
};
