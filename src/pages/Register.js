import packagejson from "../../package.json";

import { defaultCategories } from "../../defaults/categories";
import { defaultPaytypes } from "../../defaults/paytypes";

import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
    Button,
    Container,
    Grid,
    Group,
    PasswordInput,
    Stack,
    Stepper,
    Textarea,
    TextInput,
    Title,
    Text,
    Space,
    Paper,
    Breadcrumbs,
    Divider,
    List,
    ActionIcon,
    Mark,
    Alert,
    Loader
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { closeAllModals, openModal } from "@mantine/modals";
import {
    IconAlertCircle,
    IconArrowLeft,
    IconArrowRight,
    IconAt,
    IconLock,
    IconPencil,
    IconPlugConnected,
    IconSquarePlus,
    IconTextSize,
    IconTrash,
    IconX
} from "@tabler/icons";

import Metas from "../components/Metas";
import WalletItems from "../components/WalletItems";
import CategoriesTree from "../components/CategoriesTree";
import ItemsList from "../components/ItemsList";

import { AppContext } from "../components/AppProvider";

import { exists, register } from "../wrappers/wallet_api";
import { completeNavigationProgress, resetNavigationProgress, startNavigationProgress } from "@mantine/nprogress";
import { showNotification } from "@mantine/notifications";

function Register() {
    const { email } = useParams();
    const app = useContext(AppContext);
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [passwordIsVisible, passwordVisibility] = useDisclosure(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (!app.wallet) {
            if (step === 0) {
                app.setNavbarContent({
                    header: (
                        <Text fw={500} size={"md"} mb={"sm"}>
                            Un compte {packagejson.name.trim().capitalize()}, c'est quoi?
                        </Text>
                    ),
                    content: (
                        <>
                            <Text size={"sm"} mb={"sm"}>
                                {packagejson.name.trim().capitalize()} est une application web vous permettant de
                                manipuler un portefeuille d'éléments financiers. Un compte correspond à un portefeuille
                                unique, relié à une de vos adresse email. Chaque portefeuille sera identifié de la
                                sorte.
                            </Text>
                            <Text size={"sm"} mb={"sm"}>
                                Il n'est pas possible d'ouvrir plusieurs portefeuilles avec le même identifiant. C'est
                                pourquoi, chaque portefeuille pourra contenir un nombre illimité d'éléments financiers,
                                tels des comptes bancaires, épargnes, des cartes de paiments autonomes, et même le
                                contenu de votre portefeuille d'espèces, qu'il soit physique (votre poche?) ou
                                électronique.
                            </Text>
                            <Text size={"sm"} mb={"sm"}>
                                Chaque portefeuille est sécurisé. En plus d'être unique, un mot de passe vous est
                                demandé. Ce mot de passe est très particulier. Il sert à chiffrer l'ensemble de vos
                                données!
                            </Text>
                            <Text size={"sm"} mb={"sm"}>
                                C'est pourquoi, il est <strong>IMPERATIF</strong>, que vous gardiez ce mot de passe
                                précieusement. <u>Nous ne pourrons, en aucun cas, vous le retrouver</u> (
                                <em>
                                    il n'est pas sauvegardé dans nos serveurs, de ce fait, nous ne le connaissons pas!
                                </em>
                                ).
                            </Text>
                            <Text size={"sm"} mb={"sm"}>
                                <strong>Ne le perdez pas!</strong> Au rique de perdre définitivement le contenu de votre
                                portefeuille.
                            </Text>
                        </>
                    )
                });
            }
            if (step === 1) {
                app.setNavbarContent({
                    header: (
                        <Text fw={500} size={"md"} mb={"sm"}>
                            Les éléments bancaires, c'est quoi?
                        </Text>
                    ),
                    content: (
                        <>
                            <Text size={"sm"} mb={"sm"}>
                                {packagejson.name.trim().capitalize()} vous propose d'ajouter à votre portefeuille, un
                                nombre illimité d'éléments bancaires.
                            </Text>
                            <Text size={"sm"} mb={"sm"}>
                                Trois grandes familles vous sont proposées:
                            </Text>
                            <List>
                                <List.Item mb={"lg"}>
                                    <Stack>
                                        <Text size={"sm"}>
                                            <strong>Les comptes bancaires</strong>
                                        </Text>
                                        <Text size={"sm"}>
                                            Cette famille comprend tous les éléments bancaires représentés par un RIB
                                            tel les comptes chèques, comptes épargnes, livrets, etc.
                                        </Text>
                                    </Stack>
                                </List.Item>
                                <List.Item mb={"lg"}>
                                    <Stack>
                                        <Text size={"sm"}>
                                            <strong>Les cartes de paiements</strong>
                                        </Text>
                                        <Text size={"sm"}>
                                            Héberge les cartes autonomes de paiements et toutes les cartes prépayées
                                            telle la carte PCS, etc.
                                        </Text>
                                    </Stack>
                                </List.Item>
                                <List.Item mb={"lg"}>
                                    <Stack>
                                        <Text size={"sm"}>
                                            <strong>Les portefeuilles d'espèces</strong>
                                        </Text>
                                        <Text size={"sm"}>
                                            Ici vous pourrez enregistrer vos économies. Que ce soit un portefeuille
                                            d'espèces, un portefeuille électronique ou les dessous de vos matelas!
                                        </Text>
                                    </Stack>
                                </List.Item>
                            </List>
                        </>
                    )
                });
            }
            if (step === 2) {
                app.setNavbarContent({
                    header: (
                        <Text fw={500} size={"md"} mb={"sm"}>
                            Personnalisation de mon portefeuille
                        </Text>
                    ),
                    content: (
                        <>
                            <Text size={"sm"} mb={"sm"}>
                                {packagejson.name.trim().capitalize()} vous propose de multiples options de
                                personnalisations. Dans cette rubrique, nous vous proposons d'ajuster les futurs
                                classements.
                            </Text>
                            <Text size={"sm"} mb={"sm"}>
                                Pour mieux classer vos opérations, nous vous proposons de personnaliser les{" "}
                                <strong>catégories</strong> dans lesquelles seront regroupées les différentes opérations
                                enregistrées dans l'application. Ces catégories seront modifiables à tout moment.
                            </Text>
                        </>
                    )
                });
            }
            if (step === 3) {
                app.setNavbarContent({
                    header: (
                        <Text fw={500} size={"md"} mb={"sm"}>
                            Personnalisation de mon portefeuille
                        </Text>
                    ),
                    content: (
                        <>
                            <Text size={"sm"} mb={"sm"}>
                                {packagejson.name.trim().capitalize()} vous propose de multiples options de
                                personnalisations. Cette fois, l'ajustement des tiers et moyens de paiements vous est
                                proposé.
                            </Text>
                            <Text size={"sm"} mb={"sm"}>
                                Comme un compte bancaire peut avoir divers <strong>moyens de paiements</strong>, nous
                                vous proposons de les personnaliser. Encore une fois, ceux-ci seront modifiables à tout
                                moment.
                            </Text>
                            <Text size={"sm"} mb={"sm"}>
                                Pour finir, comme chaque opération à une provenance ou une destination, nous vous
                                proposons d'entregistrer vos <strong>tiers</strong>. Vous pourrez leur associer une
                                catégorie et / ou un moyen de paiement par défaut qui vous seront proposés à chaque
                                nouvel enregistrement d'une opération financière.
                            </Text>
                        </>
                    )
                });
            }
            if (step > 3) {
                app.setNavbarContent({
                    header: null,
                    content: null
                });
            }
        }
    }, [step]);

    const errorModal = (message) => {
        openModal({
            title: "Erreur",
            overlayColor: app.theme.colorScheme === "dark" ? app.theme.colors.dark[9] : app.theme.colors.gray[2],
            overlayOpacity: 0.55,
            overlayBlur: 3,
            children: (
                <>
                    <Text size={"sm"}>{message}</Text>
                    <Group position={"right"} mt={"md"}>
                        <Button color={"red"} onClick={closeAllModals}>
                            Fermer
                        </Button>
                    </Group>
                </>
            )
        });
    };

    const registerForm = useForm({
        initialValues: {
            email: email,
            emailConfirm: email,
            password: "",
            passwordConfirm: "",
            name: "",
            note: "",
            walletItems: [],
            categories: defaultCategories,
            paytypes: defaultPaytypes,
            thirdparties: []
        },
        validate: (values) => {
            if (step === 0) {
                return {
                    email: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(values.email)
                        ? null
                        : "Adresse email invalide!",
                    emailConfirm:
                        values.emailConfirm === values.email ? null : "Confirmation de l'adresse email incorrecte!",
                    password: new RegExp(
                        "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\\!\\@\\#\\$\\%\\^\\&\\*\\)\\(\\+\\=\\.\\<\\>\\{\\}\\[\\]\\:\\;\\'\"\\|\\~\\`\\_\\-])(?=.{8,})"
                    ).test(values.password.trim())
                        ? null
                        : "Mot de passe incorrect!",
                    passwordConfirm:
                        values.password === values.passwordConfirm.trim() ? null : "Confirmation incorrecte!",
                    name: values.name.trim().length > 2 ? null : "Le nom doit contenir au moins 2 caractères."
                };
            }

            return {};
        }
    });

    const submitRegisterForm = () => {
        setLoading(true);

        register(registerForm.values)
            .then((response) => {
                const { registered, errorCode, errorMessage } = response;

                if (!registered || errorCode !== 0) {
                    if (errorCode === 409) {
                        registerForm.setFieldError("email", errorMessage);
                        setStep(0);
                    }

                    showNotification({
                        id: "register-error-notification",
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Impossible de créer ce nouveau portefeuille!",
                        message: errorMessage,
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });

                    return;
                }

                setStep(5);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const nextStep = () => {
        if (step === 0) {
            if (!registerForm.validate().hasErrors) {
                exists(registerForm.values.email).then((e) => {
                    if (e) {
                        registerForm.setFieldError("email", "Un portefeuille existe déjà avec cet identifiant!");
                    } else {
                        setStep(1);
                    }
                });
            }
        } else if (step === 1) {
            if (registerForm.values.walletItems.length > 0) {
                setStep(2);
            }
        } else if (step === 2) {
            setStep(3);
        } else if (step === 3) {
            setStep(4);
        } else if (step === 4) {
            submitRegisterForm();
        }
    };

    const prevStep = () => {
        setStep((current) => (current > 0 ? current - 1 : current));
    };

    return (
        <Metas title={"Créer mon portefeuille"}>
            {!app.wallet && (
                <>
                    <Breadcrumbs separator="→">
                        <Link to={"/"} className={"breadcrumbsAnchorLink"}>
                            Page d'accueil
                        </Link>
                    </Breadcrumbs>
                    <Divider variant="dotted" mt={"sm"} />

                    <Container
                        size={"lg"}
                        mt={{ base: 0, sm: "xs" }}
                        ml={{ base: "auto", sm: "xs" }}
                        mr={{ base: "auto", sm: "xs" }}
                        pl={"lg"}
                        pr={"lg"}
                        pt={"lg"}
                        pb={"lg"}
                        sx={(theme) => ({
                            minHeight: "100%"
                        })}
                    >
                        <Title order={2} mb="xs" color={app.theme.colors.brand[5]}>
                            Ouvrir un nouveau portefeuille
                        </Title>
                        <Text mb="lg">
                            Veuillez suivre l'assistant de création ci-dessous pour ouvrir un nouveau portefeuille{" "}
                            {packagejson.name.trim().capitalize()}.
                        </Text>
                        <Space h="lg" />

                        <Paper
                            withBorder={true}
                            p={"md"}
                            sx={(theme) => ({
                                backgroundColor:
                                    app.theme.colorScheme === "dark"
                                        ? app.theme.colors.dark[8]
                                        : app.theme.colors.gray[0]
                            })}
                        >
                            <Stepper active={step} breakpoint="sm" mt="lg">
                                <Stepper.Step label="Sécurité" description="Identité.">
                                    <Grid grow={true} gutter={"xl"}>
                                        <Grid.Col sm={1} lg={2}>
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
                                            </Stack>
                                        </Grid.Col>
                                        <Grid.Col sm={1} lg={2}>
                                            <Stack spacing={"md"} mt={"xl"}>
                                                <PasswordInput
                                                    placeholder=""
                                                    label="Mot de passe"
                                                    description="Votre mot de passe doit contenir au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 carractère spécial."
                                                    withAsterisk={true}
                                                    icon={<IconLock size={14} />}
                                                    visible={passwordIsVisible}
                                                    onVisibilityChange={passwordVisibility.toggle}
                                                    {...registerForm.getInputProps("password")}
                                                />
                                                <PasswordInput
                                                    placeholder=""
                                                    label="Confirmation"
                                                    description="Confirmez votre mot de passe"
                                                    withAsterisk={true}
                                                    icon={<IconLock size={14} />}
                                                    visible={passwordIsVisible}
                                                    onVisibilityChange={passwordVisibility.toggle}
                                                    {...registerForm.getInputProps("passwordConfirm")}
                                                />
                                            </Stack>
                                        </Grid.Col>
                                    </Grid>
                                    <Grid grow={true} gutter={"xl"}>
                                        <Grid.Col sm={1} lg={2}>
                                            <Stack spacing={"md"} mt={"xl"}>
                                                <TextInput
                                                    placeholder=""
                                                    label="Dénomination"
                                                    description="Nommez votre futur portefeuille pour mieux l'identifier."
                                                    withAsterisk={true}
                                                    icon={<IconTextSize size={14} />}
                                                    {...registerForm.getInputProps("name")}
                                                />
                                            </Stack>
                                        </Grid.Col>
                                        <Grid.Col sm={1} lg={2}>
                                            <Stack spacing={"md"} mt={"xl"}>
                                                <Textarea
                                                    placeholder=""
                                                    label="Notes"
                                                    description="Quelques informations utiles, des notes importantes, etc."
                                                    icon={<IconPencil size={14} />}
                                                    autosize={true}
                                                    minRows={4}
                                                    maxRows={12}
                                                    {...registerForm.getInputProps("note")}
                                                />
                                            </Stack>
                                        </Grid.Col>
                                    </Grid>
                                </Stepper.Step>

                                <Stepper.Step label="Finances" description="Comptes, CB, etc.">
                                    <Grid grow={true} gutter={"xl"}>
                                        <Grid.Col sm={1} lg={2}>
                                            <Stack spacing={"md"} mt={"xl"}>
                                                <Text>
                                                    Définissez les éléments financiers composant votre futur
                                                    portefeuille.
                                                </Text>
                                                <Text size={"xs"}>
                                                    Les informations demandées sont strictement privées. Nous n'y avons
                                                    pas accès. Je vous rappel que ces informations sont cryptées et
                                                    sécurisées avec le mot de passe que vous seul connaissez. L'onglet{" "}
                                                    <Mark>Propriétés</Mark> n'est pas obligatoire. Il permet simplement
                                                    de sauvegarder des informations complémentaires pouvant être utiles
                                                    à la reconnaissance d'un élément financier.
                                                </Text>
                                                <Space h="xs" />
                                                <WalletItems {...registerForm.getInputProps("walletItems")} />
                                                <Space h="xs" />
                                                <Stack spacing={0}>
                                                    <Group>
                                                        <ActionIcon size="lg" color={app.theme.colors.gray[7]}>
                                                            <IconSquarePlus size={16} />
                                                        </ActionIcon>
                                                        <Text size={"sm"}>
                                                            Ajouter un nouvel élément financier dans la catégorie.
                                                        </Text>
                                                    </Group>
                                                    <Group>
                                                        <ActionIcon size="lg" color={app.theme.colors.gray[7]}>
                                                            <IconPencil size={16} />
                                                        </ActionIcon>
                                                        <Text size={"sm"}>Modifier l'élément financier.</Text>
                                                    </Group>
                                                    <Group>
                                                        <ActionIcon size="lg" color={"red"}>
                                                            <IconTrash size={16} />
                                                        </ActionIcon>
                                                        <Text size={"sm"}>Supprimer l'élément financier.</Text>
                                                    </Group>
                                                </Stack>
                                                {registerForm.values.walletItems.length === 0 && (
                                                    <Alert
                                                        icon={<IconAlertCircle size={16} />}
                                                        title="Informations requises"
                                                        color="red"
                                                        mt={"xl"}
                                                    >
                                                        Au moins un élément bancaire est requis pour passer à l'étape
                                                        suivante.
                                                    </Alert>
                                                )}
                                            </Stack>
                                        </Grid.Col>
                                    </Grid>
                                </Stepper.Step>

                                <Stepper.Step label="Classement" description="Catégories.">
                                    <Stack spacing={"md"} mt={"xl"}>
                                        <Text>Catégoriser ses futures opérations</Text>
                                        <Text size={"xs"}>
                                            Une liste de catégories par défaut vous est proposée ci-dessous. Vous pouvez
                                            la modifier à votre guise pour l'adapter au plus proche de vos besoins.
                                        </Text>
                                        <Grid grow={true} gutter={"xl"}>
                                            <Grid.Col sm={1} lg={2}>
                                                <Stack spacing={"md"} mt={"xl"}>
                                                    <CategoriesTree {...registerForm.getInputProps("categories")} />
                                                </Stack>
                                            </Grid.Col>
                                        </Grid>
                                    </Stack>
                                </Stepper.Step>

                                <Stepper.Step label="Personnalisations" description="Tiers et Paiements.">
                                    <Stack spacing={"md"} mt={"xl"}>
                                        <Grid grow={true} gutter={"xl"}>
                                            <Grid.Col sm={1} lg={2}>
                                                <Stack spacing={"md"} mt={"xl"}>
                                                    <Text>Les moyens de paiements</Text>
                                                    <Text size={"xs"}>
                                                        Vous utilisez différents moyens pour percevoir ou transférer de
                                                        l'argent. La liste ci-dessous regroupe les moyens les plus
                                                        utilisés. A vous de les modifier à votre guise.
                                                    </Text>
                                                    <Space h={"xs"} />
                                                    <ItemsList
                                                        id="paytype"
                                                        {...registerForm.getInputProps("paytypes")}
                                                        useColors={false}
                                                        translate={{
                                                            newItem: "Nouveau moyen de paiement",
                                                            deleteAllItems:
                                                                "Voulez-vous supprimer tous les moyens de paiements ?",
                                                            addItem: "Ajouter un moyen de paiements",
                                                            newHelp: (
                                                                <>
                                                                    Cliquez sur <IconSquarePlus size={14} /> pour
                                                                    ajouter un moyen de paiement.
                                                                </>
                                                            )
                                                        }}
                                                    />
                                                </Stack>
                                            </Grid.Col>
                                            <Grid.Col sm={1} lg={2}>
                                                <Stack spacing={"md"} mt={"xl"}>
                                                    <Text>Vos tiers</Text>
                                                    <Text size={"xs"}>
                                                        Nous vous proposons dans la liste ci-dessous, d'ajouter les
                                                        tiers les plus fréquents qui définiront les futures opérations
                                                        enregistrées. Vous pourrez en ajouter plus tard, directement
                                                        lors de la saisie d'une opération financière ou dans les
                                                        paramètres de votre portefeuille.
                                                    </Text>
                                                    <Space h={"xs"} />
                                                    <ItemsList
                                                        id="thirdparty"
                                                        {...registerForm.getInputProps("thirdparties")}
                                                        useColors={false}
                                                        translate={{
                                                            newItem: "Nouveau tiers",
                                                            deleteAllItems: "Voulez-vous supprimer tous les tiers ?",
                                                            addItem: "Ajouter un tiers",
                                                            newHelp: (
                                                                <>
                                                                    Cliquez sur <IconSquarePlus size={14} /> pour
                                                                    ajouter un tiers.
                                                                </>
                                                            )
                                                        }}
                                                    />
                                                </Stack>
                                            </Grid.Col>
                                        </Grid>
                                    </Stack>
                                </Stepper.Step>

                                <Stepper.Step label="Résumé">
                                    <Text mt={"xl"}>
                                        Vous voilà arrivé au bout de l'enregistrement des données nécessaires à la
                                        création de votre nouveau portefeuille.
                                    </Text>
                                    {!loading && (
                                        <Text size={"sm"} mt={"xl"}>
                                            Vous pouvez revenir en arrière pour vérifier, modifier ces informations.
                                            Pour valider la création de votre portefeuille, cliquez sur le bouton
                                            [Valider].
                                        </Text>
                                    )}
                                </Stepper.Step>

                                <Stepper.Completed>
                                    <Stack spacing={"md"} mt={"xl"}>
                                        <Text>Bienvenue sur {packagejson.name.trim().capitalize()}!</Text>
                                        <Text size={"sm"} mt={"xl"}>
                                            Votre portefeuille est désormais créé. Pour y accéder, veuillez vous
                                            connecter en suivant le lien ci-dessous.
                                        </Text>
                                        <Group position={"center"} mt={"xl"}>
                                            <Button
                                                onClick={() => {
                                                    navigate("/");
                                                }}
                                            >
                                                <IconPlugConnected size={14} />
                                                &nbsp;Me connecter
                                            </Button>
                                        </Group>
                                    </Stack>
                                </Stepper.Completed>
                            </Stepper>

                            {!registerForm.isValid() && (
                                <Alert
                                    icon={<IconAlertCircle size={16} />}
                                    title="Informations requises"
                                    color="red"
                                    mt={"xl"}
                                >
                                    Veuillez compléter les informations décorées avec un astérisque rouge avant de
                                    passer à l'étape suivante.
                                </Alert>
                            )}

                            <Space h="lg" />

                            <Group position="right" mt="xl">
                                {step > 0 && step < 5 && !loading && (
                                    <Button variant="default" onClick={prevStep}>
                                        <IconArrowLeft size={14} />
                                        &nbsp;Précédent
                                    </Button>
                                )}
                                {step < 5 &&
                                    (loading ? (
                                        <Group position={"right"} spacing={"xs"}>
                                            <Loader size={"sm"} variant={"bars"} />
                                            <Text size={"sm"} fw={500}>
                                                Veuillez patienter SVP...
                                            </Text>
                                        </Group>
                                    ) : (
                                        <Button type="submit" onClick={nextStep}>
                                            {step < 4 ? (
                                                <>
                                                    Suivant&nbsp;
                                                    <IconArrowRight size={14} />
                                                </>
                                            ) : (
                                                <>
                                                    Valider&nbsp;
                                                    <IconArrowRight size={14} />
                                                </>
                                            )}
                                        </Button>
                                    ))}
                            </Group>
                        </Paper>
                    </Container>
                </>
            )}
        </Metas>
    );
}

export default Register;
