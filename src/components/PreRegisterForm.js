import packagejson from "../../package.json";

import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Paper, Title, Text, Stack, TextInput, Group, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { completeNavigationProgress, resetNavigationProgress, startNavigationProgress } from "@mantine/nprogress";
import { IconArrowRight, IconAt, IconUserPlus } from "@tabler/icons";

import { AppContext } from "./AppProvider";

import { exists  } from "../wrappers/wallet_api";

function PreRegisterForm({ defaultEmail = null }) {
    const app = useContext(AppContext);
    const navigate = useNavigate();

    const registerForm = useForm({
        initialValues: {
            email: defaultEmail ?? "",
            emailConfirm: ""
        },
        validate: {
            email: (value) =>
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value) ? null : "Adresse email invalide!",
            emailConfirm: (value, values) =>
                value !== values.email ? "Confirmation de l'adresse email incorrecte!" : null
        }
    });

    const submitRegisterForm = async (values) => {
        resetNavigationProgress();
        startNavigationProgress();
        try {
            const walletFound = await exists(values.email);
            if (walletFound) {
                registerForm.setFieldError("email", "Un portefeuille existe déjà avec cet identifiant!");
            } else {
                navigate(`/register/${encodeURIComponent(values.email)}/`);
            }
        } catch (err) {
        } finally {
            completeNavigationProgress();
        }
    };

    return (
        <Paper withBorder={true} p={"md"}>
            <Group spacing="xs" mb={"xs"}>
                <IconUserPlus size={22} />
                <Title order={3}>Je n'ai pas de compte</Title>
            </Group>
            <Text size={"sm"}>
                Vous souhaitez découvrir nos services? Ou tout simplement ouvrir un nouveau portefeuille? Rien de plus
                rapide! Renseignez les informations demandées dans le formulaire ci-dessous.
            </Text>
            <Text size={"sm"}>Notre assitant vous guidera tout au long des étapes de l'inscription.</Text>

            <form onSubmit={registerForm.onSubmit(submitRegisterForm)}>
                <Stack spacing={"md"} mt={"xl"}>
                    <TextInput
                        placeholder=""
                        label="Nouvel identifiant"
                        description="Votre identifiant doit être une adresse email unique, valide, et inconnue de nos services."
                        withAsterisk={true}
                        icon={<IconAt size={14} />}
                        {...registerForm.getInputProps("email")}
                    />
                    <TextInput
                        placeholder=""
                        label="Confirmation"
                        description="Confirmez votre identifiant."
                        withAsterisk={true}
                        icon={<IconAt size={14} />}
                        {...registerForm.getInputProps("emailConfirm")}
                    />
                    <Group position="right" mt="md">
                        <Button type="submit">
                            Suivant&nbsp;
                            <IconArrowRight size={14} />
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Paper>
    );
}

export default PreRegisterForm;
