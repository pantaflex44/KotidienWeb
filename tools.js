const packagejson = require("./package.json");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const passwordHash = require("password-hash");
const AES = require("crypto-js/aes");
const Base64 = require("crypto-js/enc-base64");
const Utf8 = require("crypto-js/enc-utf8");
const Db = require("./db");

Object.defineProperty(String.prototype, "capitalize", {
    value: function () {
        return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
    },
    enumerable: false
});

Object.defineProperty(String.prototype, "toHexColor", {
    value: function () {
        let hash = 0;
        if (this.length === 0) return hash;
        for (let i = 0; i < this.length; i++) {
            hash = this.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }
        var color = "#";
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 255;
            color += ("00" + value.toString(16)).substring(-2);
        }
        return color;
    },
    enumerable: false
});

Object.defineProperty(String.prototype, "toRgbColor", {
    value: function () {
        let hash = 0;
        if (this.length === 0) return hash;
        for (let i = 0; i < this.length; i++) {
            hash = this.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash;
        }
        let rgb = [0, 0, 0];
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 255;
            rgb[i] = value;
        }
        return rgb;
    },
    enumerable: false
});

const rgbMax = (rgb, rgbMax = 255) => {
    const mx = Math.max(...rgb);

    if (mx > rgbMax) {
        const d = rgbMax / mx;
        let result = [~~Math.ceil(rgb[0] * d), ~~Math.ceil(rgb[1] * d), ~~Math.ceil(rgb[2] * d)];

        result = result.map((r) => {
            if (r < 0) return 0;
            if (r > 255) return 255;
            return r;
        });

        return result;
    }

    return rgb;
};

function hashCode(str) {
    let hash = 0;
    for (var i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
}

function intToRGB(i, theme = "light") {
    const mask = theme === "dark" ? 0x00ffffff : 0x00cccccc;
    const c = (i & mask).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
}

function strToColor(str, theme = "light") {
    return intToRGB(hashCode(str));
}

const findEnvFile = (prefix = "App") => {
    let envFile = `./.env.${process.env.NODE_ENV}`;
    try {
        if (!fs.existsSync(envFile)) {
            console.log(`[${prefix}] Dotenv ${envFile} not found. .env used.`);
            envFile = "./.env";
        }
    } catch {
        console.error(`[${prefix}] Unable to know if ${envFile} exists. .env used.`);
        envFile = "./.env";
    }
    return envFile;
};

const hashPassword = (password) => passwordHash.generate(password);
const verifyHashedPassword = (password, hashedPassword) => passwordHash.verify(password, hashedPassword);

const data2body = (data = {}) => {
    const body = new FormData();
    for (let key of Object.keys(data)) {
        body.append(key, data[key]);
    }
    return body;
};

const encryptData = (data = {}) => {
    const flatData = JSON.stringify(data);
    const encrypted = AES.encrypt(flatData, process.env.SESSIONS_SECRET);
    const utf8Encrypted = Utf8.parse(encrypted);
    const encryptedData = Base64.stringify(utf8Encrypted);
    return encryptedData;
};

const encryptedData2body = (data = {}) => {
    const body = new FormData();
    body.append("data", encryptData(data));
    return body;
};

const decryptData = (data = "") => {
    try {
        const encryptedData = Base64.parse(data);
        const utf8EncryptedData = Utf8.stringify(encryptedData);
        const decryptedData = AES.decrypt(utf8EncryptedData, process.env.SESSIONS_SECRET);
        const body = Utf8.stringify(decryptedData);
        return JSON.parse(body);
    } catch (err) {
        console.error(err);
        return null;
    }
};

const decryptBodyData = (bodyData) => {
    try {
        const { data } = bodyData;
        const decryptedData = decryptData(data);
        return decryptedData;
    } catch (err) {
        console.error(err);
        return null;
    }
};

const secureKey = {
    _pattern: /[a-zA-Z0-9_\-\+\.]/,

    _getRandomByte: function () {
        if (crypto && crypto.getRandomValues) {
            var result = new Uint8Array(1);
            crypto.getRandomValues(result);
            return result[0];
        } else {
            return Math.floor(Math.random() * 256);
        }
    },

    generate: function (length) {
        return Array.apply(null, { length: length })
            .map(function () {
                var result;
                while (true) {
                    result = String.fromCharCode(this._getRandomByte());
                    if (this._pattern.test(result)) {
                        return result;
                    }
                }
            }, this)
            .join("");
    }
};

const toB64 = (data) => Buffer.from(data, "utf8").toString("base64");
const fromB64 = (data) => Buffer.from(data, "base64").toString("utf8");

const slugify = (text) => {
    return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-");
};

const writeJson = (filePath, data, password = null) => {
    let content = JSON.stringify(data, null, 4);

    if (password !== null && typeof password === "string") {
        const encrypted = AES.encrypt(content, password);
        const utf8Encrypted = Utf8.parse(encrypted);
        content = Base64.stringify(utf8Encrypted);
    }

    fs.writeFileSync(filePath, content, {
        encoding: "utf8",
        flag: "w",
        mode: 0o664
    });
};

const readJson = (filePath, password = null) => {
    try {
        let content = fs.readFileSync(filePath, { encoding: "utf8", flag: "r" });

        if (password !== null && typeof password === "string") {
            const encryptedData = Base64.parse(content);
            const utf8EncryptedData = Utf8.stringify(encryptedData);
            const decryptedData = AES.decrypt(utf8EncryptedData, password);
            content = Utf8.stringify(decryptedData);
        }

        return JSON.parse(content);
    } catch (err) {
        console.error(err);
        return null;
    }
};

const mod97 = (string) => {
    let checksum = string.slice(0, 2),
        fragment;
    for (let offset = 2; offset < string.length; offset += 7) {
        fragment = String(checksum) + string.substring(offset, offset + 7);
        checksum = parseInt(fragment, 10) % 97;
    }
    return checksum;
};

const isValidIBANNumber = (input) => {
    const CODE_LENGTHS = {
        AD: 24,
        AE: 23,
        AT: 20,
        AZ: 28,
        BA: 20,
        BE: 16,
        BG: 22,
        BH: 22,
        BR: 29,
        CH: 21,
        CR: 21,
        CY: 28,
        CZ: 24,
        DE: 22,
        DK: 18,
        DO: 28,
        EE: 20,
        ES: 24,
        FI: 18,
        FO: 18,
        FR: 27,
        GB: 22,
        GI: 23,
        GL: 18,
        GR: 27,
        GT: 28,
        HR: 21,
        HU: 28,
        IE: 22,
        IL: 23,
        IS: 26,
        IT: 27,
        JO: 30,
        KW: 30,
        KZ: 20,
        LB: 28,
        LI: 21,
        LT: 20,
        LU: 20,
        LV: 21,
        MC: 27,
        MD: 24,
        ME: 22,
        MK: 19,
        MR: 27,
        MT: 31,
        MU: 30,
        NL: 18,
        NO: 15,
        PK: 24,
        PL: 28,
        PS: 29,
        PT: 25,
        QA: 29,
        RO: 24,
        RS: 22,
        SA: 24,
        SE: 24,
        SI: 19,
        SK: 24,
        SM: 27,
        TN: 24,
        TR: 26,
        AL: 28,
        BY: 28,
        CR: 22,
        EG: 29,
        GE: 22,
        IQ: 23,
        LC: 32,
        SC: 31,
        ST: 25,
        SV: 28,
        TL: 23,
        UA: 29,
        VA: 22,
        VG: 24,
        XK: 20
    };
    let iban = String(input)
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, ""), // keep only alphanumeric characters
        code = iban.match(/^([A-Z]{2})(\d{2})([A-Z\d]+)$/), // match and capture (1) the country code, (2) the check digits, and (3) the rest
        digits;
    // check syntax and length
    if (!code || iban.length !== CODE_LENGTHS[code[1]]) {
        return false;
    }
    // rearrange country code and check digits, and convert chars to ints
    digits = (code[3] + code[1] + code[2]).replace(/[A-Z]/g, function (letter) {
        return letter.charCodeAt(0) - 55;
    });
    // final check
    return mod97(digits);
};

const uid = () => String(Date.now().toString(32) + Math.random().toString(16)).replace(/\./g, "");

const currencyFormatter = (amount, currency = "EUR") => {
    return (amount || 0).toLocaleString(packagejson.i18n.defaultLocale, {
        style: "currency",
        currency: currency
    });
};

const getFirstDayOfMonth = (year, month) => new Date(year, month, 1);

const getFirstDayOfCurrentMonth = () => {
    const d = new Date();
    return getFirstDayOfMonth(d.getFullYear(), d.getMonth());
};

const getLastDayOfMonth = (year, month) => new Date(year, month + 1, 0);

const getLastDayOfCurrentMonth = () => {
    const d = new Date();
    return getLastDayOfMonth(d.getFullYear(), d.getMonth());
};

const toSqlDate = (date) => {
    return [
        date.getFullYear().toString(),
        ("00" + (date.getMonth() + 1).toString()).slice(-2),
        ("00" + date.getDate().toString()).slice(-2)
    ].join("-");
};

const datePatternFormatter = (locale, options, long = false) => {
    const formatter = new Intl.DateTimeFormat(locale, options).formatToParts();
    return formatter
        .map(function (e) {
            switch (e.type) {
                case "weekday":
                    return "dddd";
                    break;
                case "month":
                    return long ? "MMMM" : "MM";
                    break;
                case "day":
                    return long ? "D" : "DD";
                    break;
                case "year":
                    return "YYYY";
                    break;
                default:
                    return e.value;
            }
        })
        .join("");
};

const getDatePattern = (locale, long = false) => {
    let options = { year: "numeric", month: "2-digit", day: "2-digit" };
    if (long) options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return datePatternFormatter(locale, options, long);
};

const getLongDayDatePattern = (locale) => {
    const options = { weekday: "long", day: "numeric" };
    return datePatternFormatter(locale, options, true);
};

const getLongMonthYearPattern = (locale) => {
    const options = { year: "numeric", month: "long" };
    return datePatternFormatter(locale, options, true);
};

const intervalToDates = (interval) => {
    let dates = [null, null];
    const now = new Date();

    const subMonth = (year, month, n) => {
        let y = year;
        let m = month - n;
        while (m < 0) {
            m = 11 + m;
            y = y - 1;
        }
        return [y, m];
    };

    const addMonth = (year, month, n) => {
        let y = year;
        let m = month + n;
        while (m > 11) {
            m = m - 11;
            y = y + 1;
        }
        return [y, m];
    };

    const i = interval.slice(-1);
    const n = parseInt(interval.substring(0, interval.length - 1));
    if (i !== "" && i.length === 1 && !isNaN(n)) {
        if (i === "d") {
            let d = new Date();
            d.setDate(d.getDate() + n);
            dates[0] = d;
            dates[1] = now;
        }
        if (i === "m") {
            if (n < 0) {
                const s = subMonth(now.getFullYear(), now.getMonth(), -n);
                dates[0] = getFirstDayOfMonth(s[0], s[1] + 1);
                dates[1] = getLastDayOfMonth(now.getFullYear(), now.getMonth() - 1);
            }
            if (n > 0) {
                if (n === 1) {
                    dates[0] = getFirstDayOfMonth(now.getFullYear(), now.getMonth());
                    dates[1] = getLastDayOfMonth(now.getFullYear(), now.getMonth());
                }
                if (n === 3) {
                    const s =
                        now.getMonth() >= 0 && now.getMonth() <= 2
                            ? 0
                            : now.getMonth() >= 3 && now.getMonth() <= 5
                            ? 3
                            : now.getMonth() >= 6 && now.getMonth() <= 8
                            ? 6
                            : now.getMonth() >= 9 && now.getMonth() <= 11
                            ? 9
                            : 0;
                    const e =
                        now.getMonth() >= 0 && now.getMonth() <= 2
                            ? 2
                            : now.getMonth() >= 3 && now.getMonth() <= 5
                            ? 5
                            : now.getMonth() >= 6 && now.getMonth() <= 8
                            ? 8
                            : now.getMonth() >= 9 && now.getMonth() <= 11
                            ? 11
                            : 11;
                    dates[0] = getFirstDayOfMonth(now.getFullYear(), s);
                    dates[1] = getLastDayOfMonth(now.getFullYear(), e);
                }
                if (n === 6) {
                    const s =
                        now.getMonth() >= 0 && now.getMonth() <= 5
                            ? 0
                            : now.getMonth() >= 6 && now.getMonth() <= 11
                            ? 6
                            : 0;
                    const e =
                        now.getMonth() >= 0 && now.getMonth() <= 5
                            ? 5
                            : now.getMonth() >= 6 && now.getMonth() <= 11
                            ? 11
                            : 11;
                    dates[0] = getFirstDayOfMonth(now.getFullYear(), s);
                    dates[1] = getLastDayOfMonth(now.getFullYear(), e);
                }
                if (n === 12) {
                    dates[0] = getFirstDayOfMonth(now.getFullYear(), 0);
                    dates[1] = getLastDayOfMonth(now.getFullYear(), 11);
                }
            }
        }
        if (i === "y") {
            dates[0] = getFirstDayOfMonth(now.getFullYear() + n, 0);
            dates[1] = getLastDayOfMonth(now.getFullYear() + n, 11);
        }
    }
    return dates;
};

const downloadFile = (filename, data, isBlob = false, type = "text/plain") => {
    if (!window) return;

    const csvURL = window.URL.createObjectURL(!isBlob ? new Blob([data], { type }) : data);
    tempLink = document.createElement("a");
    tempLink.href = csvURL;
    tempLink.setAttribute("download", filename);
    tempLink.click();
};

const printData = (data, isBlob = false, type = "text/plain") => {
    if (!window) return;

    const blobURL = window.URL.createObjectURL(!isBlob ? new Blob([data], { type }) : data);
    let iframe = window.document.createElement("iframe");
    document.body.appendChild(iframe);
    iframe.style.display = "none";
    iframe.src = blobURL;
    iframe.onload = function () {
        setTimeout(function () {
            iframe.focus();
            iframe.contentWindow.print();
        }, 1);
    };
};

const utf8ToAscii = (str) => {
    const reg = /[\x7f-\uffff]/g; // charCode: [127, 65535]
    const replacer = (s) => {
        const charCode = s.charCodeAt(0);
        const unicode = charCode.toString(16).padStart(4, "0");
        return `\\u${unicode}`;
    };
    return str.replace(reg, replacer);
};

const currencyRound = (value, decimals = 2) => {
    return Number(Math.round(value + "e" + decimals) + "e-" + decimals);
};

const uploadTextFile = (extensions = ["*"], multiple = null) => {
    return new Promise((resolve, reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = extensions.join(",");
        input.multiple = multiple;

        input.onchange = (e) => {
            const file = e.target.files[0];

            const reader = new FileReader();
            reader.readAsText(file, "UTF-8");

            reader.onload = (readerEvent) => {
                const content = readerEvent.target.result;
                resolve(content);
            };

            reader.onerror = (error) => {
                reject(error);
            };
        };

        input.click();
    });
};

module.exports = {
    slugify,
    writeJson,
    readJson,
    findEnvFile,
    hashPassword,
    verifyHashedPassword,
    data2body,
    encryptedData2body,
    decryptBodyData,
    encryptData,
    decryptData,
    secureKey,
    toB64,
    fromB64,
    rgbMax,
    mod97,
    isValidIBANNumber,
    uid,
    hashCode,
    intToRGB,
    strToColor,
    currencyFormatter,
    getFirstDayOfMonth,
    getFirstDayOfCurrentMonth,
    getLastDayOfMonth,
    getLastDayOfCurrentMonth,
    getDatePattern,
    getLongDayDatePattern,
    getLongMonthYearPattern,
    intervalToDates,
    toSqlDate,
    downloadFile,
    printData,
    utf8ToAscii,
    currencyRound,
    uploadTextFile
};
