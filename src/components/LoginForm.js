import packagejson from "../../package.json";

import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Paper, Title, Text, Stack, TextInput, PasswordInput, Group, Button, Loader, Checkbox } from "@mantine/core";
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

        login({ email: values.email, password: values.password })
            .then((response) => {
                const { metas, errorCode, errorMessage } = response;

                if (metas === null || errorCode !== 0) {
                    if (errorCode === 404 || errorCode === 401) {
                        loginForm.setFieldError("email", errorMessage);
                    }

                    showNotification({
                        id: "login-error-notification",
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Connexion impossible à votre portefeuille!",
                        message: errorMessage,
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });

                    return;
                }

                if (values.saveIdents) {
                    localStorage.setItem("credentials_email", values.email);
                    localStorage.setItem("credentials_password", values.password);
                } else {
                    localStorage.removeItem("credentials_email");
                    localStorage.removeItem("credentials_password");
                }

                app.connect(decryptData(metas));
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <Paper withBorder={true} p={"md"}>
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
                        <Checkbox
                            label="Conserver mes identifiants sur cet appareil."
                            {...loginForm.getInputProps("saveIdents", { type: "checkbox" })}
                        />
                        <Group position="right" mt="md">
                            <Button type="submit">Connexion</Button>
                        </Group>
                    </Stack>
                </form>
            )}
        </Paper>
    );
}

export default LoginForm;
