import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MantineProvider, ColorSchemeProvider } from "@mantine/core";
import { useHotkeys, useLocalStorage, useColorScheme } from "@mantine/hooks";
import { NotificationsProvider } from "@mantine/notifications";
import { NavigationProgress } from "@mantine/nprogress";
import { ModalsProvider } from "@mantine/modals";

import AppProvider from "./AppProvider";
import { MetasProvider } from "./Metas";
import Layout from "./Layout";

import Error404 from "../pages/404";
import Home from "../pages/Home";
import Register from "../pages/Register";

const App = () => {
    const currentLocation = window.location.pathname;
    const currentPath = currentLocation.substring(0, currentLocation.lastIndexOf("/")) + "/";

    const preferredColorScheme = useColorScheme();
    const [colorScheme, setColorScheme] = useLocalStorage({
        key: "mantine-color-scheme",
        defaultValue: preferredColorScheme,
        getInitialValueInEffect: true
    });

    const toggleColorScheme = (value) => setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
    useHotkeys([["mod+J", () => toggleColorScheme()]]);

    return (
        <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
            <MantineProvider
                theme={{
                    colorScheme,
                    colors: {
                        brand: [
                            "#bfe3d5",
                            "#9fd4bf",
                            "#90d6bb",
                            "#79c7a9",
                            "#63c59f",
                            "#44bd8e",
                            "#26a372",
                            "#1b8c60",
                            "#074a30",
                            "#033622"
                        ]
                    },
                    primaryShade: { light: 3, dark: 7 },
                    primaryColor: "brand",
                    globalStyles: (theme) => ({
                        "*, *::before, *::after": {
                            boxSizing: "border-box",
                            transition: "all 0.15s ease-out"
                        },

                        body: {
                            ...theme.fn.fontStyles(),
                            backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
                            color: theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,
                            lineHeight: theme.lineHeight,
                            width: "100%",
                            minHeight: "100vh",
                            margin: 0,
                            padding: 0,
                            overflowX: "hidden"
                        },

                        ".mantine-List-itemWrapper": {
                            width: "100%"
                        },

                        a: {
                            "&.breadcrumbsAnchorLink": {
                                fontFamily:
                                    "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji",
                                WebkitTapHighlightColor: "transparent",
                                color: theme.colors.brand[7],
                                fontSize: "smaller",
                                fontWeight: 500,
                                lineHeight: 1.55,
                                WebkitTextDecoration: "none",
                                textDecoration: "none",
                                backgroundColor: "transparent",
                                cursor: "pointer",
                                padding: 0,
                                border: 0,
                                lineHeight: 1,
                                whiteSpace: "nowrap",
                                WebkitTapHighlightColor: "transparent",

                                "&:hover": {
                                    textDecoration: "underline"
                                }
                            }
                        }
                    })
                }}
                withGlobalStyles
                withNormalizeCSS
            >
                <ModalsProvider labels={{ confirm: "Oui", cancel: "Non" }}>
                    <NotificationsProvider>
                        <NavigationProgress />
                        <BrowserRouter>
                            <AppProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
                                <MetasProvider>
                                    <Layout>
                                        <Routes>
                                            <Route exact path="/" element={<Home />} />
                                            <Route exact path="/register/:email" element={<Register />} />

                                            <Route exact path="/oups" element={<Error404 />} />
                                            <Route path="*" element={<Navigate to="/oups" replace />} />
                                        </Routes>
                                    </Layout>
                                </MetasProvider>
                            </AppProvider>
                        </BrowserRouter>
                    </NotificationsProvider>
                </ModalsProvider>
            </MantineProvider>
        </ColorSchemeProvider>
    );
};

export default App;
