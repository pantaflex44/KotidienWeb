import packagejson from "../../package.json";

import React, { useContext, useEffect, useState } from "react";

import {
    Button,
    Collapse,
    Divider,
    Grid,
    Group,
    Modal,
    Select,
    Stack,
    Switch,
    Tabs,
    Text,
    TextInput,
    Title
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
    Icon123,
    IconArrowsDownUp,
    IconCalendarMinus,
    IconCalendarStats,
    IconColumns,
    IconListDetails,
    IconX
} from "@tabler/icons";

import { AppContext } from "./AppProvider";
import { showNotification } from "@mantine/notifications";
import dayjs from "dayjs";

function SettingsModal({
    settings = {
        views_showResumeBox: false,
        views_extendOperations: false,
        views_walletTab: "calendar",
        csv_separators_columns: ";",
        csv_separators_decimals: ",",
        csv_dateformat: "DD/MM/YYYY"
    },
    visible = false,
    initialValue = false,
    onChange = null,
    onClose = null
}) {
    const app = useContext(AppContext);
    const [opened, setOpened] = useState(initialValue);
    const [csvDateformatDocopened, setCsvDateformatDocopened] = useState(false);

    const propsForm = useForm({
        initialValues: {
            views_showResumeBox: settings.views_showResumeBox,
            views_extendOperations: settings.views_extendOperations,
            views_walletTab: settings.views_walletTab,
            csv_separators_columns: settings.csv_separators_columns,
            csv_separators_decimals: settings.csv_separators_decimals,
            csv_dateformat: settings.csv_dateformat
        },
        validate: (values) => {
            return {
                csv_separators_columns:
                    values.csv_separators_columns.trim().length === 1
                        ? null
                        : "Le séparateur de colones doit contenir 1 caractère.",
                csv_separators_decimals:
                    values.csv_separators_decimals.trim().length === 1
                        ? null
                        : "Le séparateur des décimales doit contenir 1 caractère.",
                csv_dateformat: values.csv_dateformat.trim().length > 0 ? null : "Format de la date incorrect."
            };
        }
    });

    useEffect(() => {
        setOpened(visible);
    }, [visible]);

    useEffect(() => {
        if (!opened) {
            if (propsForm.isTouched() && onChange) {
                propsForm.validate();

                if (propsForm.isValid()) {
                    const np = {
                        ...settings,
                        views_showResumeBox: propsForm.values.views_showResumeBox,
                        views_extendOperations: propsForm.values.views_extendOperations,
                        csv_separators_columns: propsForm.values.csv_separators_columns,
                        csv_separators_decimals: propsForm.values.csv_separators_decimals,
                        csv_dateformat: propsForm.values.csv_dateformat,
                        views_walletTab: propsForm.values.views_walletTab
                    };

                    onChange(np);
                } else {
                    showNotification({
                        id: "settings-error-notification",
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Paramètres généraux",
                        message: "Une erreur a été détectée dans le formulaire.",
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });

                    setOpened(true);
                    return;
                }
            }

            if (onClose) onClose();
        }
    }, [opened]);

    return (
        <Modal
            opened={opened}
            overlayColor={app.theme.colorScheme === "dark" ? app.theme.colors.dark[9] : app.theme.colors.gray[2]}
            overlayOpacity={0.55}
            overlayBlur={3}
            closeButtonLabel={"Annuler"}
            onClose={() => setOpened(false)}
            title={"Paramètres généraux"}
            size={"md"}
        >
            <Stack>
                <Tabs defaultValue="impexp">
                    <Tabs.List>
                        <Tabs.Tab value="impexp" icon={<IconArrowsDownUp size={14} />}>
                            Importation / Exportation
                        </Tabs.Tab>
                        <Tabs.Tab value="opelist" icon={<IconListDetails size={14} />}>
                            Ergonomie
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="impexp" py="md">
                        <Stack spacing={"md"} mb={"md"}>
                            <Title order={5}>Format CSV</Title>
                            <TextInput
                                placeholder=";"
                                label="Séparateur de colones"
                                description={
                                    <Group position={"apart"} style={{ flexWrap: "nowrap" }}>
                                        <Text lineClamp={1}>
                                            Les fichiers CSV utilisent un caractère spécial pour reconnaitre les colones
                                            de données.
                                        </Text>
                                        <Text
                                            align={"right"}
                                            variant={"link"}
                                            style={{ cursor: "pointer", minWidth: "50px" }}
                                            onClick={() =>
                                                propsForm.setValues((v) => ({
                                                    ...v,
                                                    csv_separators_columns: ";"
                                                }))
                                            }
                                        >
                                            défaut
                                        </Text>
                                    </Group>
                                }
                                icon={<IconColumns size={14} />}
                                {...propsForm.getInputProps("csv_separators_columns")}
                            />
                            <TextInput
                                placeholder=","
                                label="Séparateur des décimales"
                                description={
                                    <Group position={"apart"} style={{ flexWrap: "nowrap" }}>
                                        <Text lineClamp={1}>
                                            Caractère séparateur de décimales pour les nombres à virgule.
                                        </Text>
                                        <Text
                                            align={"right"}
                                            variant={"link"}
                                            style={{ cursor: "pointer", minWidth: "50px" }}
                                            onClick={() =>
                                                propsForm.setValues((v) => ({
                                                    ...v,
                                                    csv_separators_decimals: ","
                                                }))
                                            }
                                        >
                                            défaut
                                        </Text>
                                    </Group>
                                }
                                icon={<Icon123 size={14} />}
                                {...propsForm.getInputProps("csv_separators_decimals")}
                            />
                            <TextInput
                                placeholder="DD/MMM/YYYY"
                                label="Format de la date"
                                description={
                                    <Stack spacing={"xs"}>
                                        <Group position={"apart"} style={{ flexWrap: "nowrap" }}>
                                            <Text lineClamp={1}>
                                                eg:{" "}
                                                {dayjs()
                                                    .locale(packagejson.i18n.defaultLocale)
                                                    .format(propsForm.values["csv_dateformat"])}
                                            </Text>
                                            <Text
                                                align={"center"}
                                                variant={"link"}
                                                style={{ cursor: "pointer", minWidth: "90px" }}
                                                onClick={() => setCsvDateformatDocopened((old) => !old)}
                                            >
                                                documentation
                                            </Text>
                                            <Text
                                                align={"right"}
                                                variant={"link"}
                                                style={{ cursor: "pointer", minWidth: "50px" }}
                                                onClick={() =>
                                                    propsForm.setValues((v) => ({ ...v, csv_dateformat: "DD/MM/YYYY" }))
                                                }
                                            >
                                                défaut
                                            </Text>
                                        </Group>
                                        <Collapse in={csvDateformatDocopened} my={"xs"}>
                                            <Stack spacing={0}>
                                                <Group spacing={"xs"}>
                                                    <div style={{ width: "80px" }}>
                                                        <Text fw={500}>D</Text>
                                                    </div>
                                                    <Text size={"xs"}>(1-31) jour du mois</Text>
                                                </Group>
                                                <Group spacing={"xs"}>
                                                    <div style={{ width: "80px" }}>
                                                        <Text fw={500}>DD</Text>
                                                    </div>
                                                    <Text size={"xs"}>(01-31) jour du mois sur 2 chiffres</Text>
                                                </Group>
                                                <Group spacing={"xs"}>
                                                    <div style={{ width: "80px" }}>
                                                        <Text fw={500}>M</Text>
                                                    </div>
                                                    <Text size={"xs"}>(1-12) numéro du mois</Text>
                                                </Group>
                                                <Group spacing={"xs"}>
                                                    <div style={{ width: "80px" }}>
                                                        <Text fw={500}>MM</Text>
                                                    </div>
                                                    <Text size={"xs"}>(01-12) numéro du mois sur 2 chiffres</Text>
                                                </Group>
                                                <Group spacing={"xs"}>
                                                    <div style={{ width: "80px" }}>
                                                        <Text fw={500}>YY</Text>
                                                    </div>
                                                    <Text size={"xs"}>(22 / 23) année sur 2 chiffres</Text>
                                                </Group>
                                                <Group spacing={"xs"}>
                                                    <div style={{ width: "80px" }}>
                                                        <Text fw={500}>YYYY</Text>
                                                    </div>
                                                    <Text size={"xs"}>(2022 / 2023) année sur 4 chiffres</Text>
                                                </Group>
                                            </Stack>
                                        </Collapse>
                                    </Stack>
                                }
                                icon={<IconCalendarMinus size={14} />}
                                {...propsForm.getInputProps("csv_dateformat")}
                            />
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="opelist" py="md">
                        <Stack spacing={"md"} mb={"md"}>
                            <Title order={5}>Dispositions</Title>
                            <Select
                                label={"Onglet par défaut"}
                                description={"Paramètre pris en compte à votre prochaine connexion."}
                                data={[
                                    { value: "details", label: "Détails du compte" },
                                    { value: "calendar", label: "Calendrier" },
                                    { value: "planner", label: "Planification" }
                                ]}
                                clearable={false}
                                {...propsForm.getInputProps("views_walletTab")}
                            />
                            <Switch
                                mt={"xs"}
                                label={"Afficher la boite de résumé"}
                                description={"Soldes prévisionnels, etc."}
                                {...propsForm.getInputProps("views_showResumeBox", { type: "checkbox" })}
                            />
                            <Switch
                                label={"Par défaut, étendre toutes les opérations"}
                                description={"Paramètre pris en compte à votre prochaine connexion."}
                                {...propsForm.getInputProps("views_extendOperations", { type: "checkbox" })}
                            />
                        </Stack>
                    </Tabs.Panel>
                </Tabs>

                <Group position={"right"}>
                    <Button onClick={() => setOpened(false)}>Fermer</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default SettingsModal;
