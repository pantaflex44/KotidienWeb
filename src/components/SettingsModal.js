import React, { useContext, useEffect, useState } from "react";

import { Button, Divider, Grid, Group, Modal, Stack, Switch, Tabs, TextInput, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Icon123, IconArrowsDownUp, IconColumns, IconListDetails, IconX } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import { showNotification } from "@mantine/notifications";

function SettingsModal({
    settings = {
        views_showResumeBox: false,
        views_extendOperations: false,
        csv_separators_columns: ";",
        csv_separators_decimals: ","
    },
    visible = false,
    initialValue = false,
    onChange = null,
    onClose = null
}) {
    const app = useContext(AppContext);
    const [opened, setOpened] = useState(initialValue);

    const propsForm = useForm({
        initialValues: {
            views_showResumeBox: settings.views_showResumeBox,
            views_extendOperations: settings.views_extendOperations,
            csv_separators_columns: settings.csv_separators_columns,
            csv_separators_decimals: settings.csv_separators_decimals
        },
        validate: (values) => {
            return {};
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
                        csv_separators_decimals: propsForm.values.csv_separators_decimals
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
                            Liste des opérations
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="impexp" py="md">
                        <Stack spacing={"md"} mb={"md"}>
                            <Title order={5}>Format CSV</Title>
                            <TextInput
                                placeholder=""
                                label="Séparateur de colones"
                                description="Les fichiers CSV utilisent un caractère spécial pour reconnaitre les colones de données."
                                icon={<IconColumns size={14} />}
                                {...propsForm.getInputProps("csv_separators_columns")}
                            />
                            <TextInput
                                placeholder=""
                                label="Séparateur des décimales"
                                description="Caractère séparateur de décimales pour les nombres à virgule."
                                icon={<Icon123 size={14} />}
                                {...propsForm.getInputProps("csv_separators_decimals")}
                            />
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="opelist" py="md">
                        <Stack spacing={"md"} mb={"md"}>
                            <Switch
                                label={"Afficher la boite de résumé"}
                                {...propsForm.getInputProps("views_showResumeBox", { type: "checkbox" })}
                            />
                            <Switch
                                label={"Par défaut, étendre toutes les opérations"}
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
