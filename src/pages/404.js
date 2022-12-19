import React from "react";
import { Container, Paper, Title, Text, Center, Box, Anchor } from "@mantine/core";
import { IconMoodSmileBeam, IconArrowLeft } from "@tabler/icons";

import Metas from "../components/Metas";

const Error404 = () => {
    return (
        <Metas title={"Oups! Face à la mer..."}>
            <Container size={"xs"} mt={"lg"}>
                <Paper shadow="xs" p="md">
                    <Title order={1} mb={"md"}>
                        Error 404
                    </Title>
                    <Text>
                        Hum, il semblerait que vous vous soyez perdu! Aucune issue en empruntant ce chemin{" "}
                        <IconMoodSmileBeam size={12} />
                    </Text>
                    <Center inline mt={"md"}>
                        <IconArrowLeft size={14} />
                        <Box ml={5}>
                            <Anchor href="/">Retour à l'accueil</Anchor>
                        </Box>
                    </Center>
                </Paper>
            </Container>
        </Metas>
    );
};

export default Error404;
