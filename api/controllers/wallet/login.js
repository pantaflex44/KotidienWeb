const { Router, response } = require("express");
const multer = require("multer");
const { walletExists, openWalletMetas } = require("../../../src/wrappers/wallet_lib");
const { decryptBodyData, encryptData } = require("../../../tools");

const upload = multer();
const router = Router();

router.post("/", upload.none(), async (req, res = response) => {
    try {
        const data = decryptBodyData(req.body);
        const { email } = data;

        let response = { metas: null, errorCode: 0, errorMessage: null };

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
                errorMessage: "Connexion refusée."
            });
        }

        res.status(200).send({ ...response, metas: encryptData(metas) });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
