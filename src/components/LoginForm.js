import packagejson from "../../package.json";

import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    Paper,
    Title,
    Text,
    Stack,
    TextInput,
    PasswordInput,
    Group,
    Button,
    Loader,
    Checkbox,
    Anchor,
    SegmentedControl
} from "@mantine/core";
import { IconAt, IconEyeCheck, IconEyeOff, IconLock, IconLogin, IconShieldLock, IconX } from "@tabler/icons";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useLocalStorage } from "@mantine/hooks";

import { AppContext } from "./AppProvider";
import { login } from "../wrappers/wallet_api";
import { decryptData } from "../../tools";

function LoginForm() {
    const app = useContext(AppContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [rgpdChoice, setRgpdChoice] = useState(localStorage.getItem("rgpd-agreed") || "");
    const storedCredentials = {
        email: localStorage.getItem("credentials_email") || "",
        password: localStorage.getItem("credentials_password") || ""
    };

    const loginForm = useForm({
        initialValues: {
            email: storedCredentials.email ?? "",
            password: storedCredentials.password ?? "",
            saveIdents: storedCredentials.email && storedCredentials.password
        },
        validate: {
            email: (value) =>
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value)
                    ? null
                    : "Un identifiant valide est requis!",
            password: (value) => (value.trim() < 1 ? "Le mot de passe est requis!" : null)
        }
    });

    const submitLoginForm = (values) => {
        setLoading(true);

        app.connect(values.email, values.password, values.saveIdents)
            .then((newWallet) => {})
            .catch(({ errorCode, errorMessage }) => {
                if (errorCode === 404 || errorCode === 401) {
                    loginForm.setFieldError("email", errorMessage);
                }
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Paper
            withBorder={true}
            p={"md"}
            sx={(theme) => ({
                backgroundColor: app.theme.colorScheme === "dark" ? app.theme.colors.dark[8] : app.theme.colors.gray[0]
            })}
        >
            <Group spacing="xs" mb={"xs"}>
                <IconShieldLock size={22} />
                <Title order={3}>Je me connecte</Title>
            </Group>
            <Text size={"sm"}>
                Entrez votre identifiant et le mot de passe associé pour ouvrir votre portefeuille financier.
            </Text>
            {loading ? (
                <Group position={"center"} spacing={"xs"} my={"xl"}>
                    <Loader size={"sm"} variant={"bars"} />
                    <Text size={"sm"} fw={500}>
                        Connexion en cours...
                    </Text>
                </Group>
            ) : (
                <form onSubmit={loginForm.onSubmit(submitLoginForm)}>
                    <Stack spacing={"md"} mt={"xl"}>
                        <TextInput
                            placeholder=""
                            label="Identifiant"
                            withAsterisk={false}
                            icon={<IconAt size={14} />}
                            autoFocus={true}
                            {...loginForm.getInputProps("email")}
                        />
                        <PasswordInput
                            placeholder=""
                            label="Mot de passe"
                            withAsterisk={false}
                            visibilityToggleIcon={({ reveal, size }) =>
                                reveal ? <IconEyeOff size={size} /> : <IconEyeCheck size={size} />
                            }
                            icon={<IconLock size={14} />}
                            {...loginForm.getInputProps("password")}
                        />
                        {app.rgpdAgreed() && (
                            <Checkbox
                                label="Conserver mes identifiants sur cet appareil."
                                {...loginForm.getInputProps("saveIdents", { type: "checkbox" })}
                            />
                        )}
                        <Text size={"xs"} color={"dimmed"}>
                            {packagejson.name.trim().toLowerCase().capitalize()} utilise un espace de stockage sur votre
                            ordinateur pour améliorer son ergonomie. Dans le cadre{" "}
                            <Anchor
                                href="https://www.cnil.fr/fr/reglement-europeen-protection-donnees"
                                target={"_blank"}
                            >
                                des lois RGPD surveillées par la CNIL
                            </Anchor>{" "}
                            vous devez y consentir pour en profiter. Toutefois, ces fonctionnalités n'entachent en rien
                            le bon fonctionnement de l'application.
                        </Text>
                        <SegmentedControl
                            data={[
                                { label: "Je ne sais pas", value: "" },
                                { label: "Je refuse", value: "false" },
                                { label: "J'accepte", value: "true" }
                            ]}
                            value={rgpdChoice}
                            onChange={(value) => {
                                setRgpdChoice(() => {
                                    if (value !== "true") localStorage.clear();
                                    if (value !== "") localStorage.setItem("rgpd-agreed", value);
                                    return value;
                                });
                            }}
                        />
                        <Group position="right" mt="md">
                            <Button type="submit" disabled={rgpdChoice === ""}>
                                Connexion
                            </Button>
                        </Group>
                    </Stack>
                </form>
            )}
        </Paper>
    );
}

export default LoginForm;
