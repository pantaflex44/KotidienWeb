import packagejson from "../../package.json";
import defaultWalletItemViewFilter from "../../defaults/walletItemViewFilter";
import defaultWalletItemViewSorter from "../../defaults/walletItemViewSorter";
import { defaultWalletCategories } from "../../defaults/walletCategories";

import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

import {
    ActionIcon,
    Alert,
    Button,
    Checkbox,
    Divider,
    Group,
    Modal,
    NumberInput,
    Select,
    Space,
    Stack,
    Tabs,
    Text,
    TextInput,
    Tooltip
} from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import { closeAllModals, openConfirmModal } from "@mantine/modals";
import { useForm } from "@mantine/form";
import { getHotkeyHandler, useClickOutside, useFocusTrap, useHotkeys } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";

import {
    IconAlertCircle,
    IconArrowsTransferDown,
    IconBuildingBank,
    IconCalendar,
    IconCalendarEvent,
    IconCash,
    IconCategory,
    IconCurrencyEuro,
    IconEdit,
    IconFilter,
    IconListDetails,
    IconPlus,
    IconQuote,
    IconRefresh,
    IconRotateRectangle,
    IconSquare,
    IconSquareCheck,
    IconSquareMinus,
    IconTag,
    IconThumbUp,
    IconTrash,
    IconUsers,
    IconX
} from "@tabler/icons";

import { AppContext } from "./AppProvider";
import FiltersBar from "./FiltersBar";
import WalletResumeBox from "./WalletResumeBox";
import OpeList from "./OpeList";

import { getDatePattern, toSqlDate, uid } from "../../tools";
import { saveOperation, getOperations, deleteOperations } from "../wrappers/wallet_api";

function Wallet({
    walletItem,
    walletFilters = defaultWalletItemViewFilter,
    walletSorter = defaultWalletItemViewSorter,
    id = uid()
}) {
    const app = useContext(AppContext);
    const [addEditModalOpened, setAddEditModalOpened] = useState(false);
    const [filtersOpened, setFiltersOpened] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);
    const [filters, setFilters] = useState({ ...walletFilters });
    const [sorter, setSorter] = useState({ ...walletSorter });
    const [opeListItems, setOpeListItems] = useState([]);
    const [forceRefresh, setForceRefresh] = useState("");

    const addEditForm = useForm({
        initialValues: {
            id: null,
            amount: 0.0,
            categoryId: "",
            comment: "",
            date: new Date(),
            paytypeId: "",
            state: false,
            title: "",
            thirdpartyId: "",
            fromWalletItemId: null,
            toWalletItemId: "",
            type: ""
        },
        validate: {
            title: (value) => (value.trim().length > 2 ? null : "Nom de l'élément incorrect!"),
            amount: (value) => (isNaN(parseFloat(value)) ? "Montant incorrect!" : null),
            categoryId: (value, values) =>
                values.type === "operation" ? (value === "" ? "Catégorie requise!" : null) : null,
            paytypeId: (value, values) =>
                values.type === "operation" ? (value === "" ? "Moyen de paiement requis!" : null) : null,
            thirdpartyId: (value, values) =>
                values.type === "operation" ? (value === "" ? "Tiers requis!" : null) : null,
            fromWalletItemId: (value, values) =>
                values.type === "transfer" ? (value === null || value === "" ? "Destination requise!" : null) : null
        }
    });

    function getCategories(parentId = null, parentLbl = "", level = 0) {
        let categories = [];
        app.wallet.categories
            .filter((c) => c.parentId === parentId)
            .map((c) => {
                const lbl = (parentLbl !== "" ? `${parentLbl} - ` : "") + c.name;
                categories = [
                    ...categories,
                    {
                        value: c.id,
                        label: lbl
                    },
                    ...getCategories(c.id, lbl, level + 1)
                ];
            });
        return categories;
    }

    function getThirdparties() {
        let thirdparties = [];
        app.wallet.thirdparties.map((t) => {
            thirdparties = [...thirdparties, { value: t.id, label: t.name }];
        });
        return thirdparties;
    }

    function getPaytypes() {
        let paytypes = [];
        app.wallet.paytypes.map((t) => {
            paytypes = [...paytypes, { value: t.id, label: t.name }];
        });
        return paytypes;
    }

    function getWalletItems() {
        let walletItems = [];
        defaultWalletCategories.map((c) => {
            app.wallet.walletItems
                .filter((t) => t.categoryId === c.id)
                .map((t) => {
                    if (t.id !== walletItem.id) {
                        walletItems = [...walletItems, { value: t.id, label: t.name, group: c.text }];
                    }
                });
        });
        return walletItems;
    }

    const memoizedWalletItems = useMemo(() => getWalletItems(), [app.wallet?.walletItems, walletItem]);
    const memoizedThirdparties = useMemo(() => getThirdparties(), [app.wallet?.thirdparties]);
    const memoizedCategories = useMemo(() => getCategories(), [app.wallet?.categories]);
    const memoizedPaytypes = useMemo(() => getPaytypes(), [app.wallet?.paytypes]);

    const openOpe = (type = "operation", forceNew = false) => {
        addEditForm.reset();

        let data = {};

        if (selected.length === 0 || forceNew) {
            data = { ...data, type };
            if (type === "transfer") data = { ...data, fromWalletItemId: "" };
        } else {
            const selectedOpe = opeListItems.filter((o) => o.id === selected[0]);
            if (selectedOpe.length === 1) data = { ...selectedOpe[0], date: new Date(Date.parse(selectedOpe[0].date)) };
        }

        if (data.type === "transfer" && data.amount >= 0) return;

        if (Object.keys(data).length === 0) {
            showNotification({
                id: `open-operation-error-notification-${uid()}`,
                disallowClose: true,
                autoClose: 5000,
                title: "Impossible d'éditer' cette opération!",
                message: "Cette opération semble corrompue, ou comporte de mauvaise données!",
                color: "red",
                icon: <IconX size={18} />,
                loading: false
            });
        } else {
            addEditForm.setValues((current) => {
                const newData = { ...current, ...data };
                return newData;
            });

            setAddEditModalOpened(true);
        }
    };

    const saveOpe = (closeAfterSave = false) => {
        setSaving(true);

        const apply = () => {
            addEditForm.validate();

            if (addEditForm.isValid()) {
                let data = { ...addEditForm.values };
                if (data.id === null) data = { ...data, id: `${data.type}_${uid()}`, toWalletItemId: walletItem.id };

                let newOpe = {
                    id: data.id,
                    type: data.type,
                    comment: data.comment,
                    title: data.title,
                    date: toSqlDate(data.date),
                    state: data.state === true ? 1 : 0,
                    toWalletItemId: data.toWalletItemId
                };
                if (data.type === "operation") {
                    newOpe = {
                        ...newOpe,
                        amount: data.amount,
                        categoryId: data.categoryId,
                        paytypeId: data.paytypeId,
                        thirdpartyId: data.thirdpartyId
                    };
                } else if (data.type === "transfer") {
                    newOpe = {
                        ...newOpe,
                        amount: data.amount <= 0 ? data.amount : data.amount * -1.0,
                        fromWalletItemId: data.fromWalletItemId
                    };
                }

                saveOperation(app.wallet.email, newOpe)
                    .then((response) => {
                        const { saved, errorCode, errorMessage } = response;

                        if (!saved || errorCode !== 0) {
                            showNotification({
                                id: `save-operation-error-notification-${uid()}`,
                                disallowClose: true,
                                autoClose: 5000,
                                title: "Impossible d'enregistrer cette opération!",
                                message: errorMessage,
                                color: "red",
                                icon: <IconX size={18} />,
                                loading: false
                            });
                        } else {
                            showNotification({
                                id: `save-operation-notification-${uid()}`,
                                disallowClose: true,
                                autoClose: 5000,
                                title: "Opération",
                                message: "Opération enregistrée avec succès.",
                                color: "green",
                                icon: <IconThumbUp size={18} />,
                                loading: false
                            });

                            app.refreshAmounts();
                            loadOpeList();

                            setSelected([newOpe.id]);

                            if (closeAfterSave) setAddEditModalOpened(false);
                        }
                    })
                    .finally(() => {
                        setSaving(false);
                    });
            }
        };

        if (app.expectedSaving) {
            app.saveAsync()
                .then(() => apply())
                .finally(() => {
                    setSaving(false);
                });
        } else {
            apply();
        }
    };

    const deleteOpe = (items) => {
        if (items.length === 0) return;

        openConfirmModal({
            title: "Supprimer des opérations",
            children: (
                <Text size="sm" mb="lg" data-autofocus>
                    Souhaitez-vous supprimer les {items.length} opération{items.length > 1 ? "s" : ""} sélectionnée
                    {items.length > 1 ? "s" : ""}?
                </Text>
            ),
            withCloseButton: true,
            closeOnEscape: true,
            closeOnClickOutside: true,
            centered: true,
            overlayColor: app.theme.colorScheme === "dark" ? app.theme.colors.dark[9] : app.theme.colors.gray[2],
            overlayOpacity: 0.55,
            overlayBlur: 3,
            onConfirm: () => {
                deleteOperations(app.wallet.email, items)
                    .then((response) => {
                        const { deleted, errorCode, errorMessage } = response;

                        if (!deleted || errorCode !== 0) {
                            showNotification({
                                id: `delete-operation-error-notification-${uid()}`,
                                disallowClose: true,
                                autoClose: 5000,
                                title: "Impossible de supprimer une des opérations sélectionnées!",
                                message: errorMessage,
                                color: "red",
                                icon: <IconX size={18} />,
                                loading: false
                            });
                        } else {
                            showNotification({
                                id: `delete-operation-notification-${uid()}`,
                                disallowClose: true,
                                autoClose: 5000,
                                title: "Supressions",
                                message: "Toutes les opérations sélectionnées ont éte supprimées.",
                                color: "green",
                                icon: <IconThumbUp size={18} />,
                                loading: false
                            });

                            app.refreshAmounts();
                            loadOpeList();

                            closeAllModals();
                        }
                    })
                    .finally(() => {
                        setSaving(false);
                    });
            },
            onCancel: () => {
                setSaving(false);
                closeAllModals();
            }
        });

        setSaving(true);
    };

    const updateOpe = (items) => {
        if (items.length === 0) return;

        items.map((item) => {
            setSaving(true);

            saveOperation(app.wallet.email, item)
                .then((response) => {
                    const { saved, errorCode, errorMessage } = response;

                    if (!saved || errorCode !== 0) {
                        showNotification({
                            id: `${item.id}-state-operation-error-notification-${uid()}`,
                            disallowClose: true,
                            autoClose: 5000,
                            title: `Impossible de modifier l'état de l'opération '${item.title}'`,
                            message: errorMessage,
                            color: "red",
                            icon: <IconX size={18} />,
                            loading: false
                        });
                    } else {
                        showNotification({
                            id: `${item.id}-state-operation-notification-${uid()}`,
                            disallowClose: true,
                            autoClose: 5000,
                            title: "Modification d'état",
                            message: `Etat de l'opération '${item.title}' modifié avec succès.`,
                            color: "green",
                            icon: <IconThumbUp size={18} />,
                            loading: false
                        });
                    }
                })
                .finally(() => {
                    setSaving(false);
                });
        });
    };

    const compareOpeListItems = (newItems, oldItems) => {
        try {
            const added = newItems.filter(({ id: id1 }) => !oldItems.some(({ id: id2 }) => id2 === id1));
            const removed = oldItems.filter(({ id: id1 }) => !newItems.some(({ id: id2 }) => id2 === id1));
            const updated = newItems.filter(({ id: id1, ...rest1 }) =>
                oldItems.some(({ id: id2, ...rest2 }) => id2 === id1 && JSON.stringify(rest1) !== JSON.stringify(rest2))
            );

            return { added, removed, updated };
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    const loadOpeList = useCallback(() => {
        setLoading(true);
        setSelected([]);

        getOperations(app.wallet.email, walletItem.id, filters)
            .then((response) => {
                const { operations, errorCode, errorMessage } = response;

                if (errorCode !== 0) {
                    showNotification({
                        id: `get-operation-error-notification-${uid()}`,
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Impossible de lister les opérations!",
                        message: errorMessage,
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });
                } else {
                    setOpeListItems((current) => {
                        const results = compareOpeListItems(operations, current);
                        if (!results) return operations;

                        const { added, removed, updated } = results;
                        let newOperations = [...current, ...added];

                        const removedIds = removed.map((o) => o.id);
                        newOperations = newOperations.filter((o) => !removedIds.includes(o.id));

                        const updatedIds = updated.map((o) => o.id);
                        newOperations = newOperations.map((o) => {
                            if (!updatedIds.includes(o.id)) return o;

                            const uope = updated.filter((u) => u.id === o.id);
                            if (uope.length === 0) return o;

                            return { ...o, ...uope[0] };
                        });

                        return newOperations;
                    });
                }
            })
            .finally(() => {
                setLoading(false);
            });
    }, [walletItem.id, filters, app.currentDate, forceRefresh]);

    useEffect(() => {
        if (app.idle) {
            setAddEditModalOpened(false);
        }
    }, [app.idle]);

    useLayoutEffect(() => {
        setForceRefresh(uid());
        loadOpeList();
    }, [walletItem.id, filters, app.currentDate]);

    useHotkeys([
        [
            "mod+alt+N",
            () => {
                if (!loading && !addEditModalOpened) openOpe("operation", true);
            }
        ],
        [
            "mod+alt+T",
            () => {
                if (!loading && !addEditModalOpened) openOpe("transfer", true);
            }
        ],
        [
            "mod+alt+F",
            () => {
                if (!loading && !addEditModalOpened) setFiltersOpened((old) => !old);
            }
        ],
        [
            "mod+alt+F5",
            () => {
                if (!loading && !addEditModalOpened) loadOpeList();
            }
        ],
        [
            "Delete",
            () => {
                if (!loading && !addEditModalOpened && selected.length > 0)
                    deleteOpe(opeListItems.filter((item) => selected.includes(item.id)));
            }
        ],
        [
            "Enter",
            () => {
                if (!loading && !addEditModalOpened && selected.length === 1) openOpe();
            }
        ],
        [
            "mod+alt+A",
            () => {
                if (!loading && !addEditModalOpened && selected.length !== opeListItems.length) {
                    setSelected(opeListItems.map((o) => o.id));
                }
            }
        ],
        [
            "Escape",
            () => {
                if (!loading && !addEditModalOpened) setSelected([]);
            }
        ],
        [
            "ArrowDown",
            () => {
                if (!loading && !addEditModalOpened) {
                    if (selected.length === 0) {
                        setSelected([opeListItems[0].id]);
                    } else {
                        const index = opeListItems.findIndex((o) => o.id === selected[0]);
                        if (index < opeListItems.length - 1) {
                            setSelected([opeListItems[index + 1].id]);
                        }
                    }
                }
            }
        ],
        [
            "ArrowUp",
            () => {
                if (!loading && !addEditModalOpened) {
                    if (selected.length === 0) {
                        setSelected([opeListItems[opeListItems.length - 1].id]);
                    } else {
                        const index = opeListItems.findIndex((o) => o.id === selected[0]);
                        if (index > 0) {
                            setSelected([opeListItems[index - 1].id]);
                        }
                    }
                }
            }
        ],
        [
            "ArrowLeft",
            () => {
                if (!loading && !addEditModalOpened) setSelected([opeListItems[0].id]);
            }
        ],
        [
            "ArrowRight",
            () => {
                if (!loading && !addEditModalOpened) setSelected([opeListItems[opeListItems.length - 1].id]);
            }
        ]
    ]);

    const focusTrapRef = useFocusTrap();

    const outsideRef = useClickOutside(() => {
        if (!addEditModalOpened) setSelected([]);
    });

    return (
        <>
            <Modal
                id="operation-add-edit"
                opened={addEditModalOpened}
                onClose={() => {
                    setAddEditModalOpened(false);
                }}
                title={
                    walletItem.name +
                    " - " +
                    (!addEditForm.values.id
                        ? addEditForm.values.type === "operation"
                            ? "Nouvelle opération financière"
                            : "Nouveau transfert"
                        : addEditForm.values.type === "operation"
                        ? "Opération financière"
                        : "Transfert entre compte")
                }
                overlayColor={app.theme.colorScheme === "dark" ? app.theme.colors.dark[9] : app.theme.colors.gray[2]}
                overlayOpacity={0.55}
                overlayBlur={3}
                size={"md"}
            >
                <Stack py={"md"} spacing={"xs"}>
                    <DatePicker
                        label={"Date de valeur"}
                        withAsterisk={true}
                        clearable={false}
                        locale={packagejson.i18n.defaultLocale}
                        inputFormat={getDatePattern(packagejson.i18n.defaultLocale, true)}
                        icon={<IconCalendar size={16} />}
                        {...addEditForm.getInputProps("date")}
                        rightSection={
                            <Tooltip label={"Aujourd'hui"} withinPortal={true} withArrow={true}>
                                <ActionIcon
                                    variant={"transparent"}
                                    color={"gray.5"}
                                    onClick={() => {
                                        addEditForm.setValues((current) => ({ ...current, date: new Date() }));
                                    }}
                                >
                                    <IconX size={16} stroke={1.5} />
                                </ActionIcon>
                            </Tooltip>
                        }
                    />
                    {addEditForm.values.type === "operation" && (
                        <Select
                            label={"Tiers"}
                            withAsterisk={true}
                            data={memoizedThirdparties}
                            icon={<IconUsers size={16} />}
                            clearable={true}
                            searchable={true}
                            nothingFound={"inconnu au bataillon!"}
                            creatable={true}
                            getCreateLabel={(query) => `+ Ajouter ${query}`}
                            onCreate={(query) => {
                                const item = { id: `thirdparty_${uid()}`, name: query };
                                const selectItem = { label: item.name, value: item.id };
                                app.setThirdparties([...app.wallet.thirdparties, item]);
                                return selectItem;
                            }}
                            {...addEditForm.getInputProps("thirdpartyId")}
                        />
                    )}
                    {addEditForm.values.type === "transfer" && (
                        <Select
                            label={"Destination"}
                            withAsterisk={true}
                            data={memoizedWalletItems}
                            icon={<IconBuildingBank size={16} />}
                            clearable={true}
                            searchable={true}
                            nothingFound={"inconnu au bataillon!"}
                            {...addEditForm.getInputProps("fromWalletItemId")}
                        />
                    )}
                    <Space h={"xs"} />
                    <TextInput
                        placeholder=""
                        label="Dénomination"
                        description="Minimum 2 caractères"
                        icon={<IconTag size={14} />}
                        {...addEditForm.getInputProps("title")}
                        withAsterisk={true}
                    />
                    <TextInput
                        placeholder=""
                        label="Commentaire"
                        icon={<IconQuote size={14} />}
                        {...addEditForm.getInputProps("comment")}
                        withAsterisk={false}
                    />
                    {addEditForm.values.type === "operation" && (
                        <>
                            <Space h={"xs"} />
                            <Select
                                label={"Catégorie"}
                                data={memoizedCategories}
                                icon={<IconCategory size={16} />}
                                clearable={true}
                                searchable={true}
                                nothingFound={"inconnue au bataillon!"}
                                {...addEditForm.getInputProps("categoryId")}
                                withAsterisk={true}
                                creatable={true}
                                getCreateLabel={(query) => `+ Ajouter ${query}`}
                                onCreate={(query) => {
                                    const item = { id: `category_${uid()}`, name: query, parentId: null };
                                    const selectItem = { label: item.name, value: item.id };
                                    app.setCategories([...app.wallet.categories, item]);
                                    return selectItem;
                                }}
                            />
                            <Select
                                label={"Moyen de paiement"}
                                data={memoizedPaytypes}
                                icon={<IconCash size={16} />}
                                clearable={true}
                                searchable={true}
                                nothingFound={"inconnue au bataillon!"}
                                {...addEditForm.getInputProps("paytypeId")}
                                withAsterisk={true}
                                creatable={true}
                                getCreateLabel={(query) => `+ Ajouter ${query}`}
                                onCreate={(query) => {
                                    const item = { id: `paytype_${uid()}`, name: query };
                                    const selectItem = { label: item.name, value: item.id };
                                    app.setPaytypes([...app.wallet.paytypes, item]);
                                    return selectItem;
                                }}
                            />
                        </>
                    )}
                    <Space h={"xs"} />
                    <NumberInput
                        label={"Montant"}
                        description={"Un montant négatif signifie un débit, un montant positif, un crédit."}
                        precision={2}
                        step={0.01}
                        icon={<IconCurrencyEuro size={18} />}
                        {...addEditForm.getInputProps("amount")}
                        withAsterisk={true}
                        styles={{ input: { color: addEditForm.values.amount < 0 ? "red" : "inherit" } }}
                        data-autofocus={true}
                    />
                    <Checkbox
                        label={"Opération rapprochée"}
                        {...addEditForm.getInputProps("state", { type: "checkbox" })}
                    />
                </Stack>
                <Group position="right" mt="xl">
                    <Button
                        variant="default"
                        onClick={() => {
                            setAddEditModalOpened(false);
                        }}
                        disabled={saving}
                    >
                        Annuler
                    </Button>
                    <Tooltip label={"Enregistrer et Conserver les informations"}>
                        <Button
                            variant="default"
                            onClick={() => {
                                saveOpe();
                                addEditForm.setValues((current) => ({ ...current, id: null }));
                            }}
                            disabled={saving}
                            loading={saving}
                        >
                            Enregistrer
                        </Button>
                    </Tooltip>
                    <Tooltip label={"Enregistrer et Quitter"}>
                        <Button
                            type="submit"
                            onClick={() => {
                                saveOpe(true);
                            }}
                            disabled={saving}
                            loading={saving}
                        >
                            Valider
                        </Button>
                    </Tooltip>
                </Group>
            </Modal>

            <Stack>
                {useMemo(
                    () => (
                        <WalletResumeBox item={walletItem} />
                    ),
                    [walletItem, app.currentDate]
                )}

                <Tabs
                    defaultValue={"details"}
                    sx={(theme) => ({ display: "flex", flexDirection: "column", minHeight: "100%" })}
                    ref={focusTrapRef}
                >
                    <Tabs.List>
                        <Tabs.Tab value="details" icon={<IconListDetails size={14} />}>
                            Détails du compte
                        </Tabs.Tab>
                        <Tabs.Tab value="calendar" icon={<IconCalendar size={14} />}>
                            Calendrier
                        </Tabs.Tab>
                        <Tabs.Tab value="planner" icon={<IconCalendarEvent size={14} />}>
                            Planification
                        </Tabs.Tab>
                    </Tabs.List>
                    <Tabs.Panel value="details" pt={"md"} sx={(theme) => ({ flex: "1 1 auto" })} ref={outsideRef}>
                        <Stack>
                            <Group position={"left"} spacing={"xs"}>
                                <Tooltip
                                    label={"Ajouter une opération (Ctrl+Alt+N)"}
                                    withinPortal={true}
                                    withArrow={true}
                                >
                                    <ActionIcon
                                        size="md"
                                        variant={"filled"}
                                        color={app.theme.colors.gray[7]}
                                        disabled={loading}
                                        onClick={() => {
                                            openOpe("operation", true);
                                        }}
                                    >
                                        <IconPlus size={16} stroke={2.5} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip
                                    label={"Ajouter un transfert (Ctrl+Alt+T)"}
                                    withinPortal={true}
                                    withArrow={true}
                                >
                                    <ActionIcon
                                        size="md"
                                        variant={"filled"}
                                        color={app.theme.colors.gray[7]}
                                        disabled={loading}
                                        onClick={() => {
                                            openOpe("transfer", true);
                                        }}
                                    >
                                        <IconArrowsTransferDown size={16} stroke={2.5} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={"Modifier (Entrée)"} withinPortal={true} withArrow={true}>
                                    <ActionIcon
                                        size="md"
                                        variant={"subtle"}
                                        color={"dark"}
                                        disabled={loading || selected.length !== 1}
                                        onClick={() => {
                                            openOpe();
                                        }}
                                    >
                                        <IconEdit size={16} stroke={2} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={"Supprimer (Suppr)"} withinPortal={true} withArrow={true}>
                                    <ActionIcon
                                        size="md"
                                        variant={"outline"}
                                        color={"red.9"}
                                        disabled={loading || selected.length < 1}
                                        onClick={() => {
                                            deleteOpe(opeListItems.filter((item) => selected.includes(item.id)));
                                        }}
                                    >
                                        <IconTrash size={16} stroke={2} />
                                    </ActionIcon>
                                </Tooltip>
                                <Divider orientation={"vertical"} />
                                <Tooltip label={"Rapprocher"} withinPortal={true} withArrow={true}>
                                    <ActionIcon
                                        size="md"
                                        variant={"subtle"}
                                        color={"dark"}
                                        disabled={loading || selected.length < 1}
                                        onClick={() => {
                                            setOpeListItems((current) => {
                                                const newItems = current
                                                    .map((item) => {
                                                        if (selected.includes(item.id)) {
                                                            return { ...item, state: item.state === 1 ? 0 : 1 };
                                                        }
                                                        return null;
                                                    })
                                                    .filter((r) => r !== null);

                                                const { updated } = compareOpeListItems(newItems, current);
                                                if (updated && updated.length > 0) {
                                                    const updatedIds = updated.map((u) => u.id);
                                                    const old = current.filter((c) => !updatedIds.includes(c.id));

                                                    updateOpe(updated);

                                                    return [...old, ...updated];
                                                }
                                                return current;
                                            });
                                        }}
                                    >
                                        <IconRotateRectangle size={16} stroke={2} />
                                    </ActionIcon>
                                </Tooltip>
                                <Divider orientation={"vertical"} />
                                <Tooltip label={"Rafraichir (Ctrl+Alt+F5)"} withinPortal={true} withArrow={true}>
                                    <ActionIcon
                                        size="md"
                                        variant={"subtle"}
                                        color={"dark"}
                                        onClick={() => loadOpeList()}
                                        loading={loading}
                                        disabled={loading}
                                    >
                                        <IconRefresh size={16} stroke={2} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip
                                    label={`${filtersOpened ? "Cacher" : "Afficher"} les filtres (Ctrl+Alt+F)`}
                                    withinPortal={true}
                                    withArrow={true}
                                >
                                    <ActionIcon
                                        size="md"
                                        variant={filtersOpened ? "filled" : "subtle"}
                                        color={filtersOpened ? "yellow.5" : "dark"}
                                        onClick={() => setFiltersOpened((old) => !old)}
                                        disabled={loading}
                                    >
                                        <IconFilter size={16} stroke={2} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip
                                    label={
                                        selected.length !== opeListItems.length
                                            ? `Tout sélectionner (${opeListItems.length} opération${
                                                  opeListItems.length > 1 ? "s" : ""
                                              }) (Ctrl+Alt+A)`
                                            : "Tout déselectionner"
                                    }
                                    withinPortal={true}
                                    withArrow={true}
                                >
                                    <ActionIcon
                                        size="md"
                                        variant={"subtle"}
                                        color={"dark"}
                                        onClick={() => {
                                            if (selected.length !== opeListItems.length) {
                                                setSelected(opeListItems.map((o) => o.id));
                                            } else {
                                                setSelected([]);
                                            }
                                        }}
                                        disabled={loading || opeListItems.length === 0}
                                    >
                                        {selected.length === 0 ? (
                                            <IconSquareCheck size={16} stroke={2} />
                                        ) : selected.length === opeListItems.length ? (
                                            <IconSquare size={16} stroke={2} />
                                        ) : (
                                            <IconSquareMinus size={16} stroke={2} />
                                        )}
                                    </ActionIcon>
                                </Tooltip>
                            </Group>

                            {useMemo(
                                () => (
                                    <FiltersBar
                                        walletItemId={walletItem.id}
                                        filters={filters}
                                        visible={filtersOpened}
                                        disabled={loading}
                                        onChange={(view) => {
                                            setFilters((current) => ({ ...current, ...view.filters }));
                                            //setSorter((current) => ({ ...current, ...view.sorter }));
                                        }}
                                    />
                                ),
                                [walletItem.id, filters, filtersOpened, loading]
                            )}

                            {opeListItems && opeListItems.length === 0 && (
                                <Alert icon={<IconAlertCircle size={16} />} title="Oups!" color="gray">
                                    <Text size={"sm"}>Aucune opération correspondante aux filtres sélectionnés!</Text>
                                    <Group spacing={"lg"} position={"left"} mt={"md"}>
                                        <Text
                                            size={"xs"}
                                            fw={500}
                                            variant={"link"}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => openOpe("operation", true)}
                                        >
                                            nouvelle opération
                                        </Text>
                                        <Text
                                            size={"xs"}
                                            fw={500}
                                            variant={"link"}
                                            style={{ cursor: "pointer" }}
                                            onClick={() => openOpe("transfer", true)}
                                        >
                                            nouveau transfert
                                        </Text>
                                        {!filtersOpened && (
                                            <Text
                                                size={"xs"}
                                                fw={500}
                                                variant={"link"}
                                                style={{ cursor: "pointer" }}
                                                onClick={() => setFiltersOpened(true)}
                                            >
                                                ouvrir les filtres
                                            </Text>
                                        )}
                                    </Group>
                                </Alert>
                            )}

                            {useMemo(
                                () => (
                                    <OpeList
                                        walletItem={walletItem}
                                        currency={walletItem.currency}
                                        items={opeListItems}
                                        selected={selected}
                                        onSelect={(ids) => {
                                            if (Array.isArray(ids)) {
                                                setSelected((current) => [
                                                    ...current,
                                                    ...ids.filter((id) => !current.includes(id))
                                                ]);
                                            } else {
                                                setSelected([ids]);
                                            }
                                        }}
                                        onUnselect={(ids) => {
                                            if (Array.isArray(ids)) {
                                                setSelected((current) => current.filter((id) => !ids.includes(id)));
                                            } else {
                                                setSelected((current) => current.filter((id) => id !== ids));
                                            }
                                        }}
                                        onUnselectAll={() => {
                                            setSelected([]);
                                        }}
                                        loading={loading}
                                    />
                                ),
                                [opeListItems, loading, app.currentDate, walletItem, selected, forceRefresh]
                            )}
                        </Stack>
                    </Tabs.Panel>
                    <Tabs.Panel value="calendar" pt={"md"} sx={(theme) => ({ flex: "1 1 auto" })}></Tabs.Panel>
                    <Tabs.Panel value="planner" pt={"md"} sx={(theme) => ({ flex: "1 1 auto" })}></Tabs.Panel>
                </Tabs>
            </Stack>
        </>
    );
}

export default Wallet;
