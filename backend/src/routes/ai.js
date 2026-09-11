const express = require("express");
const router = express.Router();
const { generateRetentionStrategy, getModels } = require("../controllers/aiController");

router.post("/retention-strategy", generateRetentionStrategy);
router.post("/chat", require("../controllers/aiController").chat);
router.get("/models", getModels);

module.exports = router;
