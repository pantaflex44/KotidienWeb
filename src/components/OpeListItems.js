import packagejson from "../../package.json";

import { getDatePattern, strToColor } from "../../tools";
import dayjs from "dayjs";
import { getAmountAt } from "../wrappers/wallet_api";
import { useHotkeys } from "@mantine/hooks";

import React, { memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

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
import OpeListItem from "./OpeListItem";

function OpeListItems({
    walletItem,
    items,
    date,
    selected = [],
    onSelect = null,
    onUnselect = null,
    onKeyDown = null,
    totalAmounts = {},
    showAmountsDetails = true,
    showTotalAmounts = true,
    collapsible = {},
    setCollapsible = () => {}
}) {
    const [details, setDetails] = useState({ win: 0, lose: 0, total: 0 });
    const [longDate, setLongDate] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);

    useLayoutEffect(() => {
        const win = items.map((i) => (i.amount < 0 ? i.amount : 0)).reduce((a, b) => a + b, 0);
        const lose = items.map((i) => (i.amount >= 0 ? i.amount : 0)).reduce((a, b) => a + b, 0);
        const total = items.map((i) => i.amount).reduce((a, b) => a + b, 0);

        setDetails({ win, lose, total });
    }, [items]);

    useLayoutEffect(() => {
        setLongDate(
            dayjs(date)
                .locale(packagejson.i18n.defaultLocale)
                .format(getDatePattern(packagejson.i18n.defaultLocale, true))
        );
    }, [date]);

    useEffect(() => {
        setIsExpanded(
            collapsible[walletItem.id] &&
                (collapsible[walletItem.id][date] === true || collapsible[walletItem.id]["all"] === true)
        );
    }, [date, collapsible]);

    const unselectChilds = () => {
        if (onUnselect) {
            const newUnselectedItems = selected.filter((id) => items.map((s) => s.id).includes(id));
            onUnselect(newUnselectedItems);
        }
    };

    const toggleCollapse = () => {
        if (someChildAreSelected) unselectChilds();

        setCollapsible((current) => ({
            ...current,
            [walletItem.id]: {
                ...(current[walletItem.id] || {}),
                all: false,
                [date]: current[walletItem.id] ? !current[walletItem.id][date] : false
            }
        }));
    };

    const someChildAreSelected = useMemo(
        () => items.map((s) => s.id).some((x) => selected.includes(x)),
        [items, selected]
    );

    const memoizedItems = useMemo(
        () =>
            items.map((item) => (
                <OpeListItem
                    key={item.id}
                    item={item}
                    isSelected={selected.includes(item.id)}
                    onUnselect={onUnselect}
                    onSelect={onSelect}
                />
            )),
        [items, selected]
    );

    return (
        <Box onKeyDown={onKeyDown}>
            <Group
                position={"apart"}
                spacing={"xl"}
                style={{ cursor: "pointer", flexWrap: "nowrap" }}
                onClick={() => toggleCollapse()}
            >
                <Group spacing={4} style={{ flexWrap: "nowrap" }}>
                    {isExpanded || someChildAreSelected ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                    <Text size={"xs"} color={"dimmed"} fw={500}>
                        {longDate}
                    </Text>
                    <Text size={"xs"} truncate={true} color={"dimmed"}>
                        ({items.length} opération
                        {items.length > 1 ? "s" : ""})
                    </Text>
                </Group>

                <Group spacing={"md"} style={{ flexWrap: "nowrap" }}>
                    {showAmountsDetails && (
                        <Group spacing={"sm"}>
                            <MediaQuery smallerThan={"sm"} styles={{ display: "none" }}>
                                <Group spacing={4} style={{ flexWrap: "nowrap" }}>
                                    <Text color={"dimmed"} size={"xs"} lineClamp={1} fw={700}>
                                        ↓
                                    </Text>
                                    <Currency
                                        amount={details.win}
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
                                        amount={details.lose}
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
                                        amount={details.total}
                                        currency={walletItem.currency}
                                        useColor={false}
                                        color={"dimmed"}
                                        size={"xs"}
                                    />
                                </Group>
                            </MediaQuery>
                        </Group>
                    )}

                    {showTotalAmounts && totalAmounts[date] ? (
                        <Currency
                            amount={totalAmounts[date]}
                            currency={walletItem.currency}
                            size={"xs"}
                            fw={700}
                            color={"brand.5"}
                        />
                    ) : (
                        <Text size={"xs"}>-</Text>
                    )}
                </Group>
            </Group>
            <Divider variant={"dotted"} spacing={0} mb={4} />

            <Collapse
                in={isExpanded || someChildAreSelected}
                mb={"sm"}
                mt={"xs"}
                style={{ minWidth: "100%" }}
                transitionDuration={100}
            >
                {memoizedItems}
            </Collapse>
        </Box>
    );
}

export default memo(
    OpeListItems,
    (p, n) =>
        p.date === n.date &&
        JSON.stringify(p.items) === JSON.stringify(n.items) &&
        JSON.stringify(p.selected) === JSON.stringify(n.selected) &&
        JSON.stringify(p.collapsible) === JSON.stringify(n.collapsible) &&
        JSON.stringify(p.totalAmounts) === JSON.stringify(n.totalAmounts)
);
