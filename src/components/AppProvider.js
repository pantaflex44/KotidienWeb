import packagejson from "../../package.json";

import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { createContext } from "react";
import { Text, useMantineTheme } from "@mantine/core";
import { useIdle } from "@mantine/hooks";
import { closeAllModals, openConfirmModal } from "@mantine/modals";

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
    const [walletToolbarItems, setWalletToolbarItems] = useState([]);
    const [toolbarItems, setToolbarItems] = useState([]);

    let logoutTimout = null;

    const disconnect = (prevent = false) => {
        if (logoutTimout) clearTimeout(logoutTimout);

        const apply = () => {
            setWallet(null);
            closeAllModals();
            navigate("/");
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
                centered: true,
                overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
                overlayOpacity: 0.55,
                overlayBlur: 3,
                onConfirm: () => apply()
            });
        } else {
            apply();
        }
    };

    useEffect(() => {
        if (idle && wallet !== null) {
            if (logoutTimout) clearTimeout(logoutTimout);

            logoutTimout = setTimeout(() => {
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
                openNavabar: () => setOpened(true),
                closeNavbar: () => setOpened(false),
                toggleNavbar: () => setOpened((old) => !old),
                setNavbarState: (state) => setOpened(state),
                setNavbarContent: ({ header = null, content = null }) => setNavbar({ header, content }),
                setWallet,
                disconnect,
                connect: (newWallet) => setWallet(newWallet),
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
