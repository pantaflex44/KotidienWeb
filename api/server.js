const fs = require("fs");
const path = require("path");
const https = require("https");
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const { findEnvFile } = require("../tools");
const { rateLimiter, requestExtender, corsLimiter } = require("./__server-tools");

console.log();

if (process.env.NODE_ENV === "development")
    console.warn("\x1b[33m%s\x1b[0m", "[API] Server start in developement mode!");

const envFile = findEnvFile("API");
require("dotenv").config({ path: envFile });
console.log("\x1b[36m%s\x1b[0m", `[API] ${envFile} found and loaded.`);

const app = express();

app.use(corsLimiter);
app.use(rateLimiter);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static("dist"));

app.use(requestExtender);
for (let route of require("./__server-routes.json")) {
    app.use(route.path, require(route.controller));
}

app.get("*", (req, res) => {
    let p = req.getPath();
    const f = p.split("/").at(-1).trim();
    const s = path.resolve(__dirname, "..", "dist", f === "" ? "index.html" : f);
    res.sendFile(s);
});

app.use(express.json());

console.warn("\x1b[33m%s\x1b[0m", "[API] Server use HTTPS protocol...");

const privateKey = fs.readFileSync(process.env.SSL_KEY, "utf8");
const certificate = fs.readFileSync(process.env.SSL_CERTIFICATE, "utf8");
const credentials = { key: privateKey, cert: certificate };

const port = process.env.PORT || 3001;

const httpsServer = https.createServer(credentials, app);
httpsServer.listen(port, () => {
    console.log("\x1b[36m%s\x1b[0m", `[API] Server started and listening on https://localhost:${port}`);
});
