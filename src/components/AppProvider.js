import packagejson from "../../package.json";

import React, { useEffect, useState, createContext, useMemo, useCallback, memo } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import { Text, useMantineTheme } from "@mantine/core";
import { useIdle } from "@mantine/hooks";
import { closeAllModals, openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";

import { IconThumbUp, IconX } from "@tabler/icons";

import { getAmountAt, login, saveWallet, deleteWallet } from "../wrappers/wallet_api";
import { decryptData, getDatePattern, getLastDayOfMonth, toSqlDate, uid } from "../../tools";

import dayjs from "dayjs";
import "dayjs/locale/fr";
import "dayjs/locale/en";
import "dayjs/locale/de";
import "dayjs/locale/es";

export const AppContext = createContext();

const AppProvider = ({ colorScheme, toggleColorScheme, children }) => {
    const getRoutePath = (location, params) => {
        const { pathname } = location;
        if (!Object.keys(params).length) {
            return pathname;
        }
        let path = pathname;
        Object.entries(params).forEach(([paramName, paramValue]) => {
            if (paramValue) {
                path = path.replace(paramValue, `:${paramName}`);
            }
        });
        return path;
    };

    const theme = useMantineTheme();
    const idle = useIdle(process.env.AUTO_LOGOUT_ALERT_DELAY, { initialState: false });
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();
    const path = getRoutePath(location, params);
    const [opened, setOpened] = useState(false);
    const [navbar, setNavbar] = useState({ header: null, content: null });
    const [wallet, setWallet] = useState(null);
    const [currentPassword, setCurrentPassword] = useState(null);
    const [walletToolbarItems, setWalletToolbarItems] = useState([]);
    const [toolbarItems, setToolbarItems] = useState([]);
    const [expectedSaving, setExpectedSaving] = useState(false);
    const [saving, setSaving] = useState(false);
    const [amounts, setAmounts] = useState({ today: {}, endMonth: {} });
    const [currentDate, setCurrentDate] = useState(
        dayjs().locale(packagejson.i18n.defaultLocale).format(getDatePattern(packagejson.i18n.defaultLocale, false))
    );

    let logoutTimout = null;

    const rgpdAgreed = () => {
        return localStorage.getItem("rgpd-agreed") === "true" ? true : false;
    };

    const save = () => {
        if (!expectedSaving || !currentPassword) return;

        setSaving(true);
        saveWallet({ ...wallet, password: currentPassword })
            .then((response) => {
                const { saved, errorCode, errorMessage } = response;

                if (!saved || errorCode !== 0) {
                    showNotification({
                        id: "save-error-notification",
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Sauvegarde de votre portefeuille",
                        message: errorMessage,
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });
                } else {
                    setExpectedSaving(false);
                }
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const deleteCurrentWallet = (password) => {
        return new Promise((resolve, reject) => {
            deleteWallet({ email: wallet.email, password })
                .then((response) => {
                    const { deleted, errorCode, errorMessage } = response;

                    if (!deleted || errorCode !== 0) {
                        showNotification({
                            id: `delete-error-notification-${uid()}`,
                            disallowClose: true,
                            autoClose: 5000,
                            title: "Suppression de votre portefeuille",
                            message: errorMessage,
                            color: "red",
                            icon: <IconX size={18} />,
                            loading: false
                        });
                        reject({ errorCode, errorMessage });
                    } else {
                        setExpectedSaving(false);
                        setWallet(null);
                        setCurrentPassword(null);

                        resolve();
                    }
                })
                .catch((err) => {
                    reject({ errorCode: 500, errorMessage: err.message });
                });
        });
    };

    const saveAsync = () =>
        new Promise((resolve, reject) => {
            if (!expectedSaving || !currentPassword) {
                resolve();
                return;
            }

            setSaving(true);
            saveWallet({ ...wallet, password: currentPassword }).then((response) => {
                const { saved, errorCode, errorMessage } = response;

                if (!saved || errorCode !== 0) {
                    showNotification({
                        id: "save-error-notification",
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Sauvegarde de votre portefeuille",
                        message: errorMessage,
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });
                    setSaving(false);
                    reject({ errorCode, errorMessage });
                } else {
                    setExpectedSaving(false);
                    resolve();
                }
            });
        });

    const refreshAmounts = useCallback(() => {
        if (!wallet?.walletItems) return;

        const now = new Date();
        const lastDayOfMonth = getLastDayOfMonth(now.getFullYear(), now.getMonth());

        wallet.walletItems.map((item) => {
            getAmountAt(wallet.email, item.id, toSqlDate(now)).then((response) => {
                const { amount, errorCode, errorMessage } = response;

                if (errorCode === 0) {
                    setAmounts((current) => ({ ...current, today: { ...current.today, [item.id]: amount } }));
                }
            });

            getAmountAt(wallet.email, item.id, toSqlDate(lastDayOfMonth)).then((response) => {
                const { amount, errorCode, errorMessage } = response;

                if (errorCode === 0) {
                    setAmounts((current) => ({ ...current, endMonth: { ...current.endMonth, [item.id]: amount } }));
                }
            });
        });
    }, [wallet?.email, wallet?.walletItems]);

    const refreshCurrentDate = () => {
        setCurrentDate(
            dayjs().locale(packagejson.i18n.defaultLocale).format(getDatePattern(packagejson.i18n.defaultLocale, false))
        );
    };

    const connect = (email, password, saveIdents) =>
        new Promise((resolve, reject) => {
            login({ email, password }).then((response) => {
                const { metas, errorCode, errorMessage } = response;

                if (metas === null || errorCode !== 0) {
                    showNotification({
                        id: "login-error-notification",
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Connexion impossible ?? votre portefeuille!",
                        message: errorMessage,
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });

                    reject({ errorCode, errorMessage });
                } else {
                    if (saveIdents && rgpdAgreed()) {
                        localStorage.setItem("credentials_email", email);
                        localStorage.setItem("credentials_password", password);
                    } else {
                        localStorage.removeItem("credentials_email");
                        localStorage.removeItem("credentials_password");
                    }

                    const newWallet = decryptData(metas);

                    setExpectedSaving(false);
                    setWallet((current) => newWallet);
                    setCurrentPassword(password);

                    resolve(newWallet);
                }
            });
        });

    const disconnect = (prevent = false) => {
        if (logoutTimout) clearTimeout(logoutTimout);

        const apply = () => {
            closeAllModals();
            setExpectedSaving(false);
            setWallet(null);
            setCurrentPassword(null);
            navigate("/");
        };

        const saveAll = () => {
            if (prevent && expectedSaving) {
                openConfirmModal({
                    title: "Votre portefeuille a ??t?? modifi??",
                    children: (
                        <Text size="sm" mb="lg" data-autofocus>
                            Souhaitez-vous enregistrer votre portefeuille?
                        </Text>
                    ),
                    withCloseButton: false,
                    closeOnEscape: false,
                    closeOnClickOutside: false,
                    centered: true,
                    overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
                    overlayOpacity: 0.55,
                    overlayBlur: 3,
                    onConfirm: () => {
                        save();
                        apply();
                    },
                    onCancel: () => {
                        apply();
                    }
                });
            } else {
                apply();
            }
        };

        if (prevent) {
            openConfirmModal({
                title: "Confirmer la d??connexion",
                children: (
                    <Text size="sm" mb="lg" data-autofocus>
                        Souhaitez-vous r??ellement vous d??connecter?
                    </Text>
                ),
                withCloseButton: false,
                closeOnEscape: false,
                closeOnClickOutside: false,
                closeOnConfirm: false,
                centered: true,
                overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
                overlayOpacity: 0.55,
                overlayBlur: 3,
                onConfirm: () => {
                    saveAll();
                }
            });
        } else {
            saveAll();
        }
    };

    const setCategories = (newCategories) => {
        if (wallet) {
            const newWallet = { ...wallet, categories: newCategories };
            setWallet(newWallet);
            setExpectedSaving(true);
        }
    };

    const setPaytypes = (newPaytypes) => {
        if (wallet) {
            const newWallet = { ...wallet, paytypes: newPaytypes };
            setWallet(newWallet);
            setExpectedSaving(true);
        }
    };

    const setThirdparties = (newThirdparties) => {
        if (wallet) {
            const newWallet = { ...wallet, thirdparties: newThirdparties };
            setWallet(newWallet);
            setExpectedSaving(true);
        }
    };

    const setProperties = (newProperties = { password: "", oldPassword: "", name: "", note: "", walletItems: [] }) => {
        if (
            typeof newProperties.oldPassword === "string" &&
            newProperties.oldPassword.trim() !== "" &&
            newProperties.oldPassword !== currentPassword
        ) {
            showNotification({
                id: "password-error-notification",
                disallowClose: true,
                autoClose: 5000,
                title: "Modification du mot de passe",
                message: "Mot de passe actuel incorrect!",
                color: "red",
                icon: <IconX size={18} />,
                loading: false
            });
        } else if (newProperties.oldPassword === currentPassword && String(newProperties.oldPassword).trim() !== "") {
            setCurrentPassword(newProperties.password);
            showNotification({
                id: "password-notification",
                disallowClose: true,
                autoClose: 5000,
                title: "Modification du mot de passe",
                message: "Mot de passe modifi?? avec succ??s.",
                color: "green",
                icon: <IconThumbUp size={18} />,
                loading: false
            });
        }

        setWallet((old) => ({
            ...old,
            name: newProperties.name,
            note: newProperties.note,
            walletItems: newProperties.walletItems
        }));
        setExpectedSaving(true);
    };

    const setSettings = (newSettings) => {
        const settings = {};

        Object.keys(newSettings).map((s) => {
            let ks = s.split("_");
            let currentLevel = settings;
            ks.map((k, idx) => {
                if (!currentLevel[k]) currentLevel[k] = idx < ks.length - 1 ? {} : newSettings[s];
                currentLevel = currentLevel[k];
            });
        });

        setWallet((old) => {
            const n = {
                ...old,
                params: { ...old.params, ...settings }
            };
            return n;
        });

        setExpectedSaving(true);
        save();
    };

    const setView = (walletItemId, newView) => {
        setWallet((old) => ({
            ...old,
            params: {
                ...old.params,
                filters: {
                    ...old.params.filters,
                    walletItemView: { ...old.params.filters.walletItemView, [walletItemId]: newView.filters }
                },
                sorters: {
                    ...old.params.sorters,
                    walletItemView: { ...old.params.filters.walletItemView, [walletItemId]: newView.sorter }
                }
            }
        }));
        setExpectedSaving(true);
    };

    useEffect(() => {
        if (idle && wallet !== null) {
            if (logoutTimout) clearTimeout(logoutTimout);

            logoutTimout = setTimeout(() => {
                closeAllModals();
                disconnect();
            }, process.env.AUTO_LOGOUT_ACTION_DELAY);

            closeAllModals();
            openConfirmModal({
                title: "Toc toc! Il y a quelqu'un?",
                children: (
                    <Text size="sm" mb="lg" data-autofocus>
                        Vous semblez ??tre inactif depuis un moment... Si toutefois vous appercevez ce message avant la
                        d??connexion automatique dans les 30 prochaines secondes, souhaitez-vous conserver votre
                        portefeuille ouvert?
                    </Text>
                ),
                labels: {
                    confirm: "D??connecter",
                    cancel: "Annuler"
                },
                withCloseButton: false,
                closeOnEscape: false,
                closeOnClickOutside: false,
                centered: true,
                overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
                overlayOpacity: 0.55,
                overlayBlur: 3,
                zIndex: 10000,
                onConfirm: () => disconnect()
            });
        }

        return () => {
            if (logoutTimout) clearTimeout(logoutTimout);
        };
    }, [idle, wallet]);

    return (
        <AppContext.Provider
            value={{
                location,
                params,
                path,
                theme,
                idle,
                colorScheme,
                toggleColorScheme,
                navbar,
                navbarOpened: useMemo(() => opened, [opened]),
                wallet: useMemo(() => wallet, [wallet]),
                expectedSaving: useMemo(() => expectedSaving, [expectedSaving]),
                saving: useMemo(() => saving, [saving]),
                save,
                deleteCurrentWallet,
                saveAsync,
                setWallet,
                setCategories,
                setPaytypes,
                setThirdparties,
                setProperties,
                setSettings,
                setView,
                disconnect,
                connect,
                rgpdAgreed,
                refreshAmounts,
                currentDate,
                refreshCurrentDate,
                amounts: useMemo(() => amounts, [amounts]),
                openNavabar: () => setOpened(true),
                closeNavbar: () => setOpened(false),
                toggleNavbar: () => setOpened((old) => !old),
                setNavbarState: (state) => setOpened(state),
                setNavbarContent: ({ header = null, content = null }) => setNavbar({ header, content }),
                addWalletToolbarItem: (text, callback, icon = null, color = null) => {
                    setWalletToolbarItems((current) => [...current, { text, callback, icon, color }]);
                },
                purgeWalletToolbarItems: () => setWalletToolbarItems([]),
                walletToolbarItems: useMemo(() => walletToolbarItems, [walletToolbarItems]),
                addToolbarItem: (text, callback, icon = null, color = null) => {
                    setToolbarItems((current) => [...current, { text, callback, icon, color }]);
                },
                purgeToolbarItems: () => setToolbarItems([]),
                toolbarItems: useMemo(() => toolbarItems, [toolbarItems])
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export default AppProvider;
