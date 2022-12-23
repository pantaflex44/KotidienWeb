import React, { useContext, useEffect, useState } from "react";

import { Button, Group, Modal, Stack } from "@mantine/core";
import { IconSquarePlus } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import ItemsList from "./ItemsList";

function ThirdpartiesModal({ thirdparties = [], visible = false, initialValue = false, onChange = null, onClose = null }) {
    const app = useContext(AppContext);
    const [opened, setOpened] = useState(initialValue);

    useEffect(() => {
        setOpened(visible);
    }, [visible]);

    useEffect(() => {
        if (onClose && !opened) onClose();
    }, [opened]);

    return (
        <Modal
            opened={opened}
            overlayColor={app.theme.colorScheme === "dark" ? app.theme.colors.dark[9] : app.theme.colors.gray[2]}
            overlayOpacity={0.55}
            overlayBlur={3}
            closeButtonLabel={"Annuler"}
            onClose={() => setOpened(false)}
            title={"Les tiers récurrents"}
            size={"md"}
        >
            <Stack>
                <ItemsList
                    value={thirdparties}
                    onChange={onChange}
                    useColors={false}
                    translate={{
                        newItem: "Nouveau tiers",
                        deleteAllItems: "Voulez-vous supprimer tous les tiers ?",
                        addItem: "Ajouter un tiers",
                        newHelp: (
                            <>
                                Cliquez sur <IconSquarePlus size={14} /> pour ajouter un tiers.
                            </>
                        )
                    }}
                />
                <Group position={"right"}>
                    <Button onClick={() => setOpened(false)}>Fermer</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default ThirdpartiesModal;
