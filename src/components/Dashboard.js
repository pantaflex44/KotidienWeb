import packagejson from "../../package.json";

import React, { cloneElement, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Text, Group, Loader, Stack, NavLink, Divider, Space } from "@mantine/core";
import {
    IconCash,
    IconCategory,
    IconCategory2,
    IconDeviceDesktopAnalytics,
    IconHome2,
    IconSettings2,
    IconUserCheck,
    IconX
} from "@tabler/icons";
import { showNotification } from "@mantine/notifications";

import { AppContext } from "./AppProvider";

import { defaultWalletCategories } from "../../defaults/walletCategories";

function Dashboard() {
    const app = useContext(AppContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState({ path: "Summaries", options: { id: null } });

    useEffect(() => {
        app.setNavbarContent({
            header: (
                <Stack spacing={0}>
                    <Text fw={500} size={"md"}>
                        Votre portefeuille
                    </Text>
                    <Text size={"xs"}>
                        {app.wallet.note || "Détails et gestion des éléments financiers de votre portefeuille."}
                    </Text>
                </Stack>
            ),
            content: (
                <Stack spacing={0} mt={"xl"} mb={"md"}>
                    <NavLink
                        label="Résumés"
                        icon={<IconHome2 size={16} stroke={1.5} />}
                        active={page.path === "Summaries"}
                        fw={page.path === "Summaries" ? 500 : 400}
                        variant={page.path === "Summaries" ? "filled" : "subtle"}
                        onClick={() =>
                            setPage((current) => ({
                                ...current,
                                path: "Summaries",
                                options: { id: null }
                            }))
                        }
                    />
                    <NavLink
                        label="Rapports et statistiques"
                        icon={<IconDeviceDesktopAnalytics size={16} stroke={1.5} />}
                        active={page.path === "Stats"}
                        fw={page.path === "Stats" ? 500 : 400}
                        variant={page.path === "Stats" ? "filled" : "subtle"}
                        onClick={() =>
                            setPage((current) => ({
                                ...current,
                                path: "Stats",
                                options: { id: null }
                            }))
                        }
                    />
                    <Space h={"xs"} />
                    <Divider />
                    <Space h={"xs"} />
                    {defaultWalletCategories.map((category) => {
                        const childs = app.wallet.walletItems.filter((w) => w.categoryId === category.id);

                        return (
                            <NavLink
                                key={category.id}
                                label={`${category.text} (${childs.length})`}
                                icon={cloneElement(category.icon, { size: 16, stroke: 1.5 })}
                                variant={"subtle"}
                                childrenOffset={28}
                                defaultOpened={childs.length > 0}
                                disabled={childs.length === 0}
                            >
                                {childs.length > 0 &&
                                    childs.map((item) => (
                                        <NavLink
                                            key={item.id}
                                            label={item.name}
                                            active={page.options.id === item.id}
                                            fw={500}
                                            variant={page.options.id === item.id ? "filled" : "subtle"}
                                            onClick={() =>
                                                setPage((current) => ({
                                                    ...current,
                                                    path: "Wallet",
                                                    options: { id: item.id }
                                                }))
                                            }
                                        />
                                    ))}
                            </NavLink>
                        );
                    })}
                </Stack>
            )
        });
    }, [page]);

    useEffect(() => {
        app.purgeWalletToolbarItems();
        app.addWalletToolbarItem("Catégories", () => {}, <IconCategory2 />);
        app.addWalletToolbarItem("Moyens de paiements", () => {}, <IconCash />);
        app.addWalletToolbarItem("Tiers", () => {}, <IconUserCheck />);
        app.addWalletToolbarItem("Propriété du portefeuille", () => {}, <IconSettings2 />);

        setLoading(false);
    }, []);

    return !loading ? (
        <Text>{page.path + " - " + page.options.id}</Text>
    ) : (
        <Group position={"center"} spacing={"xs"}>
            <Loader size={"xs"} variant={"bars"} />
            <Text size={"xs"} fw={500}>
                Chargement en cours, veuillez patienter SVP...
            </Text>
        </Group>
    );
}

export default Dashboard;
