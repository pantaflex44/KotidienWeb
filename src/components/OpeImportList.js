import packagejson from "../../package.json";

import React, { cloneElement, useContext, useEffect, useState } from "react";

import { Box, Collapse, Group, ScrollArea, Text } from "@mantine/core";

import {
    IconBackspace,
    IconCheckbox,
    IconChevronDown,
    IconChevronUp,
    IconMessageDots,
    IconScript,
    IconScriptPlus,
    IconSquare,
    IconUserCheck,
    IconUserPlus
} from "@tabler/icons";

import { AppContext } from "./AppProvider";
import Currency from "./Currency";

import { getDatePattern, strToColor } from "../../tools";
import dayjs from "dayjs";
import { DateRangePicker } from "@mantine/dates";

function OpeImportItem({ item, onSelect = null, onUnselect = null, selected = false, disabled = false }) {
    const app = useContext(AppContext);
    const [isExpanded, setIsExpanded] = useState(false);

    const shortDate = dayjs(item.date)
        .locale(packagejson.i18n.defaultLocale)
        .format(getDatePattern(packagejson.i18n.defaultLocale, false));

    return (
        <Box
            px={"xs"}
            py={4}
            sx={{
                "&:nth-of-type(even)": {
                    backgroundColor:
                        app.theme.colorScheme === "dark" ? app.theme.colors.gray[9] : app.theme.colors.gray[0]
                },
                "&:hover": {
                    backgroundColor:
                        app.theme.colorScheme === "dark" ? app.theme.colors.gray[8] : app.theme.colors.gray[1]
                },
                borderBottom: isExpanded
                    ? `1px solid ${
                          app.theme.colorScheme === "dark" ? app.theme.colors.gray[8] : app.theme.colors.gray[2]
                      }`
                    : "none"
            }}
        >
            <Group position={"apart"} spacing="xs" style={{ flexWrap: "nowrap" }}>
                <Group
                    position={"left"}
                    spaincing="xs"
                    style={{ flexWrap: "nowrap", cursor: "pointer" }}
                    onClick={() => setIsExpanded((old) => !old)}
                >
                    {cloneElement(isExpanded ? <IconChevronUp /> : <IconChevronDown />, { size: 16 })}
                    <Text color={"dimmed"} size={"xs"} align={"left"} style={{ minWidth: "65px" }}>
                        {shortDate}
                    </Text>
                    <Text size={"sm"} lineClamp={1}>
                        {item.title}
                    </Text>
                </Group>
                <Group position={"right"} spaincing="xs" style={{ flexWrap: "nowrap" }}>
                    <Currency amount={item.amount} currency={"EUR"} size={"sm"} align={"right"} />

                    {onSelect &&
                        onUnselect &&
                        !disabled &&
                        (selected ? (
                            <IconCheckbox
                                size={16}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    if (selected && onUnselect) onUnselect(item);
                                    if (!selected && onSelect) onSelect(item);
                                }}
                            />
                        ) : (
                            <IconSquare
                                size={16}
                                style={{ cursor: "pointer" }}
                                onClick={() => {
                                    if (selected && onUnselect) onUnselect(item);
                                    if (!selected && onSelect) onSelect(item);
                                }}
                            />
                        ))}
                </Group>
            </Group>
            <Collapse in={isExpanded} py={4} pl={"xs"}>
                {item.comment && (
                    <Group spacing={6} pb={4}>
                        <IconMessageDots size={14} />
                        <Text size={"sm"} lineClamp={1}>
                            {item.comment}
                        </Text>
                    </Group>
                )}

                <Group position={"left"} spacing="xl" style={{ flexWrap: "nowrap" }}>
                    {item.thirdparty && (
                        <Group spacing={6}>
                            {item.thirdpartyId ? <IconUserCheck size={14} /> : <IconUserPlus size={14} />}
                            <Text
                                size={"xs"}
                                color={item.thirdpartyId ? app.theme.colors.brand[5] : "dimmed"}
                                lineClamp={1}
                                align={"right"}
                            >
                                {item.thirdparty}
                            </Text>
                        </Group>
                    )}

                    {item.paytype && (
                        <Group spacing={6}>
                            {item.paytypeId ? <IconScript size={14} /> : <IconScriptPlus size={14} />}
                            <Text
                                size={"xs"}
                                color={item.paytypeId ? app.theme.colors.brand[5] : "dimmed"}
                                lineClamp={1}
                                align={"right"}
                            >
                                {item.paytype}
                            </Text>
                        </Group>
                    )}

                    {item.category && (
                        <Text
                            size={"xs"}
                            color={item.categoryId ? "white" : "dimmed"}
                            lineClamp={1}
                            sx={(theme) => ({
                                backgroundColor:
                                    item.category !== "" ? strToColor(item.category, theme.colorScheme) : "inherit",
                                paddingInline: "4px",
                                borderRadius: "5px"
                            })}
                        >
                            {item.category}
                        </Text>
                    )}
                </Group>
            </Collapse>
        </Box>
    );
}

function OpeImportList({
    items = [],
    selected = [],
    onSelect = null,
    onUnselect = null,
    onSelectAll = null,
    onUnselectAll = null,
    disabled = false
}) {
    const app = useContext(AppContext);

    const minDate = dayjs(items.sort((a, b) => (a.date > b.date ? 1 : -1))[0].date).toDate();
    const maxDate = dayjs(items.sort((a, b) => (a.date > b.date ? 1 : -1)).at(-1).date).toDate();

    const [rangeDate, setRangeDate] = useState([minDate, maxDate]);

    useEffect(() => {
        selected.map((id) => {
            const item = items.find((item) => item.id === id);
            if (item.date < rangeDate[0] || item.date > rangeDate[1]) {
                if (onUnselect) onUnselect(item);
            }
        });
    }, [rangeDate]);

    return (
        <>
            <Group position="apart" spacing="xs" my={"xs"}>
                <Group position={"left"}>
                    <Text size={"xs"} color={"dimmed"} align={"left"} lineClamp={1}>{`${items.length} opération${
                        items.length > 1 ? "s" : ""
                    }`}</Text>
                    {items.length > 0 && (
                        <DateRangePicker
                            value={rangeDate}
                            onChange={setRangeDate}
                            size={"xs"}
                            locale={packagejson.i18n.defaultLocale}
                            inputFormat={getDatePattern(packagejson.i18n.defaultLocale, false)}
                            clearable={false}
                            minDate={minDate}
                            maxDate={maxDate}
                            rightSection={<IconBackspace size={14} onClick={() => setRangeDate([minDate, maxDate])} />}
                            disabled={disabled}
                        />
                    )}
                </Group>
                {onSelectAll && onUnselectAll && !disabled && (
                    <Group position={"right"} spacing={"md"}>
                        <Group position="left" spacing={6}>
                            <IconCheckbox size={16} />
                            <Text
                                size={"xs"}
                                variant="link"
                                lineClamp={1}
                                style={{ cursor: "pointer" }}
                                onClick={onSelectAll}
                            >
                                Tout sélectionner
                            </Text>
                        </Group>
                        <Group position="left" spacing={6}>
                            <IconSquare size={16} />
                            <Text
                                size={"xs"}
                                variant="link"
                                lineClamp={1}
                                style={{ cursor: "pointer" }}
                                onClick={onUnselectAll}
                            >
                                Tout désélectionner ({selected.length})
                            </Text>
                        </Group>
                    </Group>
                )}
            </Group>
            <ScrollArea
                style={{
                    height: "500px",
                    minWidth: "300px",
                    border: `1px solid ${
                        app.theme.colorScheme === "dark" ? app.theme.colors.gray[8] : app.theme.colors.gray[2]
                    }`,
                    borderRadius: "5px"
                }}
                type="auto"
            >
                {items
                    .filter((item) => item.date >= rangeDate[0] && item.date <= rangeDate[1])
                    .sort((a, b) => (a.id > b.id ? -1 : 1))
                    .sort((a, b) => (a.date > b.date ? -1 : 1))
                    .map((item) => {
                        return (
                            <OpeImportItem
                                key={item.id}
                                item={item}
                                selected={selected.includes(item.id)}
                                onSelect={onSelect}
                                onUnselect={onUnselect}
                                disabled={disabled}
                            />
                        );
                    })}
            </ScrollArea>
        </>
    );
}

export default OpeImportList;
