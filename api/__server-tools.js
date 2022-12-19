const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const rateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_DELAY),
    max: parseInt(process.env.RATE_LIMIT_COUNTER),
    standardHeaders: true,
    legacyHeaders: false
});

const corsLimiter = cors((req, callback) => {
    let corsOptions = {
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
        credentials: true,
        optionsSuccessStatus: 200
    };

    if (
        [
            "https://localhost:1234",
            "https://localhost:3000",
            "https://localhost:3001",
            "https://localhost:8080",
            "http://localhost:8080",
            "https://localhost:8080"
        ].indexOf(req.header("Origin")) !== -1
    ) {
        corsOptions = { origin: true };
    } else {
        corsOptions = { origin: false };
    }

    callback(null, corsOptions);
});

const requestExtender = (req, res, next) => {
    req.getUrl = function () {
        return req.protocol + "://" + req.get("host") + req.path;
    };

    req.getPath = function () {
        return req.path;
    };

    return next();
};

module.exports = { rateLimiter, corsLimiter, requestExtender };
