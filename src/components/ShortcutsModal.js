import React, { useContext, useEffect, useState } from "react";

import { Button, Group, Kbd, Modal, Stack, Tabs, Text } from "@mantine/core";
import { IconListDetails } from "@tabler/icons";

import { AppContext } from "./AppProvider";

function ShortcutsModal({ visible = false, initialValue = false, onClose = null }) {
    const app = useContext(AppContext);
    const [opened, setOpened] = useState(initialValue);

    useEffect(() => {
        setOpened(visible);
    }, [visible]);

    useEffect(() => {
        if (!opened) {
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
            title={"Raccourcis claviers"}
            size={"lg"}
        >
            <Stack>
                <Tabs defaultValue="opelist">
                    <Tabs.List>
                        <Tabs.Tab value="opelist" icon={<IconListDetails size={14} />}>
                            Liste des opérations
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="opelist" py="md">
                        <Stack spacing={"md"} mb={"md"}>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>N</Kbd>
                                </div>
                                <Text size={"xs"}>Nouvelle opération</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>T</Kbd>
                                </div>
                                <Text size={"xs"}>Nouveau transfert entre comptes</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>F</Kbd>
                                </div>
                                <Text size={"xs"}>Afficher / Cacher les filtres</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>F5</Kbd>
                                </div>
                                <Text size={"xs"}>Rafraichir la liste des opérations</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Suppr</Kbd>
                                </div>
                                <Text size={"xs"}>Supprimer les opérations sélectionnées</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Entrée</Kbd>
                                </div>
                                <Text size={"xs"}>Modifier l'opération sélectionnée</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>A</Kbd>
                                </div>
                                <Text size={"xs"}>Tout sélectionner</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Echap</Kbd>
                                </div>
                                <Text size={"xs"}>Tout dé-sélectionner</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>↓</Kbd>
                                </div>
                                <Text size={"xs"}>Sélectionner l'opération suivante</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>↑</Kbd>
                                </div>
                                <Text size={"xs"}>Sélectionner l'opération précédente</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>←</Kbd>
                                </div>
                                <Text size={"xs"}>Sélectionner la première opération</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>→</Kbd>
                                </div>
                                <Text size={"xs"}>Sélectionner la dernière opération</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Ctrl</Kbd> + <Kbd>Clique gauche</Kbd>
                                </div>
                                <Text size={"xs"}>Sélectionner une ou plusieurs opérations simultanement</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>↓</Kbd>
                                </div>
                                <Text size={"xs"}>Tout développer</Text>
                            </Group>
                            <Group spacing={"xs"}>
                                <div style={{ width: "200px" }}>
                                    <Kbd>Ctrl</Kbd> + <Kbd>Alt</Kbd> + <Kbd>↑</Kbd>
                                </div>
                                <Text size={"xs"}>Tout refermer</Text>
                            </Group>
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

export default ShortcutsModal;
