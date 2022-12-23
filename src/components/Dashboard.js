import packagejson from "../../package.json";

import React, { cloneElement, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Text, Group, Loader, Stack, NavLink, Divider, Space, Title, Tooltip } from "@mantine/core";
import {
    IconCash,
    IconCategory2,
    IconClockPause,
    IconDeviceDesktopAnalytics,
    IconHome2,
    IconHourglassLow,
    IconSettings2,
    IconUserCheck,
} from "@tabler/icons";
import { showNotification } from "@mantine/notifications";

import { AppContext } from "./AppProvider";

import { defaultWalletCategories } from "../../defaults/walletCategories";
import Currency from "./Currency";
import CategoriesModal from "./CategoriesModal";
import PaytypesModal from "./PaytypesModal";
import ThirdpartiesModal from "./ThirdpartiesModal";
import PropertiesModal from "./PropertiesModal";

function Dashboard() {
    const app = useContext(AppContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState({ path: "Summaries", options: { id: null } });
    const [categoriesSettingsOpened, setCategoriesSettingsOpened] = useState(false);
    const [paytypesSettingsOpened, setPaytypesSettingsOpened] = useState(false);
    const [thirdpartiesSettingsOpened, setThirdpartiesSettingsOpened] = useState(false);
    const [propertiesSettingsOpened, setPropertiesSettingsOpened] = useState(false);

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
                        disabled={true}
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
                                            description={
                                                <Group position={"apart"}>
                                                    <Tooltip label={"Solde ce jour"} withArrow={true}>
                                                        <Group spacing={"xs"}>
                                                            <IconClockPause size={14} stroke={1.5} />
                                                            <Currency amount={0} currency={item.currency} />
                                                        </Group>
                                                    </Tooltip>
                                                    <Tooltip
                                                        label={"Solde prévisionnel à la fin du mois"}
                                                        withArrow={true}
                                                    >
                                                        <Group spacing={"xs"}>
                                                            <IconHourglassLow size={14} stroke={1.5} />
                                                            <Currency amount={0} currency={item.currency} />
                                                        </Group>
                                                    </Tooltip>
                                                </Group>
                                            }
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
    }, [app.wallet, page]);

    useEffect(() => {
        app.purgeWalletToolbarItems();
        app.addWalletToolbarItem(
            "Catégories",
            () => {
                setCategoriesSettingsOpened(true);
            },
            <IconCategory2 />
        );
        app.addWalletToolbarItem(
            "Moyens de paiements",
            () => {
                setPaytypesSettingsOpened(true);
            },
            <IconCash />
        );
        app.addWalletToolbarItem(
            "Tiers",
            () => {
                setThirdpartiesSettingsOpened(true);
            },
            <IconUserCheck />
        );
        app.addWalletToolbarItem(
            "Propriété du portefeuille",
            () => {
                setPropertiesSettingsOpened(true);
            },
            <IconSettings2 />
        );

        setLoading(false);
    }, []);

    return !loading ? (
        <>
            <CategoriesModal
                visible={categoriesSettingsOpened}
                onClose={() => {
                    setCategoriesSettingsOpened(false);
                }}
                categories={app.wallet.categories}
                onChange={(newCategories) => app.setCategories(newCategories)}
            />
            <PaytypesModal
                visible={paytypesSettingsOpened}
                onClose={() => {
                    setPaytypesSettingsOpened(false);
                }}
                paytypes={app.wallet.paytypes}
                onChange={(newPaytypes) => app.setPaytypes(newPaytypes)}
            />
            <ThirdpartiesModal
                visible={thirdpartiesSettingsOpened}
                onClose={() => {
                    setThirdpartiesSettingsOpened(false);
                }}
                thirdparties={app.wallet.thirdparties}
                onChange={(newThirdparties) => app.setThirdparties(newThirdparties)}
            />
            <PropertiesModal
                visible={propertiesSettingsOpened}
                onClose={() => {
                    setPropertiesSettingsOpened(false);
                }}
                properties={{ name: app.wallet.name, note: app.wallet.note, walletItems: app.wallet.walletItems }}
                onChange={(newProperties) => app.setProperties(newProperties)}
            />
            <Text>{page.path + " - " + page.options.id}</Text>
        </>
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
