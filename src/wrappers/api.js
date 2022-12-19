import React from "react";
import { hashPassword } from "../../tools";
import { showNotification } from "@mantine/notifications";
import { IconX } from "@tabler/icons";
import { completeNavigationProgress, resetNavigationProgress, startNavigationProgress } from "@mantine/nprogress";

export default (url, method = "GET") => {
    const request = (options = {}) =>
        new Promise(async (resolve, reject) => {
            resetNavigationProgress();
            startNavigationProgress();

            try {
                options = { ...options, method: method.trim().toUpperCase(), cache: "default" };
                if (process.env.NODE_ENV === "production") options = { ...options, mode: "cors" };

                options.headers = {
                    ...(options.headers || {}),
                    apiKey: hashPassword(process.env.API_KEY),
                    Accept: "application/json"
                };

                const res = await fetch(`${process.env.API_BASEURL}${url}`, options);
                if (res.status < 200 || res.status > 299) throw new Error(`[HTTP_${res.status}] ${res.statusText}`);

                const json = await res.json();
                resolve({ result: res, data: json });
            } catch (err) {
                console.error(err)
                const m = err.message || err || "";
                if (m.includes("ERR_CERT_COMMON_NAME_INVALID")) {
                    console.error("api.js (fetch - ligne 18) CERT ERROR: ", m);
                }

                showNotification({
                    id: "register-error-notification",
                    disallowClose: true,
                    autoClose: 5000,
                    title: "Une erreur interne s'est produite",
                    message: "Impossible de communiquer avec nos serveurs! Veuillez recommencer ultérieurement.",
                    color: "red",
                    icon: <IconX size={18} />,
                    loading: false
                });

                reject(err);
            } finally {
                completeNavigationProgress();
            }
        });

    return { request };
};
