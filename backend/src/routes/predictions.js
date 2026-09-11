const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/predictionController");

router.post("/predict", ctrl.predict);
router.post("/simulate", ctrl.simulate);
router.get("/history", ctrl.getHistory);
router.get("/stats", ctrl.getStats);
router.get("/:id", ctrl.getById);
router.delete("/:id", ctrl.remove);

module.exports = router;
