const packagejson = require("../../package.json");

const path = require("path");
const fs = require("fs");
const { toB64, writeJson, secureKey, readJson } = require("../../tools");
const Db = require("../../db");

const getWallet = (email) => path.resolve(__dirname, "..", "..", "data", toB64(email));
const getWalletFile = (email) => path.resolve(getWallet(email), "wallet");
const getMetasFile = (email) => path.resolve(getWallet(email), "metas");

const walletExists = (email) => {
    const walletPath = getWallet(email);
    return fs.existsSync(walletPath);
};

const purgeWallet = (email) => {
    try {
        fs.rmSync(getWallet(email), { recursive: true, force: true });
        return true;
    } catch (err) {
        return false;
    }
};

const createWallet = ({ email, password, name, note, walletItems, categories, paytypes, thirdparties }) => {
    try {
        if (walletExists(email)) return false;

        const walletPath = getWallet(email);
        fs.mkdirSync(walletPath, { recursive: true });

        const walletMetasFile = getMetasFile(email);
        writeJson(
            walletMetasFile,
            {
                email,
                name,
                note,
                walletItems,
                categories,
                paytypes,
                thirdparties,
                walletKey: secureKey.generate(32),
                version: packagejson.version
            },
            password
        );

        const db = new Db(getWalletFile(email));
        const created = db
            .open()
            .then(() => {
                db.save();
                db.close();
                return true;
            })
            .catch((err) => {
                console.log(err);
                return false;
            });

        return created;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const openWalletMetas = ({ email, password }) => {
    try {
        if (!walletExists(email)) return null;

        const walletMetasFile = getMetasFile(email);
        const metas = readJson(walletMetasFile, password);

        return metas;
    } catch (err) {
        console.error(err);
        return null;
    }
};

module.exports = { getWallet, getMetasFile, getWalletFile, walletExists, purgeWallet, createWallet, openWalletMetas };
