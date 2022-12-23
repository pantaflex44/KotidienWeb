import React, { useContext, useEffect, useState } from "react";

import { Button, Group, Modal, Stack } from "@mantine/core";
import { IconSquarePlus } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import ItemsList from "./ItemsList";


function PaytypesModal({ paytypes = [], visible = false, initialValue = false, onChange = null, onClose = null }) {
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
            title={"Les moyens de paiements"}
            size={"md"}
        >
            <Stack>
                <ItemsList
                    value={paytypes}
                    onChange={onChange}
                    useColors={false}
                    translate={{
                        newItem: "Nouveau moyen de paiement",
                        deleteAllItems: "Voulez-vous supprimer tous les moyens de paiements ?",
                        addItem: "Ajouter un moyen de paiements",
                        newHelp: (
                            <>
                                Cliquez sur <IconSquarePlus size={14} /> pour ajouter un moyen de paiement.
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

export default PaytypesModal;
