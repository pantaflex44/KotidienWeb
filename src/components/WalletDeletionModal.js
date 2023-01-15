import React, { useContext, useEffect, useState } from "react";

import { Button, Divider, Group, Modal, PasswordInput, Stack, Text } from "@mantine/core";
import { IconLock } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import { closeAllModals, openModal } from "@mantine/modals";

function WalletDeletionModal({ visible = false, initialValue = false, onClose = null }) {
    const app = useContext(AppContext);
    const [opened, setOpened] = useState(initialValue);
    const [password, setPassword] = useState("");
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        setOpened(visible);
    }, [visible]);

    useEffect(() => {
        if (!opened) {
            if (onClose) onClose();
        }
    }, [opened]);

    const deleteWallet = () => {
        if (deleting) return;

        setDeleting(true);
        app.deleteCurrentWallet(password)
            .then(() => {
                openModal({
                    title: "Confirmation",
                    children: (
                        <>
                            <Text color={"red.9"}>Votre portefeuille est désormais parti aux oubliettes!</Text>
                            <Text>Nous vous souhaitons bonne continuation.</Text>
                            <Button fullWidth onClick={closeAllModals} mt="md">
                                Au revoir
                            </Button>
                        </>
                    ),
                    zIndex: 10000
                });
            })
            .finally(() => {
                setDeleting(false);
                setOpened(false);
            });
    };

    return (
        <Modal
            opened={opened}
            overlayColor={app.theme.colorScheme === "dark" ? app.theme.colors.dark[9] : app.theme.colors.gray[2]}
            overlayOpacity={0.55}
            overlayBlur={3}
            closeButtonLabel={"Annuler"}
            onClose={() => {
                if (!deleting) setOpened(false);
            }}
            title={"Supprimer mon portefeuille"}
            size={"md"}
        >
            <Stack>
                <Stack spacing={"md"} mb={"md"} py="md">
                    <Text size={"md"} color={app.theme.colors.brand[5]} fw={500}>
                        Quel malheur!
                    </Text>
                    <Text size={"md"}>Nous sommes triste de vous voir nous quitter.</Text>
                    <Divider variant={"dotted"} />
                    <Text size={"xs"}>
                        Pour fermer votre compte et supprimer votre portefeuille, nous vous demandons de renseigner
                        votre mot de passe.
                    </Text>
                    <Text size={"xs"}>
                        Mais attention! Vous ne pourrez pas faire marche arrière. Une fois supprimé, votre portefeuille
                        ne sera plus récuppérable!
                    </Text>
                    <PasswordInput
                        placeholder=""
                        label="Votre mot de passe"
                        withAsterisk={true}
                        icon={<IconLock size={14} />}
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                        disabled={deleting}
                    />
                </Stack>

                <Group position={"right"}>
                    <Button
                        onClick={() => deleteWallet()}
                        color={"red.9"}
                        disabled={password.length === 0}
                        loading={deleting}
                    >
                        Supprimer
                    </Button>
                    <Button onClick={() => setOpened(false)} disabled={deleting}>
                        Fermer
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default WalletDeletionModal;
