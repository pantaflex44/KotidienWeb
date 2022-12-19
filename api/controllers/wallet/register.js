const { Router, response } = require("express");
const multer = require("multer");
const { walletExists, createWallet, purgeWallet } = require("../../../src/wrappers/wallet_lib");
const {   decryptBodyData } = require("../../../tools");

const upload = multer();
const router = Router();

router.post("/", upload.none(), async (req, res = response) => {
    try {
        const data = decryptBodyData(req.body);
        const { email } = data;

        let response = { registered: false, errorCode: 0, errorMessage: null };

        if (walletExists(email)) {
            return res.status(200).send({
                ...response,
                errorCode: 409,
                errorMessage: "Un portefeuille existe déjà avec cet identifiant!"
            });
        }

        const created = createWallet(data);
        if (!created) {
            purgeWallet(email);

            return res.status(200).send({
                ...response,
                errorCode: 422,
                errorMessage: "Impossible de créer le portefeuille avec ces informations!"
            });
        }

        res.status(200).send({ ...response, registered: created });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
