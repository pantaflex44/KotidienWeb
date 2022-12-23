import React, { useContext, useEffect, useState } from "react";

import {
    Button,
    Divider,
    Group,
    Modal,
    PasswordInput,
    Space,
    Stack,
    Tabs,
    Text,
    Textarea,
    TextInput
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { IconCash, IconLock, IconPencil, IconSettings2, IconTextSize, IconX } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import WalletItems from "./WalletItems";
import { showNotification } from "@mantine/notifications";

function PropertiesModal({
    properties = { name: "", note: "", walletItems: [], password: "", oldPassword: "" },
    visible = false,
    initialValue = false,
    onChange = null,
    onClose = null
}) {
    const app = useContext(AppContext);
    const [opened, setOpened] = useState(initialValue);
    const [passwordIsVisible, passwordVisibility] = useDisclosure(false);

    const propsForm = useForm({
        initialValues: {
            oldPassword: "",
            password: "",
            passwordConfirm: "",
            name: properties.name,
            note: properties.note
        },
        validate: (values) => {
            return {
                password:
                    values.oldPassword.trim() === ""
                        ? null
                        : new RegExp(
                              "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\\!\\@\\#\\$\\%\\^\\&\\*\\)\\(\\+\\=\\.\\<\\>\\{\\}\\[\\]\\:\\;\\'\"\\|\\~\\`\\_\\-])(?=.{8,})"
                          ).test(values.password.trim())
                        ? null
                        : "Mot de passe incorrect!",
                passwordConfirm:
                    values.oldPassword.trim() === ""
                        ? null
                        : values.password === values.passwordConfirm.trim()
                        ? null
                        : "Confirmation incorrecte!",
                name: values.name.trim().length > 2 ? null : "Le nom doit contenir au moins 2 caractères."
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
                        ...properties,
                        name: propsForm.values.name,
                        note: propsForm.values.note,
                        oldPassword: propsForm.values.oldPassword,
                        password: propsForm.values.password
                    };
                    onChange(np);
                } else {
                    showNotification({
                        id: "properties-error-notification",
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Propriétés de votre portefeuille",
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
            title={"Propriétés du portefeuille"}
            size={"lg"}
        >
            <Stack>
                <Tabs defaultValue="properties">
                    <Tabs.List>
                        <Tabs.Tab value="properties" icon={<IconSettings2 size={14} />}>
                            Propriétés
                        </Tabs.Tab>
                        <Tabs.Tab value="password" icon={<IconLock size={14} />}>
                            Sécurité
                        </Tabs.Tab>
                        <Tabs.Tab value="walletItems" icon={<IconCash size={14} />}>
                            Eléments financiers
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="properties" py="md">
                        <Stack spacing={"md"} mb={"md"}>
                            <TextInput
                                placeholder=""
                                label="Dénomination"
                                description="Renommez votre portefeuille pour mieux l'identifier."
                                withAsterisk={true}
                                icon={<IconTextSize size={14} />}
                                {...propsForm.getInputProps("name")}
                            />
                            <Textarea
                                placeholder=""
                                label="Notes"
                                description="Quelques informations utiles, des notes importantes, etc."
                                icon={<IconPencil size={14} />}
                                autosize={true}
                                minRows={4}
                                maxRows={12}
                                {...propsForm.getInputProps("note")}
                            />
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="password" py="xl">
                        <Stack spacing={"md"} mb={"md"}>
                            <Text size={"xs"}>
                                Pour rappel, votre mot de passe permet de sécuriser les informations de votre compte. Il
                                est unique et seulement connu par vous même. Nous ne pourrons en aucun cas vous le
                                redonner. Ne le perdez pas!
                            </Text>
                            <Text size={"sm"}>Entrez votre mot de passe actuel pour le redéfinir.</Text>
                            <PasswordInput
                                placeholder=""
                                label="Mot de passe actuel"
                                withAsterisk={false}
                                icon={<IconLock size={14} />}
                                visible={passwordIsVisible}
                                onVisibilityChange={passwordVisibility.toggle}
                                {...propsForm.getInputProps("oldPassword")}
                            />
                            {propsForm.values.oldPassword.trim() !== "" && (
                                <>
                                    <PasswordInput
                                        placeholder=""
                                        label="Nouveau mot de passe"
                                        description="Votre mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 carractère spécial."
                                        withAsterisk={true}
                                        icon={<IconLock size={14} />}
                                        visible={passwordIsVisible}
                                        onVisibilityChange={passwordVisibility.toggle}
                                        {...propsForm.getInputProps("password")}
                                    />
                                    <PasswordInput
                                        placeholder=""
                                        label="Confirmation"
                                        description="Confirmez votre nouveau mot de passe"
                                        withAsterisk={true}
                                        icon={<IconLock size={14} />}
                                        visible={passwordIsVisible}
                                        onVisibilityChange={passwordVisibility.toggle}
                                        {...propsForm.getInputProps("passwordConfirm")}
                                    />
                                </>
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="walletItems" py="xl">
                        <WalletItems
                            value={properties.walletItems}
                            onChange={(newWalletItems) => {
                                if (JSON.stringify(newWalletItems) !== JSON.stringify(properties.walletItems)) {
                                    const np = { ...properties, walletItems: newWalletItems };
                                    if (onChange) onChange(np);
                                }
                            }}
                        />
                    </Tabs.Panel>
                </Tabs>
                
                <Group position={"right"}>
                    <Button onClick={() => setOpened(false)}>Fermer</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default PropertiesModal;
