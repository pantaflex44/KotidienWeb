import React, { memo, useContext, useEffect, useState } from "react";

import { Button, Group, Modal, Stack } from "@mantine/core";

import { AppContext } from "./AppProvider";
import CategoriesTree from "./CategoriesTree";

function CategoriesModal({ categories = [], visible = false, initialValue = false, onChange = null, onClose = null }) {
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
            title={"Catégoriser ses opérations financières"}
            size={"md"}
        >
            <Stack>
                <CategoriesTree value={categories} onChange={onChange} />
                <Group position={"right"}>
                    <Button onClick={() => setOpened(false)}>Fermer</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default memo(
    CategoriesModal,
    (p, n) => JSON.stringify(p.categories) === JSON.stringify(n.categories) && p.visible === n.visible
);
