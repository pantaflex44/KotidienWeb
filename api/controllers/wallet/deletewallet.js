const fs = require("fs");
const path = require("path");
const { Router, response } = require("express");
const multer = require("multer");
const { walletExists, deleteWallet, openWalletMetas } = require("../../../src/wrappers/wallet_lib");
const { decryptBodyData } = require("../../../tools");

const upload = multer();
const router = Router();

router.post("/", upload.none(), async (req, res = response) => {
    try {
        const data = decryptBodyData(req.body);
        const { email } = data;

        let response = { deleted: false, errorCode: 0, errorMessage: null };

        if (!walletExists(email)) {
            return res.status(200).send({
                ...response,
                errorCode: 404,
                errorMessage: "Identifiant ou mot de passe inconnu!"
            });
        }

        const metas = openWalletMetas(data);
        if (metas === null || metas.email !== email) {
            return res.status(200).send({
                ...response,
                errorCode: 401,
                errorMessage: "Suppression refusée."
            });
        }

        const deleted = deleteWallet(email);

        res.status(200).send({ ...response, deleted });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
