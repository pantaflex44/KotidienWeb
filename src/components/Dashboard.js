import packagejson from "../../package.json";
import { defaultWalletCategories } from "../../defaults/walletCategories";
import defaultWalletItemViewFilter from "../../defaults/walletItemViewFilter";
import defaultWalletItemViewSorter from "../../defaults/walletItemViewSorter";

import React, { cloneElement, lazy, memo, Suspense, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Text, Group, Loader, Stack, NavLink, Divider, Space, Title, Tooltip } from "@mantine/core";
import { useListState } from "@mantine/hooks";
import {
    IconAlertTriangle,
    IconCash,
    IconCategory2,
    IconClockPause,
    IconDeviceDesktopAnalytics,
    IconHome2,
    IconHourglassLow,
    IconSettings2,
    IconUserCheck
} from "@tabler/icons";
import { showNotification } from "@mantine/notifications";

import { AppContext } from "./AppProvider";

import DynamicLoader from "./DynamicLoader";
import Currency from "./Currency";
import CategoriesModal from "./CategoriesModal";
import PaytypesModal from "./PaytypesModal";
import ThirdpartiesModal from "./ThirdpartiesModal";
import PropertiesModal from "./PropertiesModal";

import dayjs from "dayjs";

function Dashboard() {
    const app = useContext(AppContext);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState({ path: "Summaries", props: {} });
    const [categoriesSettingsOpened, setCategoriesSettingsOpened] = useState(false);
    const [paytypesSettingsOpened, setPaytypesSettingsOpened] = useState(false);
    const [thirdpartiesSettingsOpened, setThirdpartiesSettingsOpened] = useState(false);
    const [propertiesSettingsOpened, setPropertiesSettingsOpened] = useState(false);
    const [currentDate, setCurrentDate] = useState(dayjs());

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
                                props: {}
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
                                props: {}
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
                                                            {item.initialAmount + (app.amounts.today[item.id] || 0.0) <
                                                            -item.overdraft ? (
                                                                <IconAlertTriangle
                                                                    size={14}
                                                                    stroke={1.5}
                                                                    color={"red"}
                                                                />
                                                            ) : (
                                                                <IconClockPause size={14} stroke={1.5} />
                                                            )}
                                                            <Currency
                                                                amount={
                                                                    item.initialAmount +
                                                                    (app.amounts.today[item.id] || 0.0)
                                                                }
                                                                currency={item.currency}
                                                            />
                                                        </Group>
                                                    </Tooltip>
                                                    <Tooltip
                                                        label={"Solde prévisionnel à la fin du mois"}
                                                        withArrow={true}
                                                    >
                                                        <Group spacing={"xs"}>
                                                            {item.initialAmount +
                                                                (app.amounts.endMonth[item.id] || 0.0) <
                                                            -item.overdraft ? (
                                                                <IconAlertTriangle
                                                                    size={14}
                                                                    stroke={1.5}
                                                                    color={"red"}
                                                                />
                                                            ) : (
                                                                <IconHourglassLow size={14} stroke={1.5} />
                                                            )}
                                                            <Currency
                                                                amount={
                                                                    item.initialAmount +
                                                                    (app.amounts.endMonth[item.id] || 0.0)
                                                                }
                                                                currency={item.currency}
                                                            />
                                                        </Group>
                                                    </Tooltip>
                                                </Group>
                                            }
                                            active={page.props?.walletItem?.id === item.id}
                                            fw={500}
                                            variant={page.props?.walletItem?.id === item.id ? "filled" : "subtle"}
                                            onClick={() =>
                                                setPage((current) => ({
                                                    ...current,
                                                    path: "Wallet",
                                                    props: {
                                                        walletItem: item,
                                                        walletFilters:
                                                            app.wallet.params?.filters?.walletItemView[item.id] ||
                                                            defaultWalletItemViewFilter,
                                                        walletSorter:
                                                            app.wallet.params?.sorters?.walletItemView[item.id] ||
                                                            defaultWalletItemViewSorter
                                                    }
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
    }, [app.wallet.note, app.wallet.walletItems, app.wallet.params, app.amounts, page]);

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

        const timeInterval = setInterval(() => {
            setCurrentDate((old) => {
                const cur = dayjs();
                if (!old || cur.format("YYYY-MM-DD") !== old.format("YYYY-MM-DD")) {
                    app.refreshCurrentDate();
                    app.refreshAmounts();
                    return cur;
                }
                return old;
            });
        }, 1000);
        app.refreshCurrentDate();
        app.refreshAmounts();

        setLoading(false);

        return () => {
            if (timeInterval) clearInterval(timeInterval);
        };
    }, []);

    const memoizedCategories = useMemo(() => app.wallet.categories, [app.wallet.categories]);
    const memoizedPaytypes = useMemo(() => app.wallet.paytypes, [app.wallet.paytypes]);
    const memoizedThirdparties = useMemo(() => app.wallet.thirdparties, [app.wallet.thirdparties]);
    const memoizedProperties = useMemo(
        () => ({
            name: app.wallet.name,
            note: app.wallet.note,
            walletItems: app.wallet.walletItems
        }),
        [app.wallet.name, app.wallet.note, app.wallet.walletItems]
    );

    useEffect(() => {
        if (app.idle) {
            setCategoriesSettingsOpened(false);
            setPaytypesSettingsOpened(false);
            setPropertiesSettingsOpened(false);
            setThirdpartiesSettingsOpened(false);
        }
    }, [app.idle]);

    return !loading ? (
        <>
            <CategoriesModal
                visible={categoriesSettingsOpened}
                onClose={() => {
                    if (categoriesSettingsOpened && app.expectedSaving) app.save();
                    setCategoriesSettingsOpened(false);
                }}
                categories={memoizedCategories}
                onChange={(newCategories) => app.setCategories(newCategories)}
            />
            <PaytypesModal
                visible={paytypesSettingsOpened}
                onClose={() => {
                    if (paytypesSettingsOpened && app.expectedSaving) app.save();
                    setPaytypesSettingsOpened(false);
                }}
                paytypes={memoizedPaytypes}
                onChange={(newPaytypes) => app.setPaytypes(newPaytypes)}
            />
            <ThirdpartiesModal
                visible={thirdpartiesSettingsOpened}
                onClose={() => {
                    if (thirdpartiesSettingsOpened && app.expectedSaving) app.save();
                    setThirdpartiesSettingsOpened(false);
                }}
                thirdparties={memoizedThirdparties}
                onChange={(newThirdparties) => app.setThirdparties(newThirdparties)}
            />
            <PropertiesModal
                visible={propertiesSettingsOpened}
                onClose={() => {
                    if (propertiesSettingsOpened && app.expectedSaving) app.save();
                    setPropertiesSettingsOpened(false);
                }}
                properties={memoizedProperties}
                onChange={(newProperties) => app.setProperties(newProperties)}
            />
            <Suspense
                fallback={
                    <Group position={"center"} spacing={"xs"}>
                        <Loader size={"xs"} variant={"bars"} />
                        <Text size={"xs"} fw={500}>
                            Chargement en cours, veuillez patienter SVP...
                        </Text>
                    </Group>
                }
            >
                <DynamicLoader component={page.path} {...page.props} />
            </Suspense>
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

export default memo(Dashboard);
