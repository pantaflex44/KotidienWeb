import packagejson from "../../package.json";

import React, { createRef, memo, useContext, useEffect, useMemo } from "react";

import { Box, Divider, Group, Stack, Text, Tooltip } from "@mantine/core";

import { IconArrowMoveRight, IconReceipt, IconSquare, IconSquareCheck } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import Currency from "./Currency";

import { strToColor } from "../../tools";

function OpeListItem({ item, isSelected = false, onSelect = null, onUnselect = null }) {
    const app = useContext(AppContext);
    const itemRef = createRef();

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

    const itemThirdparty = useMemo(
        () =>
            item.type === "operation"
                ? getThirdparty(item.thirdpartyId)?.name || "-"
                : item.type === "transfer"
                ? getWalletItem(item.amount > 0 ? item.toWalletItemId : item.fromWalletItemId)?.name || "-"
                : "-",
        [item.type]
    );
    const formattedThirdparty = useMemo(
        () =>
            `${
                item.amount < 0
                    ? item.type === "transfer"
                        ? "Transfert vers "
                        : "Paiement à "
                    : item.amount > 0
                    ? "Reçu de  "
                    : ""
            }${itemThirdparty}`,
        [item.amount, item.type, itemThirdparty]
    );

    const itemCategory = useMemo(() => getCategory(item.categoryId)?.name || "", [item.categoryId]);
    const coloredItemCategory = useMemo(
        () => strToColor(itemCategory, app.theme.colorScheme),
        [itemCategory, app.theme.colorScheme]
    );

    const itemPaytype = useMemo(() => getPaytype(item.paytypeId)?.name || "", [item.paytypeId]);

    const toggleSelection = () => {
        const withCtrl = window && window.event.ctrlKey;

        if (isSelected && onUnselect) {
            onUnselect(withCtrl ? [item.id] : item.id);
        }
        if (!isSelected && onSelect) {
            onSelect(withCtrl ? [item.id] : item.id);
        }
    };

    useEffect(() => {
        if (isSelected) {
            const isInViewport = function (elem) {
                const bounding = elem.getBoundingClientRect();

                return (
                    bounding.top >= 140 &&
                    bounding.left >= 0 &&
                    bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) - 50 &&
                    bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
                );
            };

            if (!isInViewport(itemRef.current)) itemRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [isSelected]);

    return (
        <Box
            ref={itemRef}
            mt={0}
            py={0}
            key={item.id}
            style={{
                cursor: "pointer"
            }}
            sx={{
                "&:hover": {
                    backgroundColor: isSelected
                        ? app.theme.colorScheme === "dark"
                            ? app.theme.colors.brand[7]
                            : app.theme.colors.brand[3]
                        : app.theme.colorScheme === "dark"
                        ? app.theme.colors.gray[9]
                        : app.theme.colors.gray[0]
                },
                backgroundColor: isSelected
                    ? app.theme.colorScheme === "dark"
                        ? app.theme.colors.brand[7]
                        : app.theme.colors.brand[3]
                    : "inherit",
                color: isSelected ? "#fff" : "inherit"
            }}
            onClick={toggleSelection}
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
                            <Group spacing={"xs"} style={{ flexWrap: "nowrap" }}>
                                {item.type === "operation" && <IconReceipt size={16} stroke={2} color={"#339AF0"} />}
                                {item.type === "transfer" && (
                                    <IconArrowMoveRight size={16} stroke={2} color={"#339AF0"} />
                                )}
                                <Tooltip label={item.comment || "(aucun commentaire sur cette opération)"}>
                                    <Text size={"sm"} fw={500} lineClamp={1}>
                                        {item.title}
                                    </Text>
                                </Tooltip>
                            </Group>
                            <Group spacing={"xs"} style={{ flexWrap: "nowrap" }}>
                                <Tooltip label={item.state === 1 ? "Opération rapprochée" : "Opération non rapprochée"}>
                                    <Stack spacing={0}>
                                        {item.state === 1 ? (
                                            <IconSquareCheck
                                                size={16}
                                                stroke={2}
                                                color={app.theme.colors.yellow[7]}
                                                style={{ cursor: "pointer" }}
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
                                            />
                                        )}
                                    </Stack>
                                </Tooltip>

                                <Text size={"xs"} lineClamp={1}>
                                    {formattedThirdparty}
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
                            sx={{
                                backgroundColor: itemCategory !== "" ? coloredItemCategory : "inherit",
                                paddingInline: "4px",
                                borderRadius: "5px"
                            }}
                            mt={2}
                        >
                            {itemCategory}
                        </Text>
                        <Text size={"xs"} color={"dimmed"} lineClamp={1} align={"right"} mt={2}>
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

            <Divider variant={"dotted"} spacing={0} />
        </Box>
    );
}

export default memo(
    OpeListItem,
    (p, n) => JSON.stringify(p.item) === JSON.stringify(n.item) && p.isSelected === n.isSelected
);
