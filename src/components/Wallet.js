import packagejson from "../../package.json";
import defaultWalletItemViewFilter from "../../defaults/walletItemViewFilter";
import defaultWalletItemViewSorter from "../../defaults/walletItemViewSorter";

import React, { useContext, useEffect, useLayoutEffect, useState } from "react";

import { ActionIcon, Divider, Group, Stack, Tabs, Tooltip } from "@mantine/core";

import {
    IconCalendar,
    IconCalendarEvent,
    IconCheck,
    IconEdit,
    IconFilter,
    IconListDetails,
    IconPlus,
    IconRefresh,
    IconTrash
} from "@tabler/icons";

import { AppContext } from "./AppProvider";
import FiltersBar from "./FiltersBar";

function Wallet({ item, filters = defaultWalletItemViewFilter, sorter = defaultWalletItemViewSorter, ...props }) {
    const app = useContext(AppContext);
    const [filtersOpened, setFiltersOpened] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([])

    const loadList = () => {
        setLoading(true);
        console.log("load list");
        setLoading(false);
    };

    useLayoutEffect(() => {
        loadList();
    }, []);

    return (
        <Tabs
            defaultValue={"details"}
            sx={(theme) => ({ display: "flex", flexDirection: "column", minHeight: "100%" })}
        >
            <Tabs.List>
                <Tabs.Tab value="details" icon={<IconListDetails size={14} />}>
                    Détails du compte
                </Tabs.Tab>
                <Tabs.Tab value="calendar" icon={<IconCalendar size={14} />}>
                    Calendrier
                </Tabs.Tab>
                <Tabs.Tab value="planner" icon={<IconCalendarEvent size={14} />}>
                    Planification
                </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="details" pt={"md"} sx={(theme) => ({ flex: "1 1 auto" })}>
                <Stack>
                    <Group position={"left"} spacing={"xs"}>
                        <Tooltip label={"Ajouter une opération"} withinPortal={true} withArrow={true}>
                            <ActionIcon
                                size="md"
                                variant={"filled"}
                                color={app.theme.colors.gray[7]}
                                disabled={loading}
                            >
                                <IconPlus size={16} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={"Modifier"} withinPortal={true} withArrow={true}>
                            <ActionIcon
                                size="md"
                                variant={"subtle"}
                                color={"dark"}
                                disabled={loading || selected.length !== 1}
                            >
                                <IconEdit size={16} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip label={"Supprimer"} withinPortal={true} withArrow={true}>
                            <ActionIcon
                                size="md"
                                variant={"subtle"}
                                color={"red"}
                                disabled={loading || selected.length < 1}
                            >
                                <IconTrash size={16} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Divider orientation={"vertical"} />
                        <Tooltip label={"Rapprocher"} withinPortal={true} withArrow={true}>
                            <ActionIcon
                                size="md"
                                variant={"subtle"}
                                color={"dark"}
                                disabled={loading || selected.length < 1}
                            >
                                <IconCheck size={16} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Divider orientation={"vertical"} />
                        <Tooltip label={"Rafraichir"} withinPortal={true} withArrow={true}>
                            <ActionIcon
                                size="md"
                                variant={"subtle"}
                                color={"dark"}
                                onClick={() => loadList()}
                                loading={loading}
                                disabled={loading}
                            >
                                <IconRefresh size={16} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                        <Tooltip
                            label={`${filtersOpened ? "Désactiver" : "Activer"} les filtres`}
                            withinPortal={true}
                            withArrow={true}
                        >
                            <ActionIcon
                                size="md"
                                variant={filtersOpened ? "filled" : "subtle"}
                                color={filtersOpened ? "yellow" : "dark"}
                                onClick={() => setFiltersOpened((old) => !old)}
                                disabled={loading}
                            >
                                <IconFilter size={16} stroke={1.5} />
                            </ActionIcon>
                        </Tooltip>
                    </Group>
                    <FiltersBar
                        walletItemId={item.id}
                        filters={filters}
                        visible={filtersOpened}
                        onChange={() => {
                            loadList();
                        }}
                        disabled={loading}
                    />
                </Stack>
            </Tabs.Panel>
            <Tabs.Panel value="calendar" pt={"md"} sx={(theme) => ({ flex: "1 1 auto" })}></Tabs.Panel>
            <Tabs.Panel value="planner" pt={"md"} sx={(theme) => ({ flex: "1 1 auto" })}></Tabs.Panel>
        </Tabs>
    );
}

export default Wallet;
