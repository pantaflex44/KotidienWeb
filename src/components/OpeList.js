import packagejson from "../../package.json";

import React, { useCallback, useContext, useEffect, useLayoutEffect, useState } from "react";

import {
    Box,
    Collapse,
    Divider,
    Group,
    LoadingOverlay,
    MediaQuery,
    Stack,
    Text,
    Timeline,
    Tooltip
} from "@mantine/core";

import {
    IconArrowDown,
    IconArrowMoveRight,
    IconArrowUp,
    IconArrowsMoveHorizontal,
    IconChevronDown,
    IconChevronUp,
    IconReceipt,
    IconSquare,
    IconSquareCheck
} from "@tabler/icons";

import { AppContext } from "./AppProvider";
import Currency from "./Currency";

import { getDatePattern, strToColor } from "../../tools";
import dayjs from "dayjs";
import { getAmountAt } from "../wrappers/wallet_api";
import { useHotkeys } from "@mantine/hooks";

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
    showTotalAmounts = true
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
            const items = sortedItems[lastKey];
            const lastItem = items[items.length - 1];
            onSelect(lastItem.id);
        }
    };

    const flattenSortedItems = () => {
        const list = [];
        Object.keys(sortedItems).map((k) => {
            sortedItems[k].map((i) => {
                list.push(i);
            });
        });
        return list;
    };

    const selectNextItem = () => {
        if (!loading && Object.keys(sortedItems).length > 0 && onSelect) {
            const flattedItems = flattenSortedItems();
            const index = flattedItems.findIndex((o) => o.id === selected[0]);
            if (index < flattedItems.length - 1) onSelect(flattedItems[index + 1].id);
        }
    };

    const selectPrevItem = () => {
        if (!loading && Object.keys(sortedItems).length > 0 && onSelect) {
            const flattedItems = flattenSortedItems();
            const index = flattedItems.findIndex((o) => o.id === selected[0]);
            if (index > 0) onSelect(flattedItems[index - 1].id);
        }
    };

    const selectAll = () => {
        if (!loading && Object.keys(sortedItems).length > 0 && onSelect) {
            const flattedItems = flattenSortedItems();
            onSelect(flattedItems.map((o) => o.id));
        }
    };

    const unselectAll = () => {
        if (!loading && onUnselectAll) onUnselectAll();
    };

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

                    <Timeline
                        mt={"md"}
                        pb={"xl"}
                        active={0}
                        lineWidth={2}
                        bulletSize={20}
                        style={{ overflowX: "auto" }}
                        styles={(theme) => ({
                            itemTitle: {
                                color: theme.colorScheme === "dark" ? theme.colors.gray[6] : theme.colors.gray[6],
                                fontSize: "smaller",
                                marginBottom: "0.3rem"
                            }
                        })}
                        data-autofocus
                    >
                        {Object.keys(sortedItems).map((k) => {
                            const win = sortedItems[k]
                                .map((i) => (i.amount < 0 ? i.amount : 0))
                                .reduce((a, b) => a + b, 0);
                            const lose = sortedItems[k]
                                .map((i) => (i.amount >= 0 ? i.amount : 0))
                                .reduce((a, b) => a + b, 0);
                            const total = sortedItems[k].map((i) => i.amount).reduce((a, b) => a + b, 0);

                            const someChildAreSelected = sortedItems[k]
                                .map((s) => s.id)
                                .some((x) => selected.includes(x));
                            const unselectChilds = () => {
                                if (onUnselect) {
                                    const newUnselectedItems = selected.filter((id) =>
                                        sortedItems[k].map((s) => s.id).includes(id)
                                    );
                                    onUnselect(newUnselectedItems);
                                }
                            };

                            const longDate = dayjs(k)
                                .locale(packagejson.i18n.defaultLocale)
                                .format(getDatePattern(packagejson.i18n.defaultLocale, true));

                            const isExpanded =
                                collapsible[walletItem.id] &&
                                (collapsible[walletItem.id][k] === true || collapsible[walletItem.id]["all"] === true);
                            const toggleCollapse = () => {
                                if (someChildAreSelected) unselectChilds();

                                setCollapsible((current) => ({
                                    ...current,
                                    [walletItem.id]: {
                                        ...(current[walletItem.id] || {}),
                                        all: false,
                                        [k]: current[walletItem.id] ? !current[walletItem.id][k] : false
                                    }
                                }));
                            };

                            const operationCounter = sortedItems[k].length;

                            return (
                                <Timeline.Item
                                    key={k}
                                    title={longDate}
                                    bullet={
                                        total === 0 ? (
                                            <IconArrowsMoveHorizontal size={12} stroke={2} />
                                        ) : total > 0 ? (
                                            <IconArrowUp size={12} stroke={2} />
                                        ) : (
                                            <IconArrowDown size={12} stroke={2} />
                                        )
                                    }
                                    style={{ minWidth: "100%" }}
                                    onKeyDown={onKeyDown}
                                >
                                    <Group
                                        spacing={"xl"}
                                        style={{ cursor: "pointer", flexWrap: "nowrap" }}
                                        onClick={() => toggleCollapse()}
                                    >
                                        <Group spacing={4} style={{ flexWrap: "nowrap" }}>
                                            {isExpanded || someChildAreSelected ? (
                                                <IconChevronUp size={16} />
                                            ) : (
                                                <IconChevronDown size={16} />
                                            )}
                                            <Text size={"xs"} truncate={true}>
                                                {operationCounter} opération
                                                {operationCounter > 1 ? "s" : ""}
                                            </Text>
                                        </Group>

                                        {showAmountsDetails && (
                                            <>
                                                {showTotalAmounts && (
                                                    <Group spacing={"xs"} style={{ flexWrap: "nowrap" }}>
                                                        {totalAmounts[k] ? (
                                                            <Currency
                                                                amount={totalAmounts[k]}
                                                                currency={walletItem.currency}
                                                                size={"xs"}
                                                                fw={700}
                                                                color={"brand.5"}
                                                            />
                                                        ) : (
                                                            <Text size={"xs"}>-</Text>
                                                        )}
                                                    </Group>
                                                )}

                                                <MediaQuery smallerThan={"sm"} styles={{ display: "none" }}>
                                                    <Group spacing={4} style={{ flexWrap: "nowrap" }}>
                                                        <Text color={"dimmed"} size={"xs"} lineClamp={1} fw={700}>
                                                            ↓
                                                        </Text>
                                                        <Currency
                                                            amount={win}
                                                            currency={walletItem.currency}
                                                            useColor={false}
                                                            color={"dimmed"}
                                                            size={"xs"}
                                                        />
                                                    </Group>
                                                </MediaQuery>
                                                <MediaQuery smallerThan={"sm"} styles={{ display: "none" }}>
                                                    <Group spacing={4} style={{ flexWrap: "nowrap" }}>
                                                        <Text color={"dimmed"} size={"xs"} lineClamp={1} fw={700}>
                                                            ↑
                                                        </Text>
                                                        <Currency
                                                            amount={lose}
                                                            currency={walletItem.currency}
                                                            useColor={false}
                                                            color={"dimmed"}
                                                            size={"xs"}
                                                        />
                                                    </Group>
                                                </MediaQuery>
                                                <MediaQuery smallerThan={"sm"} styles={{ display: "none" }}>
                                                    <Group spacing={4} style={{ flexWrap: "nowrap" }}>
                                                        <Text color={"dimmed"} size={"xs"} lineClamp={1} fw={700}>
                                                            ↔
                                                        </Text>
                                                        <Currency
                                                            amount={total}
                                                            currency={walletItem.currency}
                                                            useColor={false}
                                                            color={"dimmed"}
                                                            size={"xs"}
                                                        />
                                                    </Group>
                                                </MediaQuery>
                                            </>
                                        )}
                                    </Group>

                                    <Collapse
                                        in={isExpanded || someChildAreSelected}
                                        mb={"sm"}
                                        mt={"xs"}
                                        style={{ minWidth: "100%" }}
                                        transitionDuration={100}
                                    >
                                        <Divider variant={"dotted"} />

                                        {sortedItems[k].map((item) => {
                                            const getThirdparty = (id) => {
                                                const found = app.wallet.thirdparties.filter((t) => t.id === id);
                                                if (found.length === 1) return found[0];
                                                return null;
                                            };

                                            const getWalletItem = (id) => {
                                                const found = app.wallet.walletItems.filter((t) => t.id === id);
                                                if (found.length === 1) return found[0];
                                                return null;
                                            };

                                            const getCategory = (id) => {
                                                const found = app.wallet.categories.filter((t) => t.id === id);
                                                if (found.length === 1) return found[0];
                                                return null;
                                            };

                                            const getPaytype = (id) => {
                                                const found = app.wallet.paytypes.filter((t) => t.id === id);
                                                if (found.length === 1) return found[0];
                                                return null;
                                            };

                                            const itemThirdparty =
                                                item.type === "operation"
                                                    ? getThirdparty(item.thirdpartyId)?.name || "-"
                                                    : item.type === "transfer"
                                                    ? getWalletItem(
                                                          item.amount > 0 ? item.toWalletItemId : item.fromWalletItemId
                                                      )?.name || "-"
                                                    : "-";

                                            const itemCategory = getCategory(item.categoryId)?.name || "";

                                            const itemPaytype = getPaytype(item.paytypeId)?.name || "";

                                            const isSelected = selected.includes(item.id);
                                            const toggleSelection = () => {
                                                const withCtrl = window && window.event.ctrlKey;

                                                if (selected.includes(item.id) && onUnselect) {
                                                    onUnselect(withCtrl ? [item.id] : item.id);
                                                }
                                                if (!selected.includes(item.id) && onSelect) {
                                                    onSelect(withCtrl ? [item.id] : item.id);
                                                }
                                            };

                                            return (
                                                <Box
                                                    mt={0}
                                                    py={0}
                                                    key={item.id}
                                                    style={{
                                                        cursor: "pointer"
                                                    }}
                                                    sx={{
                                                        "&:nth-of-type(even)": {
                                                            backgroundColor: isSelected
                                                                ? app.theme.colorScheme === "dark"
                                                                    ? app.theme.colors.brand[7]
                                                                    : app.theme.colors.brand[3]
                                                                : app.theme.colorScheme === "dark"
                                                                ? app.theme.colors.gray[9]
                                                                : app.theme.colors.gray[0]
                                                        },
                                                        "&:hover": {
                                                            backgroundColor: isSelected
                                                                ? app.theme.colorScheme === "dark"
                                                                    ? app.theme.colors.brand[7]
                                                                    : app.theme.colors.brand[3]
                                                                : app.theme.colorScheme === "dark"
                                                                ? app.theme.colors.gray[8]
                                                                : app.theme.colors.gray[1]
                                                        },
                                                        backgroundColor: isSelected
                                                            ? app.theme.colorScheme === "dark"
                                                                ? app.theme.colors.brand[7]
                                                                : app.theme.colors.brand[3]
                                                            : "inherit",
                                                        color: isSelected ? "#fff" : "inherit"
                                                    }}
                                                    onClick={() => toggleSelection()}
                                                >
                                                    <Group spacing={0} position={"apart"} style={{ minHeight: "50px" }}>
                                                        <Group spacing={0}>
                                                            <Group spacing={0} style={{ flexWrap: "nowrap" }}>
                                                                <Stack
                                                                    justify={"flex-start"}
                                                                    align={"flex-start"}
                                                                    spacing={0}
                                                                    style={{ width: "400px" }}
                                                                    py={7}
                                                                    px={"xs"}
                                                                >
                                                                    <Group
                                                                        spacing={"xs"}
                                                                        style={{ flexWrap: "nowrap" }}
                                                                    >
                                                                        {item.type === "operation" && (
                                                                            <IconReceipt
                                                                                size={16}
                                                                                stroke={2}
                                                                                color={"#339AF0"}
                                                                            />
                                                                        )}
                                                                        {item.type === "transfer" && (
                                                                            <IconArrowMoveRight
                                                                                size={16}
                                                                                stroke={2}
                                                                                color={"#339AF0"}
                                                                            />
                                                                        )}
                                                                        <Tooltip
                                                                            label={
                                                                                item.comment ||
                                                                                "(aucun commentaire sur cette opération)"
                                                                            }
                                                                        >
                                                                            <Text size={"sm"} fw={500} lineClamp={1}>
                                                                                {item.title}
                                                                            </Text>
                                                                        </Tooltip>
                                                                    </Group>
                                                                    <Group
                                                                        spacing={"xs"}
                                                                        style={{ flexWrap: "nowrap" }}
                                                                    >
                                                                        <Tooltip
                                                                            label={
                                                                                item.state === 1
                                                                                    ? "Opération rapprochée"
                                                                                    : "Opération non rapprochée"
                                                                            }
                                                                        >
                                                                            <Stack spacing={0}>
                                                                                {item.state === 1 ? (
                                                                                    <IconSquareCheck
                                                                                        size={16}
                                                                                        stroke={2}
                                                                                        color={
                                                                                            app.theme.colors.yellow[7]
                                                                                        }
                                                                                        style={{ cursor: "pointer" }}
                                                                                    />
                                                                                ) : (
                                                                                    <IconSquare
                                                                                        size={16}
                                                                                        stroke={2}
                                                                                        color={
                                                                                            app.theme.colorScheme ===
                                                                                            "dark"
                                                                                                ? app.theme.colors
                                                                                                      .gray[8]
                                                                                                : app.theme.colors
                                                                                                      .gray[3]
                                                                                        }
                                                                                        style={{ cursor: "pointer" }}
                                                                                    />
                                                                                )}
                                                                            </Stack>
                                                                        </Tooltip>

                                                                        <Text size={"xs"} lineClamp={1}>
                                                                            {`${
                                                                                item.amount < 0
                                                                                    ? item.type === "transfer"
                                                                                        ? "Transfert vers "
                                                                                        : "Paiement à "
                                                                                    : item.amount > 0
                                                                                    ? "Reçu de  "
                                                                                    : ""
                                                                            }${itemThirdparty}`}
                                                                        </Text>
                                                                    </Group>
                                                                </Stack>
                                                            </Group>

                                                            <Stack
                                                                justify={"flex-start"}
                                                                align={"flex-start"}
                                                                spacing={0}
                                                                style={{ minWidth: "150px" }}
                                                                px={"xs"}
                                                            >
                                                                <Text
                                                                    size={"xs"}
                                                                    color={"gray.0"}
                                                                    lineClamp={1}
                                                                    sx={(theme) => ({
                                                                        backgroundColor:
                                                                            itemCategory !== ""
                                                                                ? strToColor(
                                                                                      itemCategory,
                                                                                      theme.colorScheme
                                                                                  )
                                                                                : "inherit",
                                                                        paddingInline: "4px",
                                                                        borderRadius: "5px"
                                                                    })}
                                                                    mt={2}
                                                                >
                                                                    {itemCategory}
                                                                </Text>
                                                                <Text
                                                                    size={"xs"}
                                                                    color={"dimmed"}
                                                                    lineClamp={1}
                                                                    align={"right"}
                                                                    mt={2}
                                                                >
                                                                    {itemPaytype}
                                                                </Text>
                                                            </Stack>
                                                        </Group>

                                                        <Stack justify={"flex-start"} align={"flex-end"} spacing={0}>
                                                            <Currency
                                                                amount={item.amount}
                                                                currency={"EUR"}
                                                                size={"sm"}
                                                                lineClamp={1}
                                                                align={"right"}
                                                                fw={500}
                                                                p={"xs"}
                                                            />
                                                        </Stack>
                                                    </Group>

                                                    <Divider variant={"dotted"} />
                                                </Box>
                                            );
                                        })}
                                    </Collapse>
                                </Timeline.Item>
                            );
                        })}
                    </Timeline>
                </>
            )}
        </>
    );
}

export default OpeList;
