import packagejson from "../../package.json";

import React, { useContext, useEffect } from "react";
import { Container, Grid, Text } from "@mantine/core";

import { AppContext } from "../components/AppProvider";

import Metas from "../components/Metas";
import LoginForm from "../components/LoginForm";
import PreRegisterForm from "../components/PreRegisterForm";
import Dashboard from "../components/Dashboard";

const Home = () => {
    const app = useContext(AppContext);

    useEffect(() => {
        if (!app.wallet) {
            app.setNavbarContent({
                header: (
                    <Text fw={500} size={"md"} mb={"sm"}>
                        Bienvenue dans votre application {packagejson.name.trim().capitalize()}.
                    </Text>
                ),
                content: (
                    <>
                        <Text size={"sm"} mb={"sm"}>
                            {packagejson.name.trim().capitalize()}, propose de vous aider dans la gestion de vos
                            finances personnelles. Sans prétentions, elle permet d'enregistrer vos transactions, tenir
                            vos soldes à jour, et automatiser certaines taches dans le but de simplifier et fiabiliser
                            la tenue de vos finances.
                        </Text>
                        <Text size={"sm"} mb={"sm"}>
                            Accessible depuis n'importe quel appareil connecté à Internet, compatible du mobile à
                            l'ordinateur de bureau, vous n'aurez plus aucune excuse pour ne pas tenir, d'une main de
                            fer, l'état de vos éléments financiers.
                        </Text>
                    </>
                )
            });
        }
    }, [app]);

    return (
        <Metas title={app.wallet?.name || "Bienvenue"}>
            {!app.wallet ? (
                <Container
                    size={"md"}
                    mt={{ base: "xs", sm: "lg" }}
                    ml={{ base: "auto", sm: "lg" }}
                    mr={{ base: "auto", sm: "lg" }}
                    pl={0}
                    pr={0}
                >
                    <Grid grow={true} gutter={"xl"}>
                        <Grid.Col sm={1} lg={2} order={2} orderSm={1}>
                            <PreRegisterForm />
                        </Grid.Col>
                        <Grid.Col sm={1} lg={2} order={1} orderSm={2}>
                            <LoginForm />
                        </Grid.Col>
                    </Grid>
                </Container>
            ) : (
                <Dashboard />
            )}
        </Metas>
    );
};

export default Home;
