import packagejson from "../../package.json";
import defaultWalletItemViewFilter from "../../defaults/walletItemViewFilter";
import defaultWalletItemViewSorter from "../../defaults/walletItemViewSorter";
import { defaultWalletCategories } from "../../defaults/walletCategories";

import React, { useCallback, useContext, useLayoutEffect, useMemo, useState } from "react";

import {
    ActionIcon,
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
import { closeAllModals } from "@mantine/modals";
import { useForm } from "@mantine/form";
import { useDebouncedState, useFocusTrap, useHotkeys, useListState } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";

import {
    IconArrowsTransferDown,
    IconBuildingBank,
    IconCalendar,
    IconCalendarEvent,
    IconCash,
    IconCategory,
    IconCheck,
    IconCurrencyEuro,
    IconEdit,
    IconFilter,
    IconListDetails,
    IconPlus,
    IconQuote,
    IconRefresh,
    IconTag,
    IconThumbUp,
    IconTrash,
    IconUsers,
    IconX
} from "@tabler/icons";

import { AppContext } from "./AppProvider";
import FiltersBar from "./FiltersBar";
import WalletResumeBox from "./WalletResumeBox";

import { getDatePattern, getLongDayDatePattern, getLongMonthYearPattern, toSqlDate, uid } from "../../tools";
import { saveOperation } from "../wrappers/wallet_api";
import OpeList from "./OpeList";

function Wallet({
    walletItem,
    walletFilters = defaultWalletItemViewFilter,
    walletSorter = defaultWalletItemViewSorter,
    id = uid(),
    ...props
}) {
    const app = useContext(AppContext);
    const [addEditModalOpened, setAddEditModalOpened] = useState(false);
    const [filtersOpened, setFiltersOpened] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState([]);
    const [saving, setSaving] = useState(false);
    const [opeListItems, setOpeListItems] = useDebouncedState([], 500);
    const [filters, setFilters] = useState({ ...walletFilters });
    const [sorter, setSorter] = useState({ ...walletSorter });

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

    const loadList = () => {
        setLoading(true);
        console.log("load list");
        setOpeListItems((current) => [new Date().toLocaleTimeString("fr")]);
        setLoading(false);
    };

    const openOpe = (type, forceNew = false) => {
        addEditForm.reset();

        let data = {};

        if (selected.length === 0 || forceNew) {
            data = { ...data, type };
            if (type === "transfer") data = { ...data, fromWalletItemId: "" };
        } else {
            data = { ...selected[0] };
        }

        addEditForm.setValues((current) => {
            const newData = { ...current, ...data };
            return newData;
        });

        setAddEditModalOpened(true);
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
                                id: "save-operation-error-notification",
                                disallowClose: true,
                                autoClose: 5000,
                                title: "Impossible d'enregistrer cette opération!",
                                message: errorMessage,
                                color: "red",
                                icon: <IconX size={18} />,
                                loading: false
                            });

                            return;
                        }

                        showNotification({
                            id: "save-operation-notification",
                            disallowClose: true,
                            autoClose: 5000,
                            title: "Opération",
                            message: "Opération enregistrée avec succès.",
                            color: "green",
                            icon: <IconThumbUp size={18} />,
                            loading: false
                        });

                        app.refreshAmounts();

                        if (closeAfterSave) setAddEditModalOpened(false);
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

    const deleteOpe = () => {
        if (selected.length === 0) return;
        console.log("delete");
    };

    useLayoutEffect(() => {
        loadList();
    }, [walletItem, filters, sorter]);

    useHotkeys([
        [
            "mod+alt+N",
            () => {
                if (!loading) openOpe("operation", true);
            }
        ],
        [
            "mod+alt+T",
            () => {
                if (!loading) openOpe("transfer", true);
            }
        ],
        [
            "delete",
            () => {
                if (!loading) deleteOpe();
            }
        ],
        [
            "mod+alt+F",
            () => {
                if (!loading) setFiltersOpened((old) => !old);
            }
        ],
        [
            "mod+alt+F5",
            () => {
                if (!loading) loadList();
            }
        ]
    ]);

    const focusTrapRef = useFocusTrap();

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
                <WalletResumeBox item={walletItem} />

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
                    <Tabs.Panel value="details" pt={"md"} sx={(theme) => ({ flex: "1 1 auto" })}>
                        <Stack data-autofocus={true}>
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
                                            openOpe("operation");
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
                                            openOpe("transfer");
                                        }}
                                    >
                                        <IconArrowsTransferDown size={16} stroke={2.5} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={"Modifier"} withinPortal={true} withArrow={true}>
                                    <ActionIcon
                                        size="md"
                                        variant={"subtle"}
                                        color={"dark"}
                                        disabled={loading || selected.length !== 1}
                                    >
                                        <IconEdit size={16} stroke={1.5} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip label={"Supprimer (Suppr)"} withinPortal={true} withArrow={true}>
                                    <ActionIcon
                                        size="md"
                                        variant={"subtle"}
                                        color={"red"}
                                        disabled={loading || selected.length < 1}
                                        onClick={() => deleteOpe()}
                                    >
                                        <IconTrash size={16} stroke={1.5} />
                                    </ActionIcon>
                                </Tooltip>
                                <Divider orientation={"vertical"} />
                                <Tooltip label={"Rapprocher"} withinPortal={true} withArrow={true}>
                                    <ActionIcon
                                        size="md"
                                        variant={"subtle"}
                                        color={"dark"}
                                        disabled={loading || selected.length < 1}
                                    >
                                        <IconCheck size={16} stroke={1.5} />
                                    </ActionIcon>
                                </Tooltip>
                                <Divider orientation={"vertical"} />
                                <Tooltip label={"Rafraichir (Ctrl+Alt+F5)"} withinPortal={true} withArrow={true}>
                                    <ActionIcon
                                        size="md"
                                        variant={"subtle"}
                                        color={"dark"}
                                        onClick={() => loadList()}
                                        loading={loading}
                                        disabled={loading}
                                    >
                                        <IconRefresh size={16} stroke={1.5} />
                                    </ActionIcon>
                                </Tooltip>
                                <Tooltip
                                    label={`${filtersOpened ? "Désactiver" : "Activer"} les filtres (Ctrl+Alt+F)`}
                                    withinPortal={true}
                                    withArrow={true}
                                >
                                    <ActionIcon
                                        size="md"
                                        variant={filtersOpened ? "filled" : "subtle"}
                                        color={filtersOpened ? "yellow" : "dark"}
                                        onClick={() => setFiltersOpened((old) => !old)}
                                        disabled={loading}
                                    >
                                        <IconFilter size={16} stroke={1.5} />
                                    </ActionIcon>
                                </Tooltip>
                            </Group>

                            <FiltersBar
                                walletItemId={walletItem.id}
                                filters={filters}
                                visible={filtersOpened}
                                onChange={() => {
                                    loadList();
                                }}
                                disabled={loading}
                            />

                            <OpeList
                                items={opeListItems}
                                selected={selected}
                                onSelect={(ids) => {
                                    setSelected(Array.isArray(ids) ? ids : [ids]);
                                }}
                            />
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
