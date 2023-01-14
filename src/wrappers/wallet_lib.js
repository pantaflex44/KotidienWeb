const packagejson = require("../../package.json");

const path = require("path");
const fs = require("fs");
const { toB64, writeJson, secureKey, readJson, uid, getDatePattern } = require("../../tools");
const Db = require("../../db");
const dayjs = require("dayjs");

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
                        },
                        dateformat: "DD/MM/YYYY"
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

        let formattedFilters = [
            `DATE(date) >= DATE('${dayjs(filters.startDate)
                .locale(packagejson.i18n.defaultLocale)
                .format("YYYY-MM-DD")}') AND DATE(date) <= DATE('${dayjs(filters.endDate)
                .locale(packagejson.i18n.defaultLocale)
                .format("YYYY-MM-DD")}')`
        ];

        let types = [];
        if (filters.types.includes("transfers")) types.push("(type = 'transfer')");
        if (filters.types.includes("pendings")) types.push("(type = 'operation' AND amount < 0)");
        if (filters.types.includes("incomes")) types.push("(type = 'operation' AND amount >= 0)");
        formattedFilters = [...formattedFilters, `(${types.join(" OR ")})`];

        if (filters.states === "closed") formattedFilters = [...formattedFilters, "state = 1"];
        if (filters.states === "notclosed") formattedFilters = [...formattedFilters, "state = 0"];

        if (filters.paytypes.length > 0) {
            let paytypes = filters.paytypes.map((p) => `paytypeId = '${p}'`);
            formattedFilters = [...formattedFilters, `(${paytypes.join(" OR ")})`];
        }

        if (filters.categories.length > 0) {
            let categories = filters.categories.map((c) => `categoryId = '${c}'`);
            formattedFilters = [...formattedFilters, `(${categories.join(" OR ")})`];
        }

        if (filters.thirdparties.length > 0) {
            let thirdparties = filters.thirdparties.map((t) => `thirdpartyId = '${t}'`);
            formattedFilters = [...formattedFilters, `(${thirdparties.join(" OR ")})`];
        }

        const db = new Db(getWalletFile(email));
        const operations = db
            .open()
            .then((conn) => {
                let opeResult = [];
                conn.each(
                    "SELECT * FROM Operations WHERE toWalletItemId = :walletId AND " + formattedFilters.join(" AND "),
                    {
                        ":walletId": walletItemId
                    },
                    (row) => {
                        if (row) opeResult.push(row);
                    }
                );

                let trfResult = [];
                conn.each(
                    "SELECT * FROM Operations WHERE fromWalletItemId = :walletId AND " + formattedFilters.join(" AND "),
                    {
                        ":walletId": walletItemId
                    },
                    (row) => {
                        if (row) trfResult.push({ ...row, amount: row.amount < 0 ? -row.amount : row.amount });
                    }
                );

                db.close();

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

        return operations;
    } catch (err) {
        console.error(err);
        return 0.0;
    }
};

const deleteOperations = (data) => {
    try {
        const { email, walletItems } = data;

        const allItems = walletItems.map((item) => item.id);

        const db = new Db(getWalletFile(email));
        const deleted = db
            .open()
            .then((conn) => {
                const query = `DELETE FROM Operations WHERE (${allItems
                    .map((k, idx) => `id = :id${idx}`)
                    .join(" OR ")})`;
                const values = Object.fromEntries(Object.keys(allItems).map((k, idx) => [[`:id${idx}`], allItems[k]]));

                conn.run(query, values);
                db.save();
                db.close();

                return true;
            })
            .catch((err) => {
                db.close();
                console.error("sql", err);
                return false;
            })
            .finally(() => {
                db.close();
            });

        return deleted;
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
    getOperations,
    deleteOperations
};
