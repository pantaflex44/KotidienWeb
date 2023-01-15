import packagejson from "../../package.json";
import dayjs from "dayjs";

import React, { useContext, useState, useLayoutEffect, useEffect } from "react";

import { Accordion, Divider, Grid, MediaQuery, Paper, Stack, Text } from "@mantine/core";

import { IconAlertTriangle } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import Currency from "./Currency";

import { getLongDayDatePattern, getLongMonthYearPattern } from "../../tools";

function WalletResumeBox({ item }) {
    const app = useContext(AppContext);

    const [defaultPanel, setDefaultPanel] = useState("amountResume");

    useLayoutEffect(() => {
        setDefaultPanel(localStorage.getItem(`${item.id}_resumebox_panel`) || "amountResume");
    }, [item]);

    useLayoutEffect(() => {
        if (app.rgpdAgreed()) localStorage.setItem(`${item.id}_resumebox_panel`, defaultPanel);
    }, [item, defaultPanel]);

    return (
        (app.wallet.params.views === undefined || app.wallet.params.views?.showResumeBox === true) && (
            <Paper withBorder={true} shadow={0} p={0}>
                <Accordion
                    value={defaultPanel}
                    onChange={(v) => setDefaultPanel(v)}
                    variant="filled"
                    chevronPosition="left"
                >
                    <Accordion.Item value="amountResume">
                        <Accordion.Control
                            icon={
                                item.initialAmount + (app.amounts.today[item.id] || 0.0) < -item.overdraft ||
                                item.initialAmount + (app.amounts.endMonth[item.id] || 0.0) < -item.overdraft ? (
                                    <IconAlertTriangle color={"red"} size={18} />
                                ) : null
                            }
                            p={"xs"}
                        >
                            <Text
                                size={"xs"}
                                fw={500}
                                color={
                                    item.initialAmount + (app.amounts.today[item.id] || 0.0) < -item.overdraft ||
                                    item.initialAmount + (app.amounts.endMonth[item.id] || 0.0) < -item.overdraft
                                        ? "red.8"
                                        : null
                                }
                            >
                                Soldes prévisionnels
                            </Text>
                        </Accordion.Control>
                        <Accordion.Panel>
                            <Grid grow={true} align={"center"} gutter={5}>
                                <Grid.Col sm={1} xs={5}>
                                    <Divider
                                        my="xs"
                                        label={dayjs()
                                            .locale(packagejson.i18n.defaultLocale)
                                            .format(getLongDayDatePattern(packagejson.i18n.defaultLocale, true))}
                                        labelPosition="center"
                                    />
                                </Grid.Col>
                                <Grid.Col sm={1} xs={5}>
                                    <Paper
                                        withBorder={true}
                                        shadow={0}
                                        py={"xs"}
                                        px={"xl"}
                                        sx={(theme) =>
                                            item.initialAmount + (app.amounts.today[item.id] || 0.0) < -item.overdraft
                                                ? { borderColor: "red" }
                                                : {}
                                        }
                                    >
                                        <Stack spacing={0} align={"center"}>
                                            <Text size={"sm"}>Aujourd'hui</Text>
                                            <Currency
                                                amount={item.initialAmount + (app.amounts.today[item.id] || 0.0)}
                                                currency={item.currency}
                                                size={"xl"}
                                                fw={500}
                                            />
                                        </Stack>
                                    </Paper>
                                </Grid.Col>
                                <MediaQuery smallerThan="lg" styles={{ display: "none" }}>
                                    <Grid.Col sm={1} xs={5}>
                                        <Divider
                                            my="xs"
                                            label={
                                                item.initialAmount + (app.amounts.today[item.id] || 0.0) <
                                                    -item.overdraft ||
                                                item.initialAmount + (app.amounts.endMonth[item.id] || 0.0) <
                                                    -item.overdraft
                                                    ? "autorisation de découvert dépassée ce mois ci"
                                                    : null
                                            }
                                            labelPosition={"center"}
                                            labelProps={{ color: "red.8", style: { textAlign: "center" } }}
                                        />
                                    </Grid.Col>
                                </MediaQuery>
                                <Grid.Col sm={1} xs={5}>
                                    <Paper
                                        withBorder={true}
                                        shadow={0}
                                        py={"xs"}
                                        px={"xl"}
                                        sx={(theme) =>
                                            item.initialAmount + (app.amounts.endMonth[item.id] || 0.0) <
                                            -item.overdraft
                                                ? { borderColor: "red" }
                                                : {}
                                        }
                                    >
                                        <Stack spacing={0} align={"center"}>
                                            <Text size={"sm"}>Fin du mois</Text>
                                            <Currency
                                                amount={item.initialAmount + (app.amounts.endMonth[item.id] || 0.0)}
                                                currency={item.currency}
                                                size={"xl"}
                                                fw={500}
                                            />
                                        </Stack>
                                    </Paper>
                                </Grid.Col>
                                <Grid.Col sm={1} xs={5}>
                                    <Divider
                                        my="xs"
                                        label={dayjs()
                                            .locale(packagejson.i18n.defaultLocale)
                                            .format(getLongMonthYearPattern(packagejson.i18n.defaultLocale, true))}
                                        labelPosition="center"
                                    />
                                </Grid.Col>
                            </Grid>
                        </Accordion.Panel>
                    </Accordion.Item>
                </Accordion>
            </Paper>
        )
    );
}

export default WalletResumeBox;
