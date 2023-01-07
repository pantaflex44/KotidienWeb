import packagejson from "../../package.json";

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState
} from "react";

import {
    Accordion,
    ActionIcon,
    Box,
    Button,
    Checkbox,
    Collapse,
    Divider,
    Grid,
    Group,
    Loader,
    MediaQuery,
    Modal,
    NumberInput,
    Paper,
    ScrollArea,
    Select,
    Space,
    Stack,
    Table,
    Tabs,
    Text,
    TextInput,
    Timeline,
    Tooltip
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { closeAllModals } from "@mantine/modals";
import { useForm } from "@mantine/form";
import { useFocusTrap, useHotkeys, useListState } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import { useResizeObserver, useWindowEvent } from "@mantine/hooks";

import {
    IconArrowDown,
    IconArrowDownBar,
    IconArrowDownCircle,
    IconArrowMoveRight,
    IconArrowRightBar,
    IconArrowUp,
    IconArrowUpBar,
    IconArrowUpCircle,
    IconArrowsDiff,
    IconArrowsMoveHorizontal,
    IconArrowsTransferDown,
    IconBuildingBank,
    IconCalendar,
    IconCalendarEvent,
    IconCash,
    IconCategory,
    IconCheck,
    IconChecks,
    IconChevronDown,
    IconChevronUp,
    IconCircuitSwitchClosed,
    IconCurrencyEuro,
    IconEdit,
    IconFilter,
    IconListDetails,
    IconPlus,
    IconQuote,
    IconReceipt,
    IconRefresh,
    IconSquare,
    IconSquareCheck,
    IconTag,
    IconThumbUp,
    IconTrash,
    IconUsers,
    IconX,
    IconYinYang
} from "@tabler/icons";

import { AppContext } from "./AppProvider";
import Currency from "./Currency";

import { getDatePattern, strToColor } from "../../tools";
import dayjs from "dayjs";
import { getAmountAt } from "../wrappers/wallet_api";

function OpeList({
    walletItem,
    items = [],
    selected = [],
    disabled = false,
    onSelect = null,
    onUnselect = null,
    onChange = null
}) {
    const app = useContext(AppContext);
    const [sortedItems, setSortedItems] = useState({});
    const [totalAmounts, setTotalAmounts] = useState({});
    const [collapsible, setCollapsible] = useState({});
    const [loading, setLoading] = useState(true);

    const sortItems = useCallback(
        (items) => {
            setLoading(true);

            const si = items
                .sort(
                    (a, b) =>
                        new Date(Date.parse(b.date.replace(/-/g, "/"))) -
                        new Date(Date.parse(a.date.replace(/-/g, "/")))
                )
                .reduce((r, a) => {
                    setCollapsible((current) => ({
                        ...current,
                        [walletItem.id]: {
                            ...(current[walletItem.id] || {}),
                            [a.date]:
                                (current[walletItem.id] && current[walletItem.id][a.date]) ||
                                app.wallet.params?.views?.extendOperations === true
                        }
                    }));

                    r[a.date] = r[a.date] || [];
                    r[a.date].push(a);
                    r[a.date] = r[a.date].sort((a, b) => (a.id > b.id ? 1 : -1));
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

            setLoading(false);
        },
        [items]
    );

    useEffect(() => {
        sortItems(items);
    }, [items]);

    const updateItemState = (id, state) => {
        const i = items.filter((f) => f.id === id);
        if (i.length === 1) {
            const rest = items.filter((f) => f.id !== id);
            const ni = [...rest, { ...i[0], state }];
            if (onChange) onChange(ni);
        }
    };

    return (
        <>
            {loading ? (
                <Group position={"center"} spacing={"xs"}>
                    <Loader size={"xs"} variant={"bars"} />
                    <Text size={"xs"} fw={500}>
                        Chargement en cours, veuillez patienter SVP...
                    </Text>
                </Group>
            ) : (
                <Timeline
                    mt={"md"}
                    pb={"xl"}
                    active={0}
                    lineWidth={2}
                    bulletSize={20}
                    style={{ overflowX: "auto" }}
                    styles={(theme) => ({
                        itemTitle: {
                            color:
                                app.theme.colorScheme === "dark" ? app.theme.colors.gray[6] : app.theme.colors.gray[6],
                            fontSize: "smaller"
                        }
                    })}
                >
                    {Object.keys(sortedItems).map((k) => {
                        const win = sortedItems[k].map((i) => (i.amount < 0 ? i.amount : 0)).reduce((a, b) => a + b, 0);
                        const lose = sortedItems[k]
                            .map((i) => (i.amount >= 0 ? i.amount : 0))
                            .reduce((a, b) => a + b, 0);
                        const total = sortedItems[k].map((i) => i.amount).reduce((a, b) => a + b, 0);

                        return (
                            <Timeline.Item
                                key={k}
                                title={dayjs(k)
                                    .locale(packagejson.i18n.defaultLocale)
                                    .format(getDatePattern(packagejson.i18n.defaultLocale, true))}
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
                            >
                                <Group
                                    spacing={"xl"}
                                    style={{ cursor: "pointer", flexWrap: "nowrap" }}
                                    onClick={() =>
                                        setCollapsible((current) => ({
                                            ...current,
                                            [walletItem.id]: {
                                                ...(current[walletItem.id] || {}),
                                                [k]: current[walletItem.id] ? !current[walletItem.id][k] : false
                                            }
                                        }))
                                    }
                                >
                                    <Group spacing={4} style={{ flexWrap: "nowrap" }}>
                                        {collapsible[walletItem.id] && collapsible[walletItem.id][k] === true ? (
                                            <IconChevronUp size={16} />
                                        ) : (
                                            <IconChevronDown size={16} />
                                        )}
                                        <Text size={"xs"} lineClamp={1}>
                                            {sortedItems[k].length} opération
                                            {sortedItems[k].length > 1 ? "s" : ""}
                                        </Text>
                                    </Group>
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

                                    <Group spacing={"xs"} style={{ flexWrap: "nowrap" }}>
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
                                    <Group spacing={"xs"} style={{ flexWrap: "nowrap" }}>
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
                                    <Group spacing={"xs"} style={{ flexWrap: "nowrap" }}>
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
                                </Group>

                                <Collapse
                                    in={collapsible[walletItem.id] && collapsible[walletItem.id][k]}
                                    mb={"sm"}
                                    mt={"xs"}
                                    style={{ minWidth: "100%" }}
                                >
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

                                        return (
                                            <Box
                                                mt={0}
                                                key={item.id}
                                                py={"xs"}
                                                pt={0}
                                                style={{
                                                    cursor: "default"
                                                }}
                                            >
                                                <Group spacing={"md"} position={"apart"}>
                                                    <Group spacing={"md"}>
                                                        <Group spacing={"md"} style={{ flexWrap: "nowrap" }}>
                                                            <Stack justify={"center"} align={"center"} spacing={0}>
                                                                <Checkbox
                                                                    checked={
                                                                        (Array.isArray(selected) &&
                                                                            selected.includes(item.id)) ||
                                                                        selected === item.id
                                                                    }
                                                                    onChange={(event) => {
                                                                        if (event.currentTarget.checked && onSelect) {
                                                                            onSelect([item.id]);
                                                                        } else if (
                                                                            !event.currentTarget.checked &&
                                                                            onUnselect
                                                                        ) {
                                                                            onUnselect([item.id]);
                                                                        }
                                                                    }}
                                                                    size={"xs"}
                                                                    m={0}
                                                                    p={0}
                                                                />
                                                            </Stack>

                                                            <Divider orientation="vertical" />

                                                            <Stack
                                                                justify={"flex-start"}
                                                                align={"flex-start"}
                                                                spacing={0}
                                                                style={{ width: "400px" }}
                                                            >
                                                                <Group spacing={"xs"} style={{ flexWrap: "nowrap" }}>
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
                                                                    <Tooltip label={item.comment || ""}>
                                                                        <Text size={"sm"} fw={500} lineClamp={1}>
                                                                            {item.title}
                                                                        </Text>
                                                                    </Tooltip>
                                                                </Group>
                                                                <Group spacing={"xs"} style={{ flexWrap: "nowrap" }}>
                                                                    <Tooltip
                                                                        label={
                                                                            item.state === 1
                                                                                ? "Annuler le rapprochement"
                                                                                : "Rapprocher l'opération"
                                                                        }
                                                                    >
                                                                        <Stack spacing={0}>
                                                                            {item.state === 1 ? (
                                                                                <IconSquareCheck
                                                                                    size={16}
                                                                                    stroke={2}
                                                                                    color={app.theme.colors.yellow[7]}
                                                                                    style={{ cursor: "pointer" }}
                                                                                    onClick={() =>
                                                                                        updateItemState(item.id, 0)
                                                                                    }
                                                                                />
                                                                            ) : (
                                                                                <IconSquare
                                                                                    size={16}
                                                                                    stroke={2}
                                                                                    color={
                                                                                        app.theme.colorScheme === "dark"
                                                                                            ? app.theme.colors.gray[8]
                                                                                            : app.theme.colors.gray[3]
                                                                                    }
                                                                                    style={{ cursor: "pointer" }}
                                                                                    onClick={() =>
                                                                                        updateItemState(item.id, 1)
                                                                                    }
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

                                                        <Stack justify={"flex-start"} align={"flex-start"} spacing={0}>
                                                            <Text
                                                                size={"xs"}
                                                                color={
                                                                    app.theme.colorScheme === "dark" ? "gray.8" : "gray.0"
                                                                }
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
                                                            >
                                                                {itemCategory}
                                                            </Text>
                                                            <Text
                                                                size={"xs"}
                                                                color={"dimmed"}
                                                                lineClamp={1}
                                                                align={"right"}
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
                                                            color={app.theme.colors.brand[5]}
                                                        />
                                                    </Stack>
                                                </Group>

                                                <Divider variant={"dotted"} mt={"sm"} />
                                            </Box>
                                        );
                                    })}
                                </Collapse>
                            </Timeline.Item>
                        );
                    })}
                </Timeline>
            )}
        </>
    );
}

export default OpeList;
