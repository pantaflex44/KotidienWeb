import { getAmountAt } from "../wrappers/wallet_api";
import { useHotkeys } from "@mantine/hooks";

import React, { memo, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Group, LoadingOverlay, Stack, Text } from "@mantine/core";

import { IconChevronDown, IconChevronUp } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import OpeListItems from "./OpeListItems";

function OpeList({
    walletItem,
    items = [],
    selected = [],
    loading = false,
    onSelect = null,
    onUnselect = null,
    onUnselectAll = null,
    onKeyDown = null,
    showAmountsDetails = true,
    showTotalAmounts = true,
    onDateAppear = null
}) {
    const app = useContext(AppContext);
    const [sortedItems, setSortedItems] = useState({});
    const [totalAmounts, setTotalAmounts] = useState({});
    const [collapsible, setCollapsible] = useState({});

    const setInitialCollapseState = (date) => {
        const defaultState =
            app.wallet.params?.views?.extendOperations !== null &&
            app.wallet.params?.views?.extendOperations !== undefined
                ? app.wallet.params.views.extendOperations === true
                : true;

        setCollapsible((current) => {
            const state =
                current[walletItem.id] === null || current[walletItem.id] === undefined
                    ? defaultState
                    : current[walletItem.id][date] === null || current[walletItem.id][date] === undefined
                    ? defaultState
                    : current[walletItem.id][date] === true;

            const newList = {
                ...current,
                [walletItem.id]: {
                    ...(current[walletItem.id] === null || current[walletItem.id] === undefined
                        ? {}
                        : current[walletItem.id]),
                    [date]: state
                }
            };

            return newList;
        });
    };

    const sortItems = useCallback(
        (items) => {
            const si = items
                .sort(
                    (a, b) =>
                        new Date(Date.parse(b.date.replace(/-/g, "/"))) -
                        new Date(Date.parse(a.date.replace(/-/g, "/")))
                )
                .reduce((r, a) => {
                    r[a.date] = r[a.date] || [];
                    r[a.date].push(a);
                    r[a.date] = r[a.date].sort((a, b) => (a.id < b.id ? 1 : -1));

                    setInitialCollapseState(a.date);

                    return r;
                }, Object.create(null));

            setSortedItems(si);

            Object.keys(si).map((k) => {
                getAmountAt(app.wallet.email, walletItem.id, k).then((response) => {
                    const { amount, errorCode, errorMessage } = response;

                    if (errorCode === 0) {
                        setTotalAmounts((current) => ({ ...current, [k]: walletItem.initialAmount + amount }));
                    }
                });
            });
        },
        [items, app.wallet.params?.views?.extendOperations]
    );

    useEffect(() => {
        sortItems(items);
    }, [items, app.wallet.params?.views?.extendOperations]);

    const collapseAll = () => {
        setCollapsible((current) => ({
            ...current,
            [walletItem.id]: {
                all: false
            }
        }));
    };

    const expandAll = () => {
        setCollapsible((current) => ({
            ...current,
            [walletItem.id]: {
                all: true
            }
        }));
    };

    const selectFirstItem = () => {
        if (!loading && Object.keys(sortedItems).length > 0 && onSelect) {
            const firstItem = sortedItems[Object.keys(sortedItems)[0]][0];
            onSelect(firstItem.id);
        }
    };

    const selectLastItem = () => {
        if (!loading && Object.keys(sortedItems).length > 0 && onSelect) {
            const keys = Object.keys(sortedItems);
            const lastKey = keys[keys.length - 1];
            const itms = sortedItems[lastKey];
            const lastItem = itms[itms.length - 1];
            onSelect(lastItem.id);
        }
    };

    const flattenSortedItems = useMemo(() => {
        const list = [];
        Object.keys(sortedItems).map((k) => {
            sortedItems[k].map((i) => {
                list.push(i);
            });
        });
        return list;
    }, [sortedItems]);

    const selectNextItem = useCallback(() => {
        const flattedItems = [...flattenSortedItems];

        if (!loading && flattedItems.length > 0 && onSelect) {
            const index = flattedItems.findIndex((o) => o.id === selected[0]);
            if (index < flattedItems.length - 1) onSelect(flattedItems[index + 1].id);
        }
    }, [flattenSortedItems, selected, loading]);

    const selectPrevItem = useCallback(() => {
        const flattedItems = [...flattenSortedItems];

        if (!loading && flattedItems.length > 0 && onSelect) {
            const index = flattedItems.findIndex((o) => o.id === selected[0]);
            if (index > 0) onSelect(flattedItems[index - 1].id);
        }
    }, [flattenSortedItems, selected, loading]);

    const selectAll = useCallback(() => {
        const flattedItems = [...flattenSortedItems];

        if (!loading && flattedItems.length > 0 && onSelect) {
            onSelect(flattedItems.map((o) => o.id));
        }
    }, [flattenSortedItems, loading]);

    const unselectAll = useCallback(() => {
        if (!loading && onUnselectAll) onUnselectAll();
    }, [loading]);

    useHotkeys([
        [
            "mod+alt+ArrowDown",
            () => {
                expandAll();
            }
        ],
        [
            "mod+alt+ArrowUp",
            () => {
                collapseAll();
            }
        ],
        [
            "ArrowDown",
            () => {
                if (selected.length === 0) {
                    selectLastItem();
                } else {
                    selectNextItem();
                }
            }
        ],
        [
            "ArrowUp",
            () => {
                if (selected.length === 0) {
                    selectFirstItem();
                } else {
                    selectPrevItem();
                }
            }
        ],
        ,
        ["ArrowLeft", () => selectFirstItem()],
        ["ArrowRight", () => selectLastItem()],
        ["mod+alt+A", () => selectAll()],
        ["Escape", () => unselectAll()]
    ]);

    const memoizedItems = useMemo(
        () =>
            Object.keys(sortedItems).map((k) => (
                <OpeListItems
                    key={k}
                    walletItem={walletItem}
                    items={sortedItems[k]}
                    date={k}
                    selected={selected}
                    onSelect={onSelect}
                    onUnselect={onUnselect}
                    onKeyDown={onKeyDown}
                    totalAmounts={totalAmounts}
                    showAmountsDetails={showAmountsDetails}
                    showTotalAmounts={showTotalAmounts}
                    collapsible={collapsible}
                    setCollapsible={setCollapsible}
                    onDateAppear={onDateAppear}
                />
            )),
        [sortedItems, selected, totalAmounts, collapsible, showAmountsDetails, showTotalAmounts]
    );

    return (
        <>
            <LoadingOverlay
                visible={loading}
                overlayBlur={0}
                overlayOpacity={0}
                transitionDuration={250}
                loaderProps={{ size: "sm", variant: "bars" }}
            />

            {items.length > 0 && (
                <>
                    <Group spacing={"xs"} position={"center"}>
                        <Group spacing={4} style={{ cursor: "pointer" }} onClick={() => expandAll()}>
                            <IconChevronDown size={16} />
                            <Text variant={"link"} size={"xs"}>
                                Tout développer
                            </Text>
                        </Group>
                        <Group spacing={4} style={{ cursor: "pointer" }} onClick={() => collapseAll()}>
                            <IconChevronUp size={16} />
                            <Text variant={"link"} size={"xs"}>
                                Tout refermer
                            </Text>
                        </Group>
                    </Group>

                    <Stack spacing={"md"}>{memoizedItems}</Stack>
                </>
            )}
        </>
    );
}

export default memo(
    OpeList,
    (p, n) =>
        JSON.stringify(p.items) === JSON.stringify(n.items) &&
        JSON.stringify(p.selected) === JSON.stringify(n.selected) &&
        p.loading === n.loading
);
