import packagejson from "../../package.json";

import React, { useContext, useEffect, useState } from "react";

import { Anchor, Button, Group, Image, Modal, Space, Stack, Text, Title } from "@mantine/core";
import { IconListDetails } from "@tabler/icons";

import { AppContext } from "./AppProvider";

function AboutModal({ visible = false, initialValue = false, onClose = null }) {
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
            title={"A propos de..."}
            size={"md"}
        >
            <Stack spacing={"md"}>
                <Image
                    src={"./icons/kotidien.svg"}
                    alt={packagejson.name.trim().capitalize()}
                    withPlaceholder={true}
                    caption={"(version web)"}
                />
                <Group position={"center"} spacing={"xs"}>
                    <Title order={2}>{packagejson.name.trim().capitalize()}</Title>
                    <Text size={"xs"}>v{packagejson.version}</Text>
                </Group>
                <Text size={"md"} align={"center"}>
                    {packagejson.description.trim()}
                </Text>

                <Stack spacing={0}>
                    <Text size={"xs"} align={"center"}>
                        Copyright (c)2022-2023 {packagejson.author.name}
                    </Text>
                    <Anchor
                        href="https://fr.wikipedia.org/wiki/Licence_MIT"
                        target={"_blank"}
                        rel={"noreferer"}
                        size={"xs"}
                        align={"center"}
                    >
                        Licence {packagejson.license}
                    </Anchor>
                </Stack>

                <Anchor
                    href="https://github.com/pantaflex44/KotidienWeb"
                    target={"_blank"}
                    rel={"noreferer"}
                    align={"center"}
                    fw={500}
                >
                    Sources du projet
                </Anchor>

                <Space h={"md"} />
                <Group position={"right"}>
                    <Button onClick={() => setOpened(false)}>Fermer</Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default AboutModal;
