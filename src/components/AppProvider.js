import packagejson from "../../package.json";

import React, { useEffect, useState, createContext } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import { Text, useMantineTheme } from "@mantine/core";
import { useIdle } from "@mantine/hooks";
import { closeAllModals, openConfirmModal } from "@mantine/modals";
import { showNotification } from "@mantine/notifications";

import { IconThumbUp, IconX } from "@tabler/icons";

import { login, saveWallet } from "../wrappers/wallet_api";
import { decryptData } from "../../tools";

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

    let logoutTimout = null;

    const save = () => {
        if (saving || !expectedSaving || !currentPassword) return;

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

    const connect = (email, password, saveIdents) =>
        new Promise((resolve, reject) => {
            login({ email, password }).then((response) => {
                const { metas, errorCode, errorMessage } = response;

                if (metas === null || errorCode !== 0) {
                    showNotification({
                        id: "login-error-notification",
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Connexion impossible à votre portefeuille!",
                        message: errorMessage,
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });

                    reject({ errorCode, errorMessage });
                } else {
                    if (saveIdents) {
                        localStorage.setItem("credentials_email", email);
                        localStorage.setItem("credentials_password", password);
                    } else {
                        localStorage.removeItem("credentials_email");
                        localStorage.removeItem("credentials_password");
                    }

                    const newWallet = decryptData(metas);

                    setExpectedSaving(false);
                    setWallet(newWallet);
                    setCurrentPassword(password);

                    resolve(newWallet);
                }
            });
        });

    const disconnect = (prevent = false) => {
        if (logoutTimout) clearTimeout(logoutTimout);

        const apply = () => {
            closeAllModals();
            setWallet(null);
            setCurrentPassword(null);
            closeAllModals();
            navigate("/");
        };

        const saveAll = () => {
            if (prevent && expectedSaving) {
                openConfirmModal({
                    title: "Votre portefeuille a été modifié",
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
                title: "Confirmer la déconnexion",
                children: (
                    <Text size="sm" mb="lg" data-autofocus>
                        Souhaitez-vous réellement vous déconnecter?
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
                message: "Mot de passe modifié avec succès.",
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

            openConfirmModal({
                title: "Toc toc! Il y a quelqu'un?",
                children: (
                    <Text size="sm" mb="lg" data-autofocus>
                        Vous semblez être inactif depuis un moment... Si toutefois vous appercevez ce message avant la
                        déconnexion automatique dans les 30 prochaines secondes, souhaitez-vous conserver votre
                        portefeuille ouvert?
                    </Text>
                ),
                labels: {
                    confirm: "Déconnecter",
                    cancel: "Annuler"
                },
                withCloseButton: false,
                closeOnEscape: false,
                closeOnClickOutside: false,
                centered: true,
                overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
                overlayOpacity: 0.55,
                overlayBlur: 3,
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
                navbarOpened: opened,
                wallet,
                expectedSaving,
                saving,
                save,
                setWallet,
                setCategories,
                setPaytypes,
                setThirdparties,
                setProperties,
                setView,
                disconnect,
                connect,
                openNavabar: () => setOpened(true),
                closeNavbar: () => setOpened(false),
                toggleNavbar: () => setOpened((old) => !old),
                setNavbarState: (state) => setOpened(state),
                setNavbarContent: ({ header = null, content = null }) => setNavbar({ header, content }),
                addWalletToolbarItem: (text, callback, icon = null, color = null) => {
                    setWalletToolbarItems((current) => [...current, { text, callback, icon, color }]);
                },
                purgeWalletToolbarItems: () => setWalletToolbarItems([]),
                walletToolbarItems,
                addToolbarItem: (text, callback, icon = null, color = null) => {
                    setToolbarItems((current) => [...current, { text, callback, icon, color }]);
                },
                purgeToolbarItems: () => setToolbarItems([]),
                toolbarItems
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export default AppProvider;
