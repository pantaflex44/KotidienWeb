import React, { useEffect, useState, cloneElement } from "react";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import ReactInputMask from "react-input-mask";
import {
    Accordion,
    ActionIcon,
    Box,
    useMantineTheme,
    Text,
    Tooltip,
    Table,
    Group,
    Modal,
    Tabs,
    Stack,
    TextInput,
    Select,
    NumberInput,
    Input,
    Button,
    Alert,
    Checkbox
} from "@mantine/core";
import { useId, useListState } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { closeAllModals, openConfirmModal } from "@mantine/modals";
import { DatePicker } from "@mantine/dates";
import {
    IconAlertCircle,
    IconBuildingBank,
    IconCreditCard,
    IconCurrencyEuro,
    IconGripVertical,
    IconInfoSquare,
    IconPencil,
    IconSettings2,
    IconSquarePlus,
    IconTag,
    IconTrash,
    IconWallet
} from "@tabler/icons";

import { defaultWalletCategories } from "../../defaults/walletCategories";
import { isValidIBANNumber, uid } from "../../tools";

function WalletItemControl({ category, modalHandlers, children, ...props }) {
    const theme = useMantineTheme();

    const { openAddEditModal } = modalHandlers;

    return (
        <Box sx={{ display: "flex", alignItems: "center" }}>
            <Accordion.Control {...props}>
                <Text size={"sm"} style={{ fontWeight: 500 }}>
                    {children}
                </Text>
            </Accordion.Control>
            <Tooltip label="Ajouter un élément financier" withArrow>
                <ActionIcon size="lg" color={theme.colors.gray[7]} onClick={() => openAddEditModal(category.id)}>
                    <IconSquarePlus size={16} />
                </ActionIcon>
            </Tooltip>
        </Box>
    );
}

function WalletItems({ categories = defaultWalletCategories, value = [], onChange = null }) {
    const theme = useMantineTheme();
    const ibanId = useId();
    const paycardNumberId = useId();
    const paycardCVVId = useId();
    const [addEditModalOpened, setAddEditModalOpened] = useState(false);
    const [addEditModalCategory, setAddEditModalCategory] = useState(null);
    const [usedValue, setUsedValue] = useState([...value]);

    const addEditForm = useForm({
        initialValues: {
            _id: null,
            _name: "",
            _currency: "EUR",
            _initialAmount: 0.0,
            _overdraft: 0.0,
            bankaccountName: "",
            bankaccountIban: "",
            bankaccountBic: "",
            paycardNumber: "",
            paycardOwner: "",
            paycardExpire: new Date(),
            paycardCVV: "",
            moneywalletIsElectronic: false
        },
        validate: {
            _name: (value) => (value.trim().length > 2 ? null : "Nom de l'élément incorrect!"),
            _initialAmount: (value) => (isNaN(parseFloat(value)) ? "Solde initial incorrect!" : null),
            _overdraft: (value) => (isNaN(parseFloat(value)) ? "Montant du découvert autorisé incorrect!" : null),
            bankaccountIban: (value) =>
                value !== "" && isValidIBANNumber(value) !== 1 ? "Numéro IBAN invalide!" : null
        }
    });

    const openAddEditModal = (categoryId, data = {}) => {
        addEditForm.reset();
        addEditForm.setValues((prev) => ({ ...prev, ...data }));

        setAddEditModalCategory(
            Object.entries(categories)
                .filter((v) => v[1].id === categoryId)
                .shift()[1]
        );
        setAddEditModalOpened(true);
    };

    const openDeleteConfirmModal = (item) =>
        openConfirmModal({
            title: "Confirmation",
            overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
            overlayOpacity: 0.55,
            overlayBlur: 3,
            children: <Text size="sm">Voulez-vous supprimer "{item.name}" ?</Text>,
            labels: { confirm: "Valider", cancel: "Annuler" },
            onConfirm: () => deleteItem(item)
        });

    const save = (categoryId) => {
        if (!categoryId) {
            closeAllModals();
            return;
        }

        if (!addEditForm.validate().hasErrors) {
            let data = Object.entries(addEditForm.values)
                .filter(([key, value]) => key.startsWith("_") || key.startsWith(categoryId))
                .map(([key, value]) => {
                    if (key.startsWith("_")) return [key.substring(1), value];
                    return [key, value];
                });
            if (!addEditForm.values._id) {
                data = data.map((l) => {
                    if (l[0] === "id") return [l[0], `walletitem_${uid()}`];
                    return l;
                });
            }
            data.push(["categoryId", categoryId]);
            data = Object.fromEntries(data);

            let updated = false;
            let newValue = [];

            for (let i of usedValue) {
                if (i.categoryId === data.categoryId && i.id === data.id) {
                    newValue.push(data);
                    updated = true;
                } else {
                    newValue.push(i);
                }
            }

            if (!updated) newValue.push(data);
            setUsedValue([...newValue]);

            setAddEditModalOpened(false);
        }
    };

    const deleteItem = (item) => {
        const newValue = usedValue.filter(
            (i) => i.categoryId !== item.categoryId || (i.categoryId === item.categoryId && i.id !== item.id)
        );
        setUsedValue([...newValue]);
    };

    return (
        <>
            <Modal
                id="walletitems-add-edit"
                opened={addEditModalOpened}
                onClose={() => setAddEditModalOpened(false)}
                title={
                    "Elément financier" +
                    (addEditModalCategory ? " dans la catégorie " + addEditModalCategory.text : "")
                }
                overlayColor={theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2]}
                overlayOpacity={0.55}
                overlayBlur={3}
            >
                <Tabs defaultValue="main">
                    <Tabs.List>
                        <Tabs.Tab value="main" icon={<IconSettings2 size={14} />}>
                            Général
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="others"
                            icon={cloneElement(addEditModalCategory?.icon || <IconInfoSquare />, {
                                size: 14
                            })}
                        >
                            Propriétés
                        </Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="main" pt="xs">
                        <Stack py={"md"}>
                            <TextInput
                                placeholder=""
                                label="Nom de l'élément"
                                description="Minimum 2 caractères"
                                icon={<IconTag size={14} />}
                                {...addEditForm.getInputProps("_name")}
                                withAsterisk={true}
                            />
                            <Select
                                label="Devise"
                                description="Seule la devise Euro est actuellement disponible."
                                placeholder=""
                                data={[{ value: "EUR", label: "Euro" }]}
                                {...addEditForm.getInputProps("_currency")}
                                readOnly={true}
                                withAsterisk={true}
                            />
                            <NumberInput
                                label="Solde initial"
                                precision={2}
                                step={0.01}
                                icon={<IconCurrencyEuro size={18} />}
                                {...addEditForm.getInputProps("_initialAmount")}
                                withAsterisk={true}
                                styles={{ input: { color: addEditForm.values._initialAmount < 0 ? "red" : "inherit" } }}
                            />
                            {addEditModalCategory?.id !== "moneywallet" && (
                                <NumberInput
                                    label="Découvert autorisé"
                                    precision={2}
                                    step={0.01}
                                    min={0.0}
                                    icon={<IconCurrencyEuro size={18} />}
                                    {...addEditForm.getInputProps("_overdraft")}
                                    withAsterisk={true}
                                    styles={{
                                        input: { color: addEditForm.values._overdraft < 0 ? "red" : "inherit" }
                                    }}
                                />
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="others" pt="xs">
                        {addEditModalCategory?.id === "bankaccount" && (
                            <Stack py={"md"}>
                                <TextInput
                                    placeholder=""
                                    label="Nom de la banque / du compte"
                                    description="eg: CIC, Société Générale, Crédit Agricole, etc."
                                    icon={<IconBuildingBank size={14} />}
                                    {...addEditForm.getInputProps("bankaccountName")}
                                />
                                <Input.Wrapper
                                    id={ibanId}
                                    label="IBAN"
                                    {...addEditForm.getInputProps("bankaccountIban")}
                                >
                                    <Input
                                        component={ReactInputMask}
                                        mask="aa ** **** **** **** **** **"
                                        id={ibanId}
                                        placeholder={"FR 00 ____ ____ ____ ____ __"}
                                        styles={{ input: { textTransform: "uppercase" } }}
                                        {...addEditForm.getInputProps("bankaccountIban")}
                                    />
                                </Input.Wrapper>
                                <TextInput
                                    label="Bic"
                                    id={"bic"}
                                    placeholder={""}
                                    maxLength={8}
                                    {...addEditForm.getInputProps("bankaccountBic")}
                                />
                            </Stack>
                        )}
                        {addEditModalCategory?.id === "paycard" && (
                            <Stack py={"md"}>
                                <TextInput
                                    placeholder=""
                                    label="Nom du propriétaire"
                                    description="eg: Papa, Maman, John Smith, Olivier Dupond, etc."
                                    icon={<IconCreditCard size={14} />}
                                    {...addEditForm.getInputProps("paycardOwner")}
                                />
                                <Input.Wrapper
                                    id={paycardNumberId}
                                    label="Numéro de la carte"
                                    {...addEditForm.getInputProps("paycardNumber")}
                                >
                                    <Input
                                        component={ReactInputMask}
                                        mask="999 999 999 999"
                                        id={paycardNumberId}
                                        placeholder={"0000 0000 0000 0000"}
                                        {...addEditForm.getInputProps("paycardNumber")}
                                    />
                                </Input.Wrapper>
                                <DatePicker
                                    placeholder={""}
                                    label="Date d'expiration"
                                    {...addEditForm.getInputProps("paycardExpire")}
                                />
                                <Input.Wrapper
                                    id={paycardCVVId}
                                    label="Numéro de contrôle CVV"
                                    {...addEditForm.getInputProps("paycardCVV")}
                                >
                                    <Input
                                        component={ReactInputMask}
                                        mask="999"
                                        id={paycardCVVId}
                                        placeholder={"000"}
                                        {...addEditForm.getInputProps("paycardCVV")}
                                    />
                                </Input.Wrapper>
                            </Stack>
                        )}
                        {addEditModalCategory?.id === "moneywallet" && (
                            <Stack py={"md"}>
                                <Checkbox
                                    placeholder=""
                                    label="Il sagit d'un portefeuille électronique"
                                    description="eg: Monéo, etc."
                                    {...addEditForm.getInputProps("moneywalletIsElectronic", { type: "checkbox" })}
                                />
                            </Stack>
                        )}
                    </Tabs.Panel>
                </Tabs>

                {!addEditForm.isValid() && (
                    <Alert icon={<IconAlertCircle size={16} />} title="Informations requises" color="red" my={"xs"}>
                        Les informations décorées avec un astérique rouge sont requises. Veuillez vérifier les
                        différents onglets avant de valider le formulaire.
                    </Alert>
                )}

                <Group position="right" mt="md">
                    <Button
                        variant="default"
                        onClick={() => {
                            setAddEditModalOpened(false);
                        }}
                    >
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        onClick={() => {
                            save(addEditModalCategory?.id);
                        }}
                    >
                        Enregistrer
                    </Button>
                </Group>
            </Modal>
            <Accordion
                chevronPosition="right"
                variant="contained"
                multiple={true}
                value={categories.map((c) => c.id)}
                styles={{ control: { padding: "8px 8px" }, content: { padding: 0 }, chevron: { display: "none" } }}
            >
                {categories.map((category) => {
                    const [state, handlers] = useListState([
                        ...usedValue.filter((item) => item.categoryId === category.id)
                    ]);

                    useEffect(() => {
                        const lastList = usedValue.filter((item) => item.categoryId !== category.id);
                        const newList = [...lastList, ...state];
                        if (onChange) onChange(newList);
                    }, [state]);

                    useEffect(() => {
                        handlers.setState([...usedValue.filter((item) => item.categoryId === category.id)]);
                    }, [usedValue]);

                    const catItems = state.map((item, index) => (
                        <Draggable key={item.id} index={index} draggableId={item.id}>
                            {(provided) => {
                                const amount = parseFloat(item.initialAmount || 0);

                                return (
                                    <tr key={item.id} ref={provided.innerRef} {...provided.draggableProps}>
                                        <td style={{ width: "32px", verticalAlign: "middle" }}>
                                            <Group {...provided.dragHandleProps}>
                                                <IconGripVertical size={14} stroke={1.5} />
                                            </Group>
                                        </td>
                                        <td>
                                            <Text lineClamp={1}>{item.name}</Text>
                                        </td>
                                        <td
                                            style={{
                                                color: amount < 0.0 ? "red" : "inherit",
                                                textAlign: "right",
                                                width: "150px"
                                            }}
                                        >
                                            <Text lineClamp={1}>
                                                {Intl.NumberFormat("fr-FR", {
                                                    style: "currency",
                                                    currency: item.currency || "EUR"
                                                }).format(amount)}
                                            </Text>
                                        </td>
                                        <td style={{ width: "120px" }}>
                                            <Group spacing={"xs"} position={"right"}>
                                                <Tooltip label="Modifier" withArrow>
                                                    <ActionIcon
                                                        size="lg"
                                                        color={theme.colors.gray[7]}
                                                        onClick={() => {
                                                            const data = Object.entries(item)
                                                                .filter(([key, value]) => key !== "categoryId")
                                                                .map(([key, value]) => {
                                                                    if (
                                                                        key === "id" ||
                                                                        key === "name" ||
                                                                        key === "initialAmount" ||
                                                                        key === "overdraft" ||
                                                                        key === "currency"
                                                                    )
                                                                        return [`_${key}`, value];
                                                                    return [key, value];
                                                                });
                                                            openAddEditModal(item.categoryId, Object.fromEntries(data));
                                                        }}
                                                    >
                                                        <IconPencil size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Supprimer" withArrow>
                                                    <ActionIcon
                                                        size="lg"
                                                        color={"red"}
                                                        onClick={() => openDeleteConfirmModal(item)}
                                                    >
                                                        <IconTrash size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </td>
                                    </tr>
                                );
                            }}
                        </Draggable>
                    ));

                    return (
                        <Accordion.Item value={category.id} key={category.id}>
                            <WalletItemControl
                                category={category}
                                icon={category.icon || null}
                                modalHandlers={{ openAddEditModal }}
                            >
                                {category.text} ({state.length})
                            </WalletItemControl>
                            <Accordion.Panel>
                                {state.length > 0 && (
                                    <DragDropContext
                                        onDragEnd={({ destination, source }) =>
                                            handlers.reorder({ from: source.index, to: destination?.index || 0 })
                                        }
                                    >
                                        <Table highlightOnHover>
                                            <Droppable droppableId="dnd-walletitems-list" direction="vertical">
                                                {(provided) => (
                                                    <tbody {...provided.droppableProps} ref={provided.innerRef}>
                                                        {catItems}
                                                        {provided.placeholder}
                                                    </tbody>
                                                )}
                                            </Droppable>
                                        </Table>
                                    </DragDropContext>
                                )}
                            </Accordion.Panel>
                        </Accordion.Item>
                    );
                })}
            </Accordion>
        </>
    );
}

export default WalletItems;
