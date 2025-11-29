// src/config/razorpay.js
import assert from "assert";

const {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET
} = process.env;

// Fail fast if required secrets are missing
assert(RAZORPAY_KEY_ID, "RAZORPAY_KEY_ID required");
assert(RAZORPAY_KEY_SECRET, "RAZORPAY_KEY_SECRET required");
assert(RAZORPAY_WEBHOOK_SECRET, "RAZORPAY_WEBHOOK_SECRET required");

const razorpayConfig = {
  keyId: RAZORPAY_KEY_ID,
  keySecret: RAZORPAY_KEY_SECRET,
  webhookSecret: RAZORPAY_WEBHOOK_SECRET,
  apiBase: "https://api.razorpay.com/v1",
};

export default razorpayConfig;
