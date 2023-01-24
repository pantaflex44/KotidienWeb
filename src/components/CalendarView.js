import packagejson from "../../package.json";

import React, { memo, useEffect, useMemo, useState, useContext, useCallback, useLayoutEffect } from "react";

import { getDatePattern, getFirstDayOfMonth, getLastDayOfMonth } from "../../tools";
import dayjs from "dayjs";
import { getAmountAt } from "../wrappers/wallet_api";

import { ActionIcon, Box, Center, Grid, Group, Indicator, MediaQuery, SimpleGrid, Stack, Text } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";

import { IconChevronLeft, IconChevronRight, IconChevronsLeft, IconCircleChevronRight } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import Currency from "./Currency";
import moment from "moment/moment";

function CalendarView({ walletItem, items, currentDate = null, onDateChange = null }) {
    const app = useContext(AppContext);

    const [calendar, setCalendar] = useState([]);
    const [totalAmounts, setTotalAmounts] = useState({});
    const [viewDate, setViewDate] = useState(currentDate || dayjs().toDate());

    const dateInfo = (date) => {
        const dayItems = items.filter((item) => dayjs(item.date).isSame(date, "day"));

        const lose = dayItems.map((i) => (i.amount < 0 ? i.amount : 0)).reduce((a, b) => a + b, 0);
        const win = dayItems.map((i) => (i.amount >= 0 ? i.amount : 0)).reduce((a, b) => a + b, 0);
        const total = dayItems.map((i) => i.amount).reduce((a, b) => a + b, 0);

        return {
            isWeekend: date.day() === 0 || date.day() === 6,
            isSameMonth: date.month() === dayjs(viewDate).month(),
            itemsCount: dayItems.length,
            win,
            lose,
            total,
            items: dayItems
        };
    };

    const completeBefore = (date) => {
        const day = date.day() === 0 ? 7 : date.day();
        const days = Array.from({ length: day - 1 }, (_, i) => {
            const day = date.subtract(i + 1, "day");
            return {
                [day.format("YYYY-MM-DD")]: dateInfo(day)
            };
        });
        let obj = {};
        days.forEach((day) => {
            obj = { ...obj, ...day };
        });
        return obj;
    };

    const completeAfter = (date) => {
        const day = date.day() === 0 ? 7 : date.day();
        const days = Array.from({ length: 7 - day }, (_, i) => {
            const day = date.add(i + 1, "day");
            return {
                [day.format("YYYY-MM-DD")]: dateInfo(day)
            };
        });
        let obj = {};
        days.forEach((day) => {
            obj = { ...obj, ...day };
        });
        return obj;
    };

    const getKnownAmountAt = useCallback(
        (date) => {
            return totalAmounts[date] || 0;
        },
        [totalAmounts]
    );

    const amountIsKnownAt = useCallback(
        (date) => {
            return totalAmounts.hasOwnProperty(date);
        },
        [totalAmounts]
    );

    useLayoutEffect(() => {
        const firstDayOfMonth = dayjs(viewDate).startOf("month");
        const lastDayOfMonth = dayjs(viewDate).endOf("month");

        const list = Array.from({ length: lastDayOfMonth.date() }, (_, i) => {
            const day = firstDayOfMonth.add(i, "day");
            return {
                [day.format("YYYY-MM-DD")]: dateInfo(day)
            };
        });
        let obj = {};
        list.forEach((day) => {
            obj = { ...obj, ...day };
        });

        const thisMonth = {
            ...completeBefore(firstDayOfMonth),
            ...obj,
            ...completeAfter(lastDayOfMonth)
        };

        const temp = Object.entries(thisMonth)
            .sort((a, b) => {
                return dayjs(a[0]).isBefore(dayjs(b[0])) ? -1 : 1;
            })
            .reduce((acc, [key, value], i) => {
                const row = Math.floor(i / 7);
                if (!acc[row]) {
                    acc[row] = {};
                }
                acc[row][key] = value;
                return acc;
            }, {});

        const grid = Object.keys(temp).map((key) => temp[key]);

        setTotalAmounts({});

        setCalendar(grid);
    }, [items, walletItem.id]);

    useLayoutEffect(() => {
        dateChanged(dayjs(viewDate));
    }, [viewDate]);

    useEffect(() => {
        calendar.forEach((week) => {
            Object.entries(week).forEach(([key, value]) => {
                const date = dayjs(key);

                if (value.itemsCount > 0) {
                    getAmountAt(app.wallet.email, walletItem.id, date.format("YYYY-MM-DD")).then((response) => {
                        const { amount, errorCode, errorMessage } = response;

                        if (errorCode === 0) {
                            setTotalAmounts((current) => ({
                                ...current,
                                [dayjs(date).format("YYYY-MM-DD")]: walletItem.initialAmount + amount
                            }));
                        }
                    });
                }
            });
        });
    }, [calendar]);

    const dateChanged = (newDate) => {
        const newDateJs = newDate.toDate();
        const firstDayOfMonth = getFirstDayOfMonth(newDateJs.getFullYear(), newDateJs.getMonth());
        const lastDayOfMonth = getLastDayOfMonth(newDateJs.getFullYear(), newDateJs.getMonth());

        let before = completeBefore(dayjs(firstDayOfMonth));
        before = before && Object.keys(before).length > 0 ? Object.keys(before).sort((a, b) => (a >= b ? 1 : -1)) : {};

        let after = completeAfter(dayjs(lastDayOfMonth));
        after = after && Object.keys(after).length > 0 ? Object.keys(after).sort((a, b) => (a < b ? 1 : -1)) : {};

        const startDate = (before.length > 0 ? moment(before[0], "YYYY-MM-DD") : newDate).toDate();
        const endDate = (after.length ? moment(after[0], "YYYY-MM-DD") : newDate).toDate();

        onDateChange([
            getFirstDayOfMonth(startDate.getFullYear(), startDate.getMonth()),
            getLastDayOfMonth(endDate.getFullYear(), endDate.getMonth())
        ]);
    };

    const isToSmall = useMediaQuery("(max-width: 768px)");
    const toLongDate = (date) =>
        dayjs(date).locale(packagejson.i18n.defaultLocale).format(getDatePattern(packagejson.i18n.defaultLocale, true));

    return (
        <Stack>
            <Group position="center" spacing="lg">
                <Group
                    position="center"
                    spacing="xs"
                    p={"4px"}
                    style={{
                        backgroundColor:
                            app.theme.colorScheme === "dark" ? app.theme.colors.gray[9] : app.theme.colors.gray[0],
                        borderRadius: "5px"
                    }}
                >
                    <ActionIcon
                        onClick={() =>
                            setViewDate((current) => {
                                const newDate = dayjs(current).subtract(1, "month");
                                dateChanged(newDate);
                                return newDate.toDate();
                            })
                        }
                    >
                        <IconChevronLeft size={14} color={app.theme.colors.brand[5]} stroke={2.5} />
                    </ActionIcon>
                    <Text size={"xs"} fw={500}>
                        {dayjs(viewDate).locale(packagejson.i18n.defaultLocale).format("MMMM")}
                    </Text>
                    <ActionIcon
                        onClick={() =>
                            setViewDate((current) => {
                                const newDate = dayjs(current).add(1, "month");
                                dateChanged(newDate);
                                return newDate.toDate();
                            })
                        }
                    >
                        <IconChevronRight size={14} color={app.theme.colors.brand[5]} stroke={2.5} />
                    </ActionIcon>
                </Group>
                <Group
                    position="center"
                    spacing="xs"
                    p={"4px"}
                    style={{
                        backgroundColor:
                            app.theme.colorScheme === "dark" ? app.theme.colors.gray[9] : app.theme.colors.gray[0],
                        borderRadius: "5px"
                    }}
                >
                    <ActionIcon
                        onClick={() =>
                            setViewDate((current) => {
                                const newDate = dayjs(current).subtract(1, "year");
                                dateChanged(newDate);
                                return newDate.toDate();
                            })
                        }
                    >
                        <IconChevronLeft size={14} color={app.theme.colors.brand[5]} stroke={2.5} />
                    </ActionIcon>
                    <Text size={"xs"} fw={500}>
                        {dayjs(viewDate).locale(packagejson.i18n.defaultLocale).format("YYYY")}
                    </Text>
                    <ActionIcon
                        onClick={() =>
                            setViewDate((current) => {
                                const newDate = dayjs(current).add(1, "year");
                                dateChanged(newDate);
                                return newDate.toDate();
                            })
                        }
                    >
                        <IconChevronRight size={14} color={app.theme.colors.brand[5]} stroke={2.5} />
                    </ActionIcon>
                </Group>
            </Group>
            <SimpleGrid cols={isToSmall ? 1 : 7} mx={4} spacing="xs" verticalSpacing={isToSmall ? "md" : "xs"}>
                {["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"].map((day) => (
                    <MediaQuery smallerThan={"sm"} styles={{ display: "none" }} key={day}>
                        <Box
                            p={"xs"}
                            style={{
                                backgroundColor:
                                    app.theme.colorScheme === "dark"
                                        ? app.theme.colors.brand[7]
                                        : app.theme.colors.brand[3],
                                color: app.theme.white
                            }}
                        >
                            <Text size={"sm"} lineClamp={1} align={"center"}>
                                {day}
                            </Text>
                        </Box>
                    </MediaQuery>
                ))}

                {calendar.map((week) =>
                    Object.keys(week).map((date) => {
                        return (
                            <Box
                                key={date}
                                h={isToSmall ? (week[date].itemsCount > 0 ? "57px" : "26px") : "110px"}
                                sx={{
                                    cursor: "pointer",
                                    borderRadius: "5px",
                                    backgroundColor: week[date].isWeekend
                                        ? app.theme.fn.rgba(app.theme.colors.brand[5], 0.05)
                                        : "transparent",
                                    overflow: "hidden",

                                    "&:hover": {
                                        backgroundColor:
                                            app.theme.colorScheme === "dark"
                                                ? app.theme.colors.gray[9]
                                                : app.theme.colors.gray[0]
                                    }
                                }}
                            >
                                <Group
                                    position={isToSmall ? "apart" : "right"}
                                    style={{
                                        height: "24px",
                                        borderRadius: "5px",
                                        borderRight: `1px solid ${
                                            app.theme.colorScheme === "dark"
                                                ? app.theme.colors.gray[8]
                                                : app.theme.colors.gray[2]
                                        }`,
                                        borderTop: `1px solid ${
                                            app.theme.colorScheme === "dark"
                                                ? app.theme.colors.gray[8]
                                                : app.theme.colors.gray[2]
                                        }`
                                    }}
                                >
                                    {isToSmall &&
                                        (week[date].itemsCount > 0 || amountIsKnownAt(date) ? (
                                            <Currency
                                                pl={6}
                                                currency={walletItem.currency}
                                                size={"12px"}
                                                fw={500}
                                                lineClamp={1}
                                                amount={getKnownAmountAt(date)}
                                                color={
                                                    app.theme.colorScheme === "dark"
                                                        ? app.theme.colors.brand[3]
                                                        : app.theme.colors.brand[7]
                                                }
                                            />
                                        ) : (
                                            <Text size={"12px"}></Text>
                                        ))}
                                    <Indicator
                                        disabled={week[date].itemsCount === 0}
                                        size={14}
                                        withBorder={true}
                                        processing={true}
                                        zIndex={1}
                                    >
                                        <Text
                                            size={week[date].isSameMonth ? "xs" : "10px"}
                                            align={"right"}
                                            color={week[date].isSameMonth ? "inherit" : "dimmed"}
                                            py={2}
                                            pr={6}
                                        >
                                            {isToSmall ? toLongDate(date) : dayjs(date).date()}
                                        </Text>
                                    </Indicator>
                                </Group>

                                {week[date].itemsCount > 0 && (
                                    <>
                                        {!isToSmall && amountIsKnownAt(date) ? (
                                            <Stack px={"xs"} align={"flex-start"}>
                                                <Currency
                                                    currency={walletItem.currency}
                                                    size={"12px"}
                                                    fw={500}
                                                    lineClamp={1}
                                                    amount={getKnownAmountAt(date)}
                                                    color={
                                                        app.theme.colorScheme === "dark"
                                                            ? app.theme.colors.brand[3]
                                                            : app.theme.colors.brand[7]
                                                    }
                                                />
                                            </Stack>
                                        ) : (
                                            <Text size={"xs"} color={"dimmed"}></Text>
                                        )}

                                        <SimpleGrid
                                            mt={isToSmall ? "xs" : "6px"}
                                            cols={isToSmall ? 3 : 1}
                                            spacing={0}
                                            verticalSpacing={0}
                                        >
                                            <Text
                                                px={"xs"}
                                                size={"10px"}
                                                align={"left"}
                                                lineClamp={1}
                                                color={isToSmall || !week[date].isSameMonth ? "dimmed" : "inherit"}
                                            >{`${week[date].itemsCount} opération${
                                                week[date].itemsCount > 1 ? "s" : ""
                                            }`}</Text>

                                            <Group
                                                mt={isToSmall ? 0 : "4px"}
                                                spacing={4}
                                                style={{ flexWrap: "nowrap" }}
                                                px={"xs"}
                                                align={isToSmall ? "right" : "left"}
                                            >
                                                <Text
                                                    color={isToSmall || !week[date].isSameMonth ? "dimmed" : "inherit"}
                                                    size={"10px"}
                                                    lineClamp={1}
                                                    fw={700}
                                                >
                                                    ↑
                                                </Text>
                                                <Currency
                                                    amount={week[date].win}
                                                    currency={walletItem.currency}
                                                    useColor={false}
                                                    size={"10px"}
                                                    color={isToSmall || !week[date].isSameMonth ? "dimmed" : "inherit"}
                                                />
                                            </Group>

                                            <Group
                                                spacing={4}
                                                style={{ flexWrap: "nowrap" }}
                                                px={"xs"}
                                                align={isToSmall ? "right" : "left"}
                                            >
                                                <Text
                                                    color={isToSmall || !week[date].isSameMonth ? "dimmed" : "inherit"}
                                                    size={"10px"}
                                                    lineClamp={1}
                                                    fw={700}
                                                >
                                                    ↓
                                                </Text>
                                                <Currency
                                                    amount={week[date].lose}
                                                    currency={walletItem.currency}
                                                    useColor={false}
                                                    size={"10px"}
                                                    color={isToSmall || !week[date].isSameMonth ? "dimmed" : "inherit"}
                                                />
                                            </Group>
                                        </SimpleGrid>
                                    </>
                                )}
                            </Box>
                        );
                    })
                )}
            </SimpleGrid>
        </Stack>
    );
}

export default memo(
    CalendarView,
    (p, n) => JSON.stringify(p.items) === JSON.stringify(n.items) && p.currentDate === n.currentDate
);
