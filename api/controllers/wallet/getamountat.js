const { Router, response } = require("express");
const multer = require("multer");
const { getAmountAt, walletExists } = require("../../../src/wrappers/wallet_lib");
const { decryptBodyData } = require("../../../tools");

const upload = multer();
const router = Router();

router.post("/", upload.none(), async (req, res = response) => {
    try {
        const data = decryptBodyData(req.body);
        const { email } = data;

        let response = { amount: 0.0, errorCode: 0, errorMessage: null };

        if (!walletExists(email)) {
            return res.status(200).send({
                ...response,
                errorCode: 404,
                errorMessage: "Compte utilisateur inconnu!"
            });
        }

        const amount = await getAmountAt(data);

        res.status(200).send({ ...response, amount });
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
});

module.exports = router;
