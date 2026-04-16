const express = require("express");
const router = express.Router();
const controller = require("../controllers/analytics.controller");
const auth = require("../middleware/auth.middleware");

router.use(auth);

router.get("/progress", controller.getProgress);
router.get("/streak", controller.getStreak);

module.exports = router;
