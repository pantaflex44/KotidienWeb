import packagejson from "../../package.json";

import defaultWalletItemViewFilter from "../../defaults/walletItemViewFilter";
import defaultWalletItemViewSorter from "../../defaults/walletItemViewSorter";
import defaultIntervals, { filter } from "../../defaults/intervals";
import defaultStates from "../../defaults/states";
import defaultTypes from "../../defaults/types";

import React, { cloneElement, useContext, useEffect, useLayoutEffect, useState } from "react";

import { ActionIcon, Collapse, Group, MultiSelect, Select, Stack, Tooltip } from "@mantine/core";
import { DateRangePicker } from "@mantine/dates";

import {
    IconCalendar,
    IconCalendarMinus,
    IconCategory,
    IconFilterOff,
    IconReceipt2,
    IconSquare,
    IconSquareCheck,
    IconUsers
} from "@tabler/icons";

import { AppContext } from "./AppProvider";

import { getDatePattern, getFirstDayOfCurrentMonth, getLastDayOfCurrentMonth, intervalToDates } from "../../tools";

function FiltersBar({
    walletItemId,
    filters = defaultWalletItemViewFilter,
    sorter = defaultWalletItemViewSorter,
    visible = false,
    disabled = false,
    onChange = null
}) {
    const app = useContext(AppContext);
    const [view, setView] = useState({
        filters: {
            ...filters,
            startDate: typeof filter.startDate === "string" ? new Date(filters.startDate) : filter.startDate,
            endDate: typeof filter.endDate === "string" ? new Date(filters.endDate) : filter.endDate
        },
        sorter: { ...sorter }
    });
    const [filtersOpened, setFiltersOpened] = useState(visible);
    const [disableState, setDisableState] = useState(disabled);

    function getCategories(parentId = null, parentLbl = "", level = 0) {
        let categories = [];
        app.wallet.categories
            .filter((c) => c.parentId === parentId)
            .map((c) => {
                const lbl = (parentLbl !== "" ? `${parentLbl} - ` : "") + c.name;
                categories = [
                    ...categories,
                    {
                        value: c.id,
                        label: lbl
                    },
                    ...getCategories(c.id, lbl, level + 1)
                ];
            });
        return categories;
    }

    function getThirdparties() {
        let thirdparties = [];
        app.wallet.thirdparties.map((t) => {
            thirdparties = [...thirdparties, { value: t.id, label: t.name }];
        });
        return thirdparties;
    }

    useLayoutEffect(() => {
        setView({
            filters: {
                ...filters,
                startDate:
                    (typeof filter.startDate === "string" ? new Date(filters.startDate) : filter.startDate) ||
                    getFirstDayOfCurrentMonth(),
                endDate:
                    (typeof filter.endDate === "string" ? new Date(filters.endDate) : filter.endDate) ||
                    getLastDayOfCurrentMonth()
            },
            sorter: { ...sorter }
        });
    }, [filters, sorter]);

    useEffect(() => {
        setFiltersOpened(visible);
    }, [visible]);

    useEffect(() => {
        setDisableState(disabled);
    }, [disabled]);

    const updateFilters = (newFilters = {}) => {
        setView((current) => {
            const newView = {
                ...current,
                filters: {
                    ...current.filters,
                    ...newFilters
                }
            };
            app.setView(walletItemId, newView);
            if (onChange) onChange(newView);
            return newView;
        });
    };

    const resetFilters = () => {
        const [startDate, endDate] = intervalToDates(defaultWalletItemViewFilter.interval);
        updateFilters({
            ...defaultWalletItemViewFilter,
            startDate: startDate,
            endDate: endDate
        });
    };

    return (
        <Collapse in={filtersOpened}>
            <Stack spacing={"xs"}>
                <Group position={"left"} spacing={"xs"} align={"start"}>
                    <Tooltip label={"Filtres par défaut"} withinPortal={true} withArrow={true}>
                        <ActionIcon variant={"default"} onClick={() => resetFilters()} disabled={disableState}>
                            <IconFilterOff size={16} />
                        </ActionIcon>
                    </Tooltip>
                    <Select
                        size={"xs"}
                        placeholder={"Interval de temps"}
                        data={defaultIntervals}
                        icon={<IconCalendarMinus size={16} />}
                        value={view.filters.interval}
                        onChange={(v) => {
                            const [startDate, endDate] =
                                v !== ""
                                    ? intervalToDates(v)
                                    : [
                                          view.filters.startDate || getFirstDayOfCurrentMonth(),
                                          view.filters.endDate || getLastDayOfCurrentMonth()
                                      ];
                            updateFilters({
                                interval: v,
                                startDate: startDate,
                                endDate: endDate
                            });
                        }}
                        disabled={disableState}
                    />
                    <DateRangePicker
                        clearable={false}
                        size={"xs"}
                        locale={packagejson.i18n.defaultLocale}
                        value={[
                            view.filters.startDate ||
                                intervalToDates(view.filters.interval)[0] ||
                                getFirstDayOfCurrentMonth(),
                            view.filters.endDate ||
                                intervalToDates(view.filters.interval)[1] ||
                                getLastDayOfCurrentMonth()
                        ]}
                        onChange={(v) => {
                            if (view.filters.interval === "") updateFilters({ startDate: v[0], endDate: v[1] });
                        }}
                        inputFormat={getDatePattern(packagejson.i18n.defaultLocale)}
                        disabled={view.filters.interval !== "" || disableState}
                        icon={<IconCalendar size={16} />}
                    />
                    <MultiSelect
                        size={"xs"}
                        placeholder={"Tous les types d'opérations"}
                        data={defaultTypes}
                        icon={<IconReceipt2 size={16} />}
                        value={view.filters.types}
                        clearable={true}
                        onChange={(v) => {
                            updateFilters({ types: v });
                        }}
                        disabled={disableState}
                    />
                    <Select
                        size={"xs"}
                        placeholder={"Etat des opérations"}
                        data={defaultStates}
                        icon={
                            view.filters.states === "all"
                                ? null
                                : cloneElement(
                                      view.filters.states === "closed" ? <IconSquareCheck /> : <IconSquare />,
                                      {
                                          size: 16
                                      }
                                  )
                        }
                        value={view.filters.states}
                        onChange={(v) => {
                            updateFilters({ states: v });
                        }}
                        disabled={disableState}
                    />
                </Group>
                <Group position={"left"} spacing={"xs"} align={"start"}>
                    <MultiSelect
                        size={"xs"}
                        placeholder={"Catégories"}
                        data={getCategories()}
                        icon={<IconCategory size={16} />}
                        value={view.filters.categories}
                        clearable={true}
                        searchable={true}
                        nothingFound={"inconnue au bataillon!"}
                        onChange={(v) => {
                            updateFilters({ categories: v });
                        }}
                        sx={(theme) => ({ minWidth: "250px", width: "100%", maxWidth: "490px" })}
                        disabled={disableState}
                    />
                    <MultiSelect
                        size={"xs"}
                        placeholder={"Tiers"}
                        data={getThirdparties()}
                        icon={<IconUsers size={16} />}
                        value={view.filters.thirdparties}
                        clearable={true}
                        searchable={true}
                        nothingFound={"inconnu au bataillon!"}
                        onChange={(v) => {
                            updateFilters({ thirdparties: v });
                        }}
                        sx={(theme) => ({ minWidth: "250px", width: "100%", maxWidth: "490px" })}
                        disabled={disableState}
                    />
                </Group>
            </Stack>
        </Collapse>
    );
}

export default FiltersBar;
