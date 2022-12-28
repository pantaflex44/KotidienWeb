const { Router, response } = require("express");
const multer = require("multer");
const { walletExists, saveWalletMetas, purgeWallet } = require("../../../src/wrappers/wallet_lib");
const { decryptBodyData } = require("../../../tools");

const upload = multer();
const router = Router();

router.post("/", upload.none(), async (req, res = response) => {
    try {
        const data = decryptBodyData(req.body);
        const { email } = data;

        let response = { saved: false, errorCode: 0, errorMessage: null };

        if (!walletExists(email)) {
            return res.status(200).send({
                ...response,
                errorCode: 401,
                errorMessage: "Enregistré non autorisé pour ce compte!"
            });
        }

        const saved = saveWalletMetas(data);

        res.status(200).send({ ...response, saved });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
