const packagejson = require("../../package.json");

const path = require("path");
const fs = require("fs");
const { toB64, writeJson, secureKey, readJson, uid } = require("../../tools");
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
                params: {
                    csv: {
                        separators: {
                            columns: ";",
                            decimals: ","
                        }
                    },
                    filters: {
                        walletItemView: {}
                    },
                    sorters: {
                        walletItemView: {}
                    },
                    views: { showResumeBox: true, extendOperations: true }
                },
                walletKey: secureKey.generate(32),
                version: packagejson.version
            },
            password
        );

        const db = new Db(getWalletFile(email));
        return db
            .open()
            .then(() => {
                db.save();
                db.close();
                return true;
            })
            .catch((err) => {
                console.error(err);
                return false;
            });
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

const saveWalletMetas = (data) => {
    try {
        const { email, password, ...rest } = data;

        if (!walletExists(email)) return false;

        const walletMetasFile = getMetasFile(email);
        writeJson(walletMetasFile, { ...rest, email }, password);

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const saveOperation = (data) => {
    try {
        const { email, id, type, toWalletItemId, amount, comment, title, date, state, ...rest } = data;
        let queryParams = {
            id,
            type,
            toWalletItemId,
            amount,
            comment,
            title,
            date,
            state
        };

        if (type === "operation") {
            const { categoryId, paytypeId, thirdpartyId } = rest;
            queryParams = { ...queryParams, categoryId, paytypeId, thirdpartyId };
        } else if (type === "transfer") {
            const { fromWalletItemId } = rest;
            queryParams = { ...queryParams, fromWalletItemId };
        }

        const db = new Db(getWalletFile(email));
        const saved = db
            .open()
            .then((conn) => {
                const query = `REPLACE INTO Operations (${Object.keys(queryParams).join(", ")}) VALUES (${Object.keys(
                    queryParams
                )
                    .map((k) => `:${k}`)
                    .join(", ")})`;
                const values = Object.fromEntries(Object.keys(queryParams).map((k) => [[`:${k}`], queryParams[k]]));

                conn.run(query, values);
                db.save();
                db.close();

                return true;
            })
            .catch((err) => {
                db.close();
                console.error(err);
                return false;
            })
            .finally(() => {
                db.close();
            });

        return saved;
    } catch (err) {
        console.error(err);
        return false;
    }
};

const getAmountAt = (data) => {
    try {
        const { email, walletId, date } = data;
        const bind = { ":date": date, ":walletId": walletId };

        const db = new Db(getWalletFile(email));
        const amount = db
            .open()
            .then((conn) => {
                const opeStmt = conn.prepare(
                    "SELECT SUM(amount) FROM Operations WHERE DATE(date) <= DATE(:date) AND toWalletItemId = :walletId"
                );
                const opeResult = (opeStmt.get(bind) || []).filter((r) => r !== null);

                const trfStmt = conn.prepare(
                    "SELECT SUM(amount) FROM Operations WHERE DATE(date) <= DATE(:date) AND fromWalletItemId = :walletId"
                );
                const trfResult = (trfStmt.get(bind) || []).filter((r) => r !== null).map((r) => (r < 0 ? r * -1 : r));

                db.close();

                const opeAmount = opeResult.reduce((a, b) => a + b, 0);
                const trfAmount = trfResult.reduce((a, b) => a + b, 0);

                return opeAmount + trfAmount;
            })
            .catch((err) => {
                db.close();
                console.error("sql", err);
                return 0.0;
            })
            .finally(() => {
                db.close();
            });

        return amount;
    } catch (err) {
        console.error(err);
        return 0.0;
    }
};

const getOperations = (data) => {
    try {
        const { email, walletItemId, filters } = data;

        const db = new Db(getWalletFile(email));
        const amount = db
            .open()
            .then((conn) => {
                let opeResult = [];
                conn.each(
                    "SELECT * FROM Operations WHERE toWalletItemId = :walletId",
                    {
                        ":walletId": walletItemId
                    },
                    (row) => {
                        if (row) opeResult.push(row);
                    }
                );

                let trfResult = [];
                conn.each(
                    "SELECT * FROM Operations WHERE fromWalletItemId = :walletId",
                    {
                        ":walletId": walletItemId
                    },
                    (row) => {
                        if (row) trfResult.push({ ...row, amount: row.amount < 0 ? -row.amount : row.amount });
                    }
                );

                return [...opeResult, ...trfResult];
            })
            .catch((err) => {
                db.close();
                console.error("sql", err);
                return 0.0;
            })
            .finally(() => {
                db.close();
            });

        return amount;
    } catch (err) {
        console.error(err);
        return 0.0;
    }
};

module.exports = {
    getWallet,
    getMetasFile,
    getWalletFile,
    walletExists,
    purgeWallet,
    createWallet,
    openWalletMetas,
    saveWalletMetas,
    saveOperation,
    getAmountAt,
    getOperations
};
