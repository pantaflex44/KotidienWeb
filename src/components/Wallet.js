import packagejson from "../../package.json";

import defaultWalletItemViewFilter from "../../defaults/walletItemViewFilter";
import defaultWalletItemViewSorter from "../../defaults/walletItemViewSorter";
import { defaultWalletCategories } from "../../defaults/walletCategories";

import dayjs from "dayjs";
import { jsPDF } from "jspdf";
import ofx from "@wademason/ofx";

import React, { memo, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

import {
    ActionIcon,
    Alert,
    Button,
    Checkbox,
    Divider,
    Group,
    Menu,
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
import { useClickOutside, useDebouncedState, useFocusTrap, useHotkeys } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";

import {
    IconAlertCircle,
    IconArrowsTransferDown,
    IconBuildingBank,
    IconCalendar,
    IconCalendarEvent,
    IconCash,
    IconCategory,
    IconCheckbox,
    IconCurrencyEuro,
    IconEdit,
    IconFileDownload,
    IconFileExport,
    IconFileImport,
    IconFileInvoice,
    IconFilePercent,
    IconFileText,
    IconFilter,
    IconListDetails,
    IconPlus,
    IconPrinter,
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
import CsvImportModal from "./CsvImportModal";
import OfxImportModal from "./OfxImportModal";

import {
    currencyFormatter,
    downloadFile,
    getDatePattern,
    getFirstDayOfCurrentMonth,
    getLastDayOfCurrentMonth,
    slugify,
    toSqlDate,
    uid,
    printData,
    currencyRound,
    uploadTextFile
} from "../../tools";
import { saveOperation, getOperations, deleteOperations, getAmountAt } from "../wrappers/wallet_api";
import CalendarView from "./CalendarView";

function Wallet({
    walletItem,
    walletFilters = defaultWalletItemViewFilter,
    walletSorter = defaultWalletItemViewSorter
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
    const [importContent, setImportContent] = useState(null);
    const [importOfxContent, setImportOfxContent] = useState(null);
    const [csvImportModalOpened, setCsvImportModalOpened] = useState(false);
    const [ofxImportModalOpened, setOfxImportModalOpened] = useState(false);
    const [appearedDate, setAppearedDate] = useDebouncedState(null, 500);

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

    const exportForm = useForm({
        initialValues: {
            startDate: getFirstDayOfCurrentMonth(),
            endDate: getLastDayOfCurrentMonth()
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
        if (window) document.body.style.cursor = "wait";

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
            if (window) document.body.style.cursor = "default";

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

            if (window) document.body.style.cursor = "default";
        }
    };

    const saveOpe = (closeAfterSave = false) => {
if (window) document.body.style.cursor = "wait";

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

                        if (window) document.body.style.cursor = "default";
                    });
            }
        };

        if (app.expectedSaving) {
            app.saveAsync()
                .then(() => apply())
                .finally(() => {
                    setSaving(false);

                    if (window) document.body.style.cursor = "default";
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
                if (window) document.body.style.cursor = "wait";

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

                if (window) document.body.style.cursor = "default";
            }
        });

        setSaving(true);
    };

    const updateOpe = (items) => {
        if (items.length === 0) return;

        if (window) document.body.style.cursor = "wait";

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

                    if (window) document.body.style.cursor = "default";
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

    const getPublicFormattedOperationsByDates = (startDate, endDate) => {
        const custumFilters = {
            interval: "",
            startDate: dayjs(startDate).format("YYYY-MM-DD"),
            endDate: dayjs(endDate).format("YYYY-MM-DD"),
            types: ["pendings", "incomes", "transfers"],
            paytypes: [],
            categories: [],
            states: "all",
            thirdparties: [],
            hideClosedOperations: false
        };

        const getThirdparty = (id) => {
            const found = app.wallet.thirdparties.filter((t) => t.id === id);
            if (found.length === 1) return found[0];
            return null;
        };

        const getWalletItem = (id) => {
            const found = app.wallet.walletItems.filter((t) => t.id === id);
            if (found.length === 1) return found[0];
            return null;
        };

        const getCategory = (id) => {
            const found = app.wallet.categories.filter((t) => t.id === id);
            if (found.length === 1) return found[0];
            return null;
        };

        const getPaytype = (id) => {
            const found = app.wallet.paytypes.filter((t) => t.id === id);
            if (found.length === 1) return found[0];
            return null;
        };

        return new Promise((resolve, reject) => {
            getOperations(app.wallet.email, walletItem.id, custumFilters).then((response) => {
                const { operations, errorCode, errorMessage } = response;

                if (errorCode !== 0) {
                    showNotification({
                        id: `get-operation-error-notification-${uid()}`,
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Impossible d'exporter les opérations!",
                        message: errorMessage,
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });
                    reject();
                }

                if (operations.length === 0) {
                    showNotification({
                        id: `get-operation-error-notification-${uid()}`,
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Impossible d'exporter les opérations!",
                        message: "Aucune opération à exporter.",
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });
                    reject();
                }

                const items = operations.map((item) => {
                    const itemThirdparty =
                        item.type === "operation"
                            ? getThirdparty(item.thirdpartyId)?.name || "-"
                            : item.type === "transfer"
                            ? getWalletItem(item.amount > 0 ? item.toWalletItemId : item.fromWalletItemId)?.name || "-"
                            : "-";
                    const itemCategory = getCategory(item.categoryId)?.name || "";
                    const itemPaytype = getPaytype(item.paytypeId)?.name || "";
                    const itemFrom =
                        item.amount < 0
                            ? item.type === "transfer"
                                ? "Transfert vers"
                                : "Paiement à"
                            : item.amount > 0
                            ? "Reçu de"
                            : "";

                    const formattedItem = {
                        id: item.id,
                        date: item.date,
                        type: item.type,
                        title: item.title,
                        comment: item.comment,
                        amount: item.amount,
                        currency: "EUR",
                        thirdparty: itemThirdparty,
                        category: itemCategory,
                        paytype: itemPaytype,
                        closed: item.state === 1
                    };
                    return formattedItem;
                });
                resolve(items.sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix()));
            });
        });
    };

    const exportToOfx = () => {
        setLoading(true);

        getPublicFormattedOperationsByDates(exportForm.values.startDate, exportForm.values.endDate)
            .then(async (operations) => {
                const DTSERVER = dayjs().format("YYYYMMDD") + "000000";
                const ORG = packagejson.name.trim().toLowerCase().capitalize();
                const FID = packagejson.version;
                const TRNUID = walletItem.id;
                const BANKID =
                    !walletItem.hasOwnProperty("bankaccountBic") || !walletItem.bankaccountBic
                        ? dayjs().format("YYYYMMDD") + "000000bid"
                        : walletItem.bankaccountBic;
                const ACCTID =
                    !walletItem.hasOwnProperty("bankaccountIban") || !walletItem.bankaccountIban
                        ? dayjs().format("YYYYMMDD") + "000000act"
                        : walletItem.bankaccountIban;
                const DTSTART = dayjs(exportForm.values.startDate).format("YYYYMMDD") + "000000";
                const DTEND = dayjs(exportForm.values.endDate).format("YYYYMMDD") + "000000";

                let lastDate = new Date(Date.parse("1970-01-01"));

                const ofxHeaders = {
                    OFXHEADER: "100",
                    DATA: "OFXSGML",
                    VERSION: "102",
                    SECURITY: "NONE",
                    ENCODING: "USASCII",
                    CHARSET: "1252",
                    COMPRESSION: "NONE",
                    OLDFILEUID: "NONE",
                    NEWFILEUID: "NONE"
                };

                let ofxBody = {
                    OFX: {
                        SIGNONMSGSRSV1: {
                            SONRS: {
                                STATUS: {
                                    CODE: "0",
                                    SEVERITY: "INFO"
                                },
                                DTSERVER,
                                LANGUAGE: "FRA",
                                FI: {
                                    ORG,
                                    FID
                                }
                            }
                        },
                        BANKMSGSRSV1: {
                            STMTTRNRS: {
                                TRNUID,
                                STATUS: {
                                    CODE: "0",
                                    SEVERITY: "INFO"
                                },
                                STMTRS: {
                                    CURDEF: "EUR",
                                    BANKACCTFROM: {
                                        BANKID,
                                        ACCTID,
                                        ACCTTYPE: "CHECKING"
                                    },
                                    BANKTRANLIST: {
                                        DTSTART,
                                        DTEND,
                                        STMTTRN: operations.map((item) => {
                                            if (new Date(Date.parse(item.date)) > lastDate)
                                                lastDate = new Date(Date.parse(item.date));

                                            return {
                                                TRNTYPE:
                                                    item.type === "transfer"
                                                        ? "XFER"
                                                        : item.amount < 0
                                                        ? "DEBIT"
                                                        : "CREDIT",
                                                DTPOSTED: dayjs(item.date).format("YYYYMMDD") + "000000",
                                                TRNAMT: currencyRound(item.amount, 2),
                                                FITID: item.id,
                                                NAME: (
                                                    item.title +
                                                    " " +
                                                    item.thirdparty +
                                                    " " +
                                                    item.category +
                                                    " " +
                                                    item.paytype
                                                )
                                                    .trim()
                                                    .toUpperCase(),
                                                MEMO: item.comment
                                            };
                                        })
                                    },
                                    LEDGERBAL: {
                                        BALAMT: currencyRound(
                                            walletItem.initialAmount +
                                                ((await getAmountAt(app.wallet.email, walletItem.id, lastDate))
                                                    ?.amount || 0),
                                            2
                                        ),
                                        DTASOF: dayjs(lastDate).format("YYYYMMDD") + "000000"
                                    }
                                }
                            }
                        }
                    }
                };

                const ofxData = ofx.serialize(ofxHeaders, ofxBody);

                const filename = `${packagejson.name.trim().toLowerCase().capitalize()}_${slugify(
                    walletItem.name
                )}_${dayjs(exportForm.values.startDate).format("YYYYMMDD")}_${dayjs(exportForm.values.endDate).format(
                    "YYYYMMDD"
                )}.ofx`;

                showNotification({
                    id: `export-operation-notification-${uid()}`,
                    disallowClose: true,
                    autoClose: 5000,
                    title: "Exportation des opérations réussie!",
                    message: "Document envoyé à votre navigateur pour téléchargement.",
                    color: "green",
                    icon: <IconFileDownload size={18} />,
                    loading: false
                });

                downloadFile(filename, ofxData, false, " application/x-ofx");
            })
            .finally(() => setLoading(false));
    };

    const importFromOfx = () => {
        uploadTextFile([".ofx"])
            .then((content) => {
                setImportOfxContent(content);
                setOfxImportModalOpened(true);
            })
            .catch((error) => {
                console.error(error);
                showNotification({
                    id: `import-error-notification-${uid()}`,
                    disallowClose: true,
                    autoClose: 5000,
                    title: "Erreur d'importation!",
                    message: "Impossible d'importer le fichier.",
                    color: "red",
                    icon: <IconX size={18} />,
                    loading: false
                });
            });
    };

    const exportToCsv = () => {
        setLoading(true);

        getPublicFormattedOperationsByDates(exportForm.values.startDate, exportForm.values.endDate)
            .then((operations) => {
                const csv_separators_columns = app.wallet
                    ? app.wallet.params?.csv?.separators?.columns === null ||
                      app.wallet.params?.csv?.separators?.columns === undefined
                        ? ";"
                        : app.wallet.params.csv.separators.columns
                    : ";";
                const csv_separators_decimals = app.wallet
                    ? app.wallet.params?.csv?.separators?.decimals === null ||
                      app.wallet.params?.csv?.separators?.decimals === undefined
                        ? ","
                        : app.wallet.params?.csv?.separators?.decimals
                    : ",";
                const csv_dateformat = app.wallet
                    ? app.wallet.params?.csv?.dateformat === null || app.wallet.params?.csv?.dateformat === undefined
                        ? "DD/MM/YYYY"
                        : app.wallet.params?.csv?.dateformat
                    : "DD/MM/YYYY";

                const formattedOperations = operations.map((item) => {
                    return {
                        ...item,
                        date: dayjs(item.date).format(csv_dateformat),
                        amount: item.amount.toFixed(2).replace(".", csv_separators_decimals)
                    };
                });

                const headers = Object.keys(formattedOperations[0]).join(csv_separators_columns);
                const content = formattedOperations
                    .map((row) => Object.values(row).join(csv_separators_columns))
                    .join("\n");
                const csv = headers + "\n" + content;

                const filename = `${packagejson.name.trim().toLowerCase().capitalize()}_${slugify(
                    walletItem.name
                )}_${dayjs(exportForm.values.startDate).format("YYYYMMDD")}_${dayjs(exportForm.values.endDate).format(
                    "YYYYMMDD"
                )}.csv`;

                showNotification({
                    id: `export-operation-notification-${uid()}`,
                    disallowClose: true,
                    autoClose: 5000,
                    title: "Exportation des opérations réussie!",
                    message: "Document envoyé à votre navigateur pour téléchargement.",
                    color: "green",
                    icon: <IconFileDownload size={18} />,
                    loading: false
                });

                downloadFile(filename, csv, false, "text/csv");
            })
            .finally(() => setLoading(false));
    };

    const importFromCsv = () => {
        uploadTextFile([".csv"])
            .then((content) => {
                setImportContent(content);
                setCsvImportModalOpened(true);
            })
            .catch((error) => {
                console.error(error);
                showNotification({
                    id: `import-error-notification-${uid()}`,
                    disallowClose: true,
                    autoClose: 5000,
                    title: "Erreur d'importation!",
                    message: "Impossible d'importer le fichier.",
                    color: "red",
                    icon: <IconX size={18} />,
                    loading: false
                });
            });
    };

    const exportToPdf = (print = false) => {
        setLoading(true);

        getPublicFormattedOperationsByDates(exportForm.values.startDate, exportForm.values.endDate)
            .then(async (operations) => {
                let datted = {};
                operations.map((item) => {
                    if (!datted.hasOwnProperty(item.date)) datted[item.date] = [];
                    const { date, ...rest } = item;
                    datted[item.date].push(rest);
                });

                let amounts = {};
                await Promise.all(
                    Object.keys(datted).map(async (date) => {
                        amounts[date] =
                            walletItem.initialAmount +
                            ((await getAmountAt(app.wallet.email, walletItem.id, new Date(Date.parse(date))))?.amount ||
                                0);
                    })
                );

                const doc = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "a4",
                    putOnlyUsedFonts: true,
                    floatPrecision: 16,
                    compress: true
                });
                doc.setLanguage(packagejson.i18n.defaultLocale);
                doc.setProperties({
                    title: `${walletItem.name} du ${dayjs(exportForm.values.startDate).format(
                        getDatePattern(packagejson.i18n.defaultLocale, false)
                    )} au ${dayjs(exportForm.values.endDate).format(
                        getDatePattern(packagejson.i18n.defaultLocale, false)
                    )}`,
                    creator: packagejson.name.trim().toLowerCase().capitalize()
                });

                const pageWidth = doc.internal.pageSize.getWidth();
                const pageHeight = doc.internal.pageSize.getHeight();
                const defaultFontSize = doc.getFontSize();
                const initialTop = 22;
                const fontFamilly = "helvetica";
                const headerFontSize = defaultFontSize - 8;
                const titleFontSize = defaultFontSize - 6;
                const normalFontSize = defaultFontSize - 7;
                const smallFontSize = defaultFontSize - 8;
                let currentTop = initialTop;
                let currentPage = 1;

                const drawHeader = () => {
                    const headerLeft = `${walletItem.name} du ${dayjs(exportForm.values.startDate).format(
                        getDatePattern(packagejson.i18n.defaultLocale, false)
                    )} au ${dayjs(exportForm.values.endDate).format(
                        getDatePattern(packagejson.i18n.defaultLocale, false)
                    )}`;
                    const headerRight = `Page ${currentPage}`;
                    const headerRightWidth = doc.getStringUnitWidth(headerRight) * headerFontSize;
                    doc.setFont(fontFamilly, "normal");
                    doc.setFontSize(headerFontSize);
                    doc.text(headerLeft, 7, 7);
                    doc.text(headerRight, pageWidth - headerRightWidth, 7);
                };

                const isNewPageNeeded = (fontSize) => {
                    if (currentTop > pageHeight - 10 - fontSize) {
                        doc.addPage();
                        currentPage++;
                        drawHeader();
                        currentTop = initialTop;
                    }
                };

                drawHeader();

                Object.keys(datted).map(async (date) => {
                    isNewPageNeeded(titleFontSize);

                    const formattedDate = dayjs(date)
                        .locale(packagejson.i18n.defaultLocale)
                        .format(getDatePattern(packagejson.i18n.defaultLocale, true));
                    const totalAmountFormatted = currencyFormatter(amounts[date] || 0)
                        .replace("\u202f", " ")
                        .replace("\u00a0", " ")
                        .replace("\u20ac", "€");

                    const text = `${formattedDate}, solde: ${totalAmountFormatted}`;
                    console.log(text);

                    doc.setDrawColor("#000");
                    doc.setFont(fontFamilly, "normal");
                    doc.setFontSize(titleFontSize);
                    doc.text(text, 7, currentTop, { charSpace: 0 });
                    doc.setLineWidth(0.1);
                    doc.line(7, currentTop + 1.5, pageWidth - 7, currentTop + 1.5);

                    currentTop += titleFontSize;

                    datted[date].map((item) => {
                        isNewPageNeeded(normalFontSize);

                        const formattedAmount = currencyFormatter(item.amount)
                            .replace("\u202f", " ")
                            .replace("\u00a0", " ")
                            .replace("\u20ac", "€");

                        doc.setFont(fontFamilly, "bold");
                        doc.setFontSize(normalFontSize);
                        doc.text(item.title, 7, currentTop);
                        doc.text(formattedAmount, (pageWidth / 4) * 3, currentTop);

                        doc.setFont(fontFamilly, "normal");
                        currentTop += 5;
                        doc.setFontSize(smallFontSize);
                        doc.text(item.comment || "(aucun commentaire)", 7, currentTop);
                        currentTop += 5;
                        doc.setFontSize(normalFontSize);
                        doc.text(item.thirdparty, 7, currentTop);
                        doc.text(item.category, pageWidth / 2, currentTop);
                        doc.text(item.paytype, (pageWidth / 4) * 3, currentTop);

                        doc.setLineWidth(0.1);
                        doc.setDrawColor("#CCC");
                        doc.line(7, currentTop + 1.5, pageWidth - 7, currentTop + 1.5);

                        currentTop += normalFontSize + 2;
                    });
                });

                if (print) {
                    printData(doc.output("blob"), true);
                } else {
                    const filename = `${packagejson.name.trim().toLowerCase().capitalize()}_${slugify(
                        walletItem.name
                    )}_${dayjs(exportForm.values.startDate).format("YYYYMMDD")}_${dayjs(
                        exportForm.values.endDate
                    ).format("YYYYMMDD")}.pdf`;

                    downloadFile(filename, doc.output("blob"), true);
                }

                showNotification({
                    id: `export-operation-notification-${uid()}`,
                    disallowClose: true,
                    autoClose: 5000,
                    title: "Exportation des opérations réussie!",
                    message: print
                        ? "Document envoyé à votre serveur d'impression."
                        : "Document envoyé à votre navigateur pour téléchargement.",
                    color: "green",
                    icon: print ? <IconPrinter size={18} /> : <IconFileDownload size={18} />,
                    loading: false
                });
            })
            .finally(() => setLoading(false));
    };

    const loadOpeList = useCallback(
        (custumFilters = null) => {
            if(window) document.body.style.cursor = "wait";

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

                    if (window) document.body.style.cursor = "default";
                });
        },
        [walletItem.id, filters, app.currentDate, forceRefresh]
    );

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
        ]
    ]);

    const focusTrapRef = useFocusTrap();

    const outsideRef = useClickOutside(() => {
        if (!addEditModalOpened) setSelected([]);
    });

    const walletItemName = useMemo(
        () =>
            walletItem.name +
            " - " +
            (!addEditForm.values.id
                ? addEditForm.values.type === "operation"
                    ? "Nouvelle opération financière"
                    : "Nouveau transfert"
                : addEditForm.values.type === "operation"
                ? "Opération financière"
                : "Transfert entre compte"),
        [walletItem.name, addEditForm.values.id, addEditForm.values.type]
    );

    const longDatePattern = getDatePattern(packagejson.i18n.defaultLocale, true);
    const shortDatePattern = getDatePattern(packagejson.i18n.defaultLocale, false);

    const goToday = () => {
        addEditForm.setValues((current) => ({ ...current, date: new Date() }));
    };

    const deleteOperation = () => {
        deleteOpe(opeListItems.filter((item) => selected.includes(item.id)));
    };

    const closeOperation = () => {
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
    };

    const memoizedResumebox = useMemo(() => <WalletResumeBox item={walletItem} />, [walletItem, app.currentDate]);

    const memoizedFiltersbar = useMemo(
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
    );

    const selectOperations = (ids) => {
        if (Array.isArray(ids)) {
            setSelected((current) => [...current, ...ids.filter((id) => !current.includes(id))]);
        } else {
            setSelected([ids]);
        }
    };

    const unselectOperations = (ids) => {
        if (Array.isArray(ids)) {
            setSelected((current) => current.filter((id) => !ids.includes(id)));
        } else {
            setSelected((current) => current.filter((id) => id !== ids));
        }
    };

    const unselectAll = () => {
        setSelected([]);
    };

    const changeAppearedDate = useCallback(
        (date) => {
            setAppearedDate(date);
        },
        [appearedDate]
    );

    const memoizedItems = useMemo(
        () => (
            <OpeList
                walletItem={walletItem}
                currency={walletItem.currency}
                items={opeListItems}
                selected={selected}
                onSelect={selectOperations}
                onUnselect={unselectOperations}
                onUnselectAll={unselectAll}
                loading={loading}
                onDateAppear={changeAppearedDate}
            />
        ),
        [opeListItems, loading, app.currentDate, walletItem, selected, forceRefresh]
    );

    const memoizedCalendarView = useMemo(
        () => (
            <CalendarView
                walletItem={walletItem}
                items={opeListItems}
                onDateChange={([startDate, endDate]) => {
                    setFilters((current) => ({ ...current, interval: "", startDate, endDate }));
                }}
            />
        ),
        [opeListItems, walletItem]
    );

    return (
        <>
            {addEditModalOpened && (
                <Modal
                    id="operation-add-edit"
                    opened={addEditModalOpened}
                    onClose={() => {
                        setAddEditModalOpened(false);
                    }}
                    title={walletItemName}
                    overlayColor={
                        app.theme.colorScheme === "dark" ? app.theme.colors.dark[9] : app.theme.colors.gray[2]
                    }
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
                            inputFormat={longDatePattern}
                            icon={<IconCalendar size={16} />}
                            {...addEditForm.getInputProps("date")}
                            rightSection={
                                <Tooltip label={"Aujourd'hui"} withinPortal={true} withArrow={true}>
                                    <ActionIcon variant={"transparent"} color={"gray.5"} onClick={goToday}>
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
            )}

            <CsvImportModal
                walletItem={walletItem}
                csvContent={importContent}
                visible={csvImportModalOpened}
                onClose={() => {
                    setImportContent(null);
                    setCsvImportModalOpened(false);
                }}
                onSaved={(savedIds) => {
                    app.refreshAmounts();
                    loadOpeList();
                    setSelected(savedIds);
                }}
            />

            <OfxImportModal
                walletItem={walletItem}
                ofxContent={importOfxContent}
                visible={ofxImportModalOpened}
                onClose={() => {
                    setImportOfxContent(null);
                    setOfxImportModalOpened(false);
                }}
                onSaved={(savedIds) => {
                    app.refreshAmounts();
                    loadOpeList();
                    setSelected(savedIds);
                }}
            />

            <Stack>
                {memoizedResumebox}

                <Tabs
                    defaultValue={app.wallet?.params?.views?.walletTab || "calendar"}
                    sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}
                    ref={focusTrapRef}
                    keepMounted={false}
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

                    <Tabs.Panel value={"details"} pt={"md"} sx={{ flex: "1 1 auto" }} ref={outsideRef}>
                        <Stack>
                            <Group
                                position={"left"}
                                spacing={"xs"}
                                p={"xs"}
                                style={{
                                    position: "sticky",
                                    top: "80px",
                                    zIndex: 1,
                                    backdropFilter: "blur(10px)",
                                    backgroundColor: app.theme.fn.rgba(app.theme.white, 0.5),
                                    borderRadius: "5px"
                                }}
                            >
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
                                        onClick={() => openOpe("operation", true)}
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
                                        onClick={() => openOpe("transfer", true)}
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
                                        onClick={() => openOpe()}
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
                                        onClick={deleteOperation}
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
                                        onClick={closeOperation}
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
                                        onClick={loadOpeList}
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
                                            <IconCheckbox size={16} stroke={2} />
                                        ) : selected.length === opeListItems.length ? (
                                            <IconSquare size={16} stroke={2} />
                                        ) : (
                                            <IconSquareMinus size={16} stroke={2} />
                                        )}
                                    </ActionIcon>
                                </Tooltip>
                                <Divider orientation={"vertical"} />
                                <Menu shadow="md" width={200} disabled={loading} withArrow={true} withinPortal={true}>
                                    <Menu.Target>
                                        <Tooltip label={"Importer"} withinPortal={true} withArrow={true}>
                                            <ActionIcon size="md" variant={"subtle"} color={"dark"} disabled={loading}>
                                                <IconFileImport size={16} stroke={2} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Label>Importer au format</Menu.Label>
                                        <Menu.Item icon={<IconFileText size={14} />} onClick={importFromCsv}>
                                            Format CSV
                                        </Menu.Item>
                                        <Menu.Item icon={<IconFilePercent size={14} />} onClick={importFromOfx}>
                                            Format OFXimport CalendarView from './CalendarView';
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                                <Menu
                                    shadow="md"
                                    width={250}
                                    disabled={loading || opeListItems.length === 0}
                                    withArrow={true}
                                    withinPortal={true}
                                >
                                    <Menu.Target>
                                        <Tooltip label={"Imprimer / Exporter"} withinPortal={true} withArrow={true}>
                                            <ActionIcon
                                                size="md"
                                                variant={"subtle"}
                                                color={"dark"}
                                                disabled={loading || opeListItems.length === 0}
                                            >
                                                <IconFileExport size={16} stroke={2} />
                                            </ActionIcon>
                                        </Tooltip>
                                    </Menu.Target>
                                    <Menu.Dropdown>
                                        <Menu.Label>
                                            <Stack spacing={"xs"}>
                                                <Text>Exporter au format</Text>
                                                <Group style={{ flexWrap: "nowrap" }} position="apart">
                                                    <Text>du</Text>
                                                    <DatePicker
                                                        clearable={false}
                                                        locale={packagejson.i18n.defaultLocale}
                                                        inputFormat={getDatePattern(
                                                            packagejson.i18n.defaultLocale,
                                                            false
                                                        )}
                                                        {...exportForm.getInputProps("startDate")}
                                                        rightSection={
                                                            <Tooltip
                                                                label={"Premier jour du mois courant"}
                                                                withinPortal={true}
                                                                withArrow={true}
                                                            >
                                                                <ActionIcon
                                                                    variant={"transparent"}
                                                                    color={"gray.5"}
                                                                    onClick={() => {
                                                                        exportForm.setValues((current) => ({
                                                                            ...current,
                                                                            startDate: getFirstDayOfCurrentMonth()
                                                                        }));
                                                                    }}
                                                                >
                                                                    <IconX size={16} stroke={1.5} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        }
                                                        size="xs"
                                                        maxDate={exportForm.values.endDate}
                                                    />
                                                </Group>
                                                <Group style={{ flexWrap: "nowrap" }} position="apart">
                                                    <Text>au</Text>
                                                    <DatePicker
                                                        clearable={false}
                                                        locale={packagejson.i18n.defaultLocale}
                                                        inputFormat={getDatePattern(
                                                            packagejson.i18n.defaultLocale,
                                                            false
                                                        )}
                                                        {...exportForm.getInputProps("endDate")}
                                                        rightSection={
                                                            <Tooltip
                                                                label={"Dernier jour du mois courant"}
                                                                withinPortal={true}
                                                                withArrow={true}
                                                            >
                                                                <ActionIcon
                                                                    variant={"transparent"}
                                                                    color={"gray.5"}
                                                                    onClick={() => {
                                                                        exportForm.setValues((current) => ({
                                                                            ...current,
                                                                            endDate: getLastDayOfCurrentMonth()
                                                                        }));
                                                                    }}
                                                                >
                                                                    <IconX size={16} stroke={1.5} />
                                                                </ActionIcon>
                                                            </Tooltip>
                                                        }
                                                        size="xs"
                                                        minDate={exportForm.values.startDate}
                                                    />
                                                </Group>
                                                <Divider variant="dotted" />
                                            </Stack>
                                        </Menu.Label>
                                        <Menu.Item icon={<IconFileText size={14} />} onClick={() => exportToCsv()}>
                                            Format CSV
                                        </Menu.Item>
                                        <Menu.Item icon={<IconFileInvoice size={14} />} onClick={() => exportToPdf()}>
                                            Format PDF
                                        </Menu.Item>
                                        <Menu.Item icon={<IconFilePercent size={14} />} onClick={() => exportToOfx()}>
                                            Format OFX
                                        </Menu.Item>
                                        <Menu.Item icon={<IconPrinter size={14} />} onClick={() => exportToPdf(true)}>
                                            Imprimer
                                        </Menu.Item>
                                    </Menu.Dropdown>
                                </Menu>
                            </Group>

                            {memoizedFiltersbar}

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

                            {memoizedItems}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="calendar" pt={"md"} sx={{ flex: "1 1 auto" }}>
                        {memoizedCalendarView}
                    </Tabs.Panel>

                    <Tabs.Panel
                        value="planner"
                        pt={"md"}
                        sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column", minHeight: "100%" }}
                    ></Tabs.Panel>
                </Tabs>
            </Stack>
        </>
    );
}

export default memo(
    Wallet,
    (p, n) =>
        p.walletItem.id === n.walletItem.id &&
        JSON.stringify(p.walletFilters) === JSON.stringify(n.walletFilters) &&
        JSON.stringify(p.walletSorter) === JSON.stringify(n.walletSorter)
);
