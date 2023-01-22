import { getAmountAt } from "../wrappers/wallet_api";

import React, { memo, useEffect, useLayoutEffect, useMemo, useState, useContext, useCallback } from "react";

import dayjs from "dayjs";

import { AppContext } from "./AppProvider";

function CalendarView({ walletItem, items, currentDate = null }) {
    const app = useContext(AppContext);
    const [calendar, setCalendar] = useState([]);
    const [totalAmounts, setTotalAmounts] = useState({});
    const today = useMemo(() => currentDate || dayjs().toDate(), [currentDate]);

    const dateInfo = (date) => {
        const dayItems = items.filter((item) => dayjs(item.date).isSame(date, "day"));

        const lose = dayItems.map((i) => (i.amount < 0 ? i.amount : 0)).reduce((a, b) => a + b, 0);
        const win = dayItems.map((i) => (i.amount >= 0 ? i.amount : 0)).reduce((a, b) => a + b, 0);
        const total = dayItems.map((i) => i.amount).reduce((a, b) => a + b, 0);

        return {
            isWeekend: date.day() === 0 || date.day() === 6,
            isSameMonth: date.month() === dayjs(today).month(),
            itemsCount: dayItems.length,
            win,
            lose,
            total
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

    const thisMonth = useMemo(() => {
        const firstDayOfMonth = dayjs(today).startOf("month");
        const lastDayOfMonth = dayjs(today).endOf("month");

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

        return {
            ...completeBefore(firstDayOfMonth),
            ...obj,
            ...completeAfter(lastDayOfMonth)
        };
    }, [today, walletItem.id]);

    useEffect(() => {
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

        setCalendar(grid);
    }, [thisMonth, walletItem.id]);

    const retreiveAmounts = useCallback(() => {
        calendar.forEach((week) => {
            Object.entries(week).forEach(([key, value]) => {
                const date = dayjs(key);
                if (value.itemsCount > 0) {
                    getAmountAt(app.wallet.email, walletItem.id, date.format("YYYY-MM-DD")).then((response) => {
                        const { amount, errorCode, errorMessage } = response;

                        if (errorCode === 0) {
                            setTotalAmounts((current) => ({
                                ...current,
                                [date.format("YYYY-MM-DD")]: walletItem.initialAmount + amount
                            }));
                        }
                    });
                }
            });
        });
    }, [totalAmounts, calendar, walletItem.id]);

    useEffect(() => {
        setTotalAmounts({});
        retreiveAmounts();
    }, [calendar]);


    return <></>;
}

export default memo(
    CalendarView,
    (p, n) => JSON.stringify(p.items) === JSON.stringify(n.items) && p.currentDate === n.currentDate
);
