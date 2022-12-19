const fs = require("fs");
const path = require("path");
const { Router, response } = require("express");
const multer = require("multer");
const { walletExists } = require("../../../src/wrappers/wallet_lib");

const upload = multer();
const router = Router();

router.post("/", upload.none(), async (req, res = response) => {
    try {
        const { email } = req.body;

        const exists = walletExists(email)

        res.status(200).send(exists);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
