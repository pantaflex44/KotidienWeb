import packagejson from "../../package.json";

import React, { useContext, useEffect, useLayoutEffect, useState } from "react";

import { Button, Group, Modal, Select, Stack, Stepper, Text } from "@mantine/core";
import { IconArrowLeft, IconThumbUp, IconX } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import { toSqlDate, uid } from "../../tools";
import OpeImportList from "./OpeImportList";
import moment from "moment/moment";
import { saveOperations } from "../wrappers/wallet_api";
import { showNotification } from "@mantine/notifications";

function CsvImportModal({
    walletItem,
    csvContent = "",
    visible = false,
    initialValue = false,
    onClose = null,
    onSaved = null
}) {
    const app = useContext(AppContext);
    const [opened, setOpened] = useState(initialValue);
    const [active, setActive] = useState(0);
    const [lines, setLines] = useState([]);
    const [data, setData] = useState([]);
    const [dataToImport, setDataToImport] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [csvImportChoices, setCsvImportChoices] = useState({
        title: "",
        comment: "",
        date: "",
        state: "",
        amount: "",
        categoryId: "",
        paytypeId: "",
        thirdpartyId: ""
    });
    const [saving, setSaving] = useState(false);

    const nextStep = () => setActive((current) => (current < 3 ? current + 1 : current));
    const prevStep = () => setActive((current) => (current > 0 ? current - 1 : current));

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

    const getHeaderIndex = (headerName) => {
        if (!Array.isArray(headers)) return null;
        if (headers.length === 0) return null;
        if (typeof headerName !== "string") return null;
        if (headerName === "") return null;

        const index = headers.findIndex((item) => {
            return item.value.toLowerCase() === headerName.toLowerCase();
        });
        if (index === -1) return null;

        return index;
    };

    const getPaytypeId = (paytypeName) => {
        if (!Array.isArray(app.wallet.paytypes)) return "";
        if (app.wallet.paytypes.length === 0) return "";
        if (typeof paytypeName !== "string") return "";
        if (paytypeName === "") return "";

        const index = app.wallet.paytypes.findIndex((item) => {
            return item.name.toLowerCase() === paytypeName.toLowerCase();
        });
        if (index === -1) return "";

        return app.wallet.paytypes[index].id;
    };

    const getThirdpartyId = (thirdpartyName) => {
        if (!Array.isArray(app.wallet.thirdparties)) return "";
        if (app.wallet.thirdparties.length === 0) return "";
        if (typeof thirdpartyName !== "string") return "";
        if (thirdpartyName === "") return "";

        const index = app.wallet.thirdparties.findIndex((item) => {
            return item.name.toLowerCase() === thirdpartyName.toLowerCase();
        });
        if (index === -1) return "";

        return app.wallet.thirdparties[index].id;
    };

    const getCategoryId = (categoryName) => {
        if (!Array.isArray(app.wallet.categories)) return "";
        if (app.wallet.categories.length === 0) return "";
        if (typeof categoryName !== "string") return "";
        if (categoryName === "") return "";

        const index = app.wallet.categories.findIndex((item) => {
            return item.name.toLowerCase() === categoryName.toLowerCase();
        });
        if (index === -1) return "";

        return app.wallet.categories[index].id;
    };

    const importSelected = () => {
        setSaving(true);

        let opeToSave = [];
        dataToImport.forEach((item) => {
            opeToSave.push({
                id: item.id,
                type: "operation",
                comment: item.comment,
                title: item.title,
                date: toSqlDate(item.date),
                state: item.state,
                toWalletItemId: item.toWalletItemId,
                amount: item.amount,
                categoryId: item.categoryId,
                paytypeId: item.paytypeId,
                thirdpartyId: item.thirdpartyId
            });
        });

        saveOperations(app.wallet.email, opeToSave)
            .then((response) => {
                const { saved, errorCode, errorMessage } = response;

                if (!saved || errorCode !== 0) {
                    showNotification({
                        id: `save-operations-error-notification-${uid()}`,
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Impossible d'importer les transactions sélectionnées'!",
                        message: errorMessage,
                        color: "red",
                        icon: <IconX size={18} />,
                        loading: false
                    });
                } else {
                    showNotification({
                        id: `save-operations-notification-${uid()}`,
                        disallowClose: true,
                        autoClose: 5000,
                        title: "Opération",
                        message: "Transactions importées avec succès.",
                        color: "green",
                        icon: <IconThumbUp size={18} />,
                        loading: false
                    });

                    if (onSaved) onSaved(dataToImport.map((d) => d.id));

                    setOpened(false);
                }
            })
            .finally(() => {
                setSaving(false);
            });
    };

    useEffect(() => {
        setOpened(visible);
    }, [visible]);

    useEffect(() => {
        if (!opened) {
            if (onClose) onClose();
        }
    }, [opened]);

    useEffect(() => {
        if (typeof csvContent === "string") {
            setLines(csvContent.replaceAll("\r", "").split("\n"));
        } else {
            setLines([]);
        }
    }, [csvContent]);

    useEffect(() => {
        if (Array.isArray(lines) && lines.length > 0) {
            setHeaders(
                lines[0]
                    .split(csv_separators_columns)
                    .map((name) => {
                        return name ? { value: name, label: `CSV: ${name}` } : null;
                    })
                    .filter((l) => l !== null)
            );
        } else {
            setHeaders([]);
        }
    }, [lines]);

    useEffect(() => {
        if (headers.length > 0) {
            const findInHeaders = (value) => {
                if (!Array.isArray(headers)) return null;
                if (headers.length === 0) return null;
                if (typeof value !== "string") return null;
                if (value === "") return null;

                const index = headers.findIndex((item) => {
                    return item.value.toLowerCase().includes(value.toLowerCase());
                });
                if (index === -1) return null;

                return headers[index].value;
            };

            const title =
                findInHeaders("title") ||
                findInHeaders("name") ||
                findInHeaders("titre") ||
                findInHeaders("libellé") ||
                findInHeaders("libelle") ||
                "";
            const comment =
                findInHeaders("comment") ||
                findInHeaders("commentaire") ||
                findInHeaders("mémo") ||
                findInHeaders("memo") ||
                "";
            const date = findInHeaders("date") || findInHeaders("isodate") || "";
            const state =
                findInHeaders("state") ||
                findInHeaders("closed") ||
                findInHeaders("état") ||
                findInHeaders("etat") ||
                "";
            const amount = findInHeaders("amount") || findInHeaders("montant") || "";
            const categoryId =
                findInHeaders("categoryId") ||
                findInHeaders("category") ||
                findInHeaders("catégorie") ||
                findInHeaders("categorie") ||
                "";
            const paytypeId = findInHeaders("paytypeId") || findInHeaders("paytype") || findInHeaders("moyens") || "";
            const thirdpartyId =
                findInHeaders("thirdpartyId") ||
                findInHeaders("thirdparty") ||
                findInHeaders("tiers") ||
                findInHeaders("destinataire") ||
                findInHeaders("destination") ||
                "";

            setCsvImportChoices((old) => ({
                ...old,
                title,
                comment,
                date,
                state,
                amount,
                categoryId,
                paytypeId,
                thirdpartyId
            }));
        } else {
            setCsvImportChoices((old) => ({
                ...old,
                title: "",
                comment: "",
                date: "",
                state: "",
                amount: "",
                categoryId: "",
                paytypeId: "",
                thirdpartyId: ""
            }));
        }
    }, [headers]);

    useEffect(() => {
        if (lines.length > 0 && headers.length > 0) {
            setData(() => {
                const r = lines
                    .slice(1)
                    .map((l) => {
                        const row = l.split(csv_separators_columns);

                        const title = row[getHeaderIndex(csvImportChoices.title)]
                            ? row[getHeaderIndex(csvImportChoices.title)].trim()
                            : null;

                        const amount = row[getHeaderIndex(csvImportChoices.amount)]
                            ? parseFloat(
                                  row[getHeaderIndex(csvImportChoices.amount)]
                                      .trim()
                                      .replaceAll(csv_separators_decimals, ".")
                                      .replaceAll("€", "")
                                      .replaceAll(" ", "")
                              )
                            : null;

                        if (
                            title !== null &&
                            title !== undefined &&
                            amount !== null &&
                            !isNaN(amount) &&
                            amount !== undefined
                        ) {
                            const comment = row[getHeaderIndex(csvImportChoices.comment)]
                                ? row[getHeaderIndex(csvImportChoices.comment)].trim()
                                : "";

                            let date = row[getHeaderIndex(csvImportChoices.date)]
                                ? moment(row[getHeaderIndex(csvImportChoices.date)].trim(), csv_dateformat).toDate()
                                : new Date();
                            date = isNaN(date) || !date ? new Date() : date;

                            const state = row[getHeaderIndex(csvImportChoices.state)]
                                ? row[getHeaderIndex(csvImportChoices.state)].trim() === "true"
                                    ? 1
                                    : 0
                                : 0;

                            const category = row[getHeaderIndex(csvImportChoices.categoryId)]
                                ? row[getHeaderIndex(csvImportChoices.categoryId)].trim()
                                : "";

                            const paytype = row[getHeaderIndex(csvImportChoices.paytypeId)]
                                ? row[getHeaderIndex(csvImportChoices.paytypeId)].trim()
                                : "";

                            const thirdparty = row[getHeaderIndex(csvImportChoices.thirdpartyId)]
                                ? row[getHeaderIndex(csvImportChoices.thirdpartyId)].trim()
                                : "";

                            return {
                                title,
                                comment,
                                date,
                                amount,
                                state,
                                closed: state === 1,
                                category,
                                categoryId: getCategoryId(category),
                                paytype,
                                paytypeId: getPaytypeId(paytype),
                                thirdparty,
                                thirdpartyId: getThirdpartyId(thirdparty),
                                id: `operation_${uid()}`,
                                toWalletItemId: walletItem.id,
                                fromWalletItemId: null
                            };
                        }

                        return null;
                    })
                    .filter((r) => r !== null);

                setDataToImport(r);

                return r;
            });
        } else {
            setData([]);
            setDataToImport([]);
        }
    }, [headers, csvImportChoices]);

    useLayoutEffect(() => {
        setActive(0);
    }, [opened]);

    return (
        <Modal
            opened={opened}
            overlayColor={app.theme.colorScheme === "dark" ? app.theme.colors.dark[9] : app.theme.colors.gray[2]}
            overlayOpacity={0.55}
            overlayBlur={3}
            closeButtonLabel={"Annuler"}
            onClose={() => setOpened(false)}
            title={"Importer un fichier CSV"}
            size={"xl"}
        >
            <Stack>
                <Stepper active={active} onStepClick={setActive} breakpoint="sm" allowNextStepsSelect={false}>
                    <Stepper.Step label="Associations" description="Fichier CSV">
                        <Stack spacing={"xs"} mb={"lg"}>
                            <Text size={"sm"}>
                                Après analyse du fichier, nous avons détecté quelques correspondances entre les types
                                d'informations utilisés par {packagejson.name.trim().toLowerCase().capitalize()}.
                            </Text>
                            <Text size={"sm"}>
                                Choisissez les noms de colones du fichier CSV à associer aux différents types
                                d'informations nécessaires à l'importation.
                            </Text>

                            <Group grow={true} mt={"sm"}>
                                <Select
                                    size={"xs"}
                                    label="Titre de la transaction"
                                    withAsterisk={true}
                                    data={headers
                                        .filter((f) => f.value !== csvImportChoices.comment)
                                        .filter((f) => f.value !== csvImportChoices.date)
                                        .filter((f) => f.value !== csvImportChoices.amount)
                                        .filter((f) => f.value !== csvImportChoices.state)
                                        .filter((f) => f.value !== csvImportChoices.categoryId)
                                        .filter((f) => f.value !== csvImportChoices.paytypeId)
                                        .filter((f) => f.value !== csvImportChoices.thirdpartyId)}
                                    value={csvImportChoices.title}
                                    clearable={true}
                                    onChange={(value) => setCsvImportChoices((old) => ({ ...old, title: value }))}
                                    disabled={saving}
                                />
                                <Select
                                    size={"xs"}
                                    label="Commentaire"
                                    clearable={true}
                                    data={headers
                                        .filter((f) => f.value !== csvImportChoices.title)
                                        .filter((f) => f.value !== csvImportChoices.date)
                                        .filter((f) => f.value !== csvImportChoices.amount)
                                        .filter((f) => f.value !== csvImportChoices.state)
                                        .filter((f) => f.value !== csvImportChoices.categoryId)
                                        .filter((f) => f.value !== csvImportChoices.paytypeId)
                                        .filter((f) => f.value !== csvImportChoices.thirdpartyId)}
                                    value={csvImportChoices.comment}
                                    onChange={(value) => setCsvImportChoices((old) => ({ ...old, comment: value }))}
                                    disabled={saving}
                                />
                            </Group>

                            <Group grow={true}>
                                <Select
                                    size={"xs"}
                                    label="Date"
                                    clearable={true}
                                    data={headers
                                        .filter((f) => f.value !== csvImportChoices.title)
                                        .filter((f) => f.value !== csvImportChoices.comment)
                                        .filter((f) => f.value !== csvImportChoices.amount)
                                        .filter((f) => f.value !== csvImportChoices.state)
                                        .filter((f) => f.value !== csvImportChoices.categoryId)
                                        .filter((f) => f.value !== csvImportChoices.paytypeId)
                                        .filter((f) => f.value !== csvImportChoices.thirdpartyId)}
                                    value={csvImportChoices.date}
                                    onChange={(value) => setCsvImportChoices((old) => ({ ...old, date: value }))}
                                    disabled={saving}
                                />
                                <Select
                                    size={"xs"}
                                    label="Montant"
                                    withAsterisk={true}
                                    clearable={true}
                                    data={headers
                                        .filter((f) => f.value !== csvImportChoices.title)
                                        .filter((f) => f.value !== csvImportChoices.comment)
                                        .filter((f) => f.value !== csvImportChoices.date)
                                        .filter((f) => f.value !== csvImportChoices.state)
                                        .filter((f) => f.value !== csvImportChoices.categoryId)
                                        .filter((f) => f.value !== csvImportChoices.paytypeId)
                                        .filter((f) => f.value !== csvImportChoices.thirdpartyId)}
                                    value={csvImportChoices.amount}
                                    onChange={(value) => setCsvImportChoices((old) => ({ ...old, amount: value }))}
                                    disabled={saving}
                                />
                            </Group>

                            <Group grow={true}>
                                <Select
                                    size={"xs"}
                                    label="Etat de rapprochement"
                                    clearable={true}
                                    data={headers
                                        .filter((f) => f.value !== csvImportChoices.title)
                                        .filter((f) => f.value !== csvImportChoices.comment)
                                        .filter((f) => f.value !== csvImportChoices.date)
                                        .filter((f) => f.value !== csvImportChoices.amount)
                                        .filter((f) => f.value !== csvImportChoices.categoryId)
                                        .filter((f) => f.value !== csvImportChoices.paytypeId)
                                        .filter((f) => f.value !== csvImportChoices.thirdpartyId)}
                                    value={csvImportChoices.state}
                                    onChange={(value) => setCsvImportChoices((old) => ({ ...old, state: value }))}
                                    disabled={saving}
                                />
                                <Select
                                    size={"xs"}
                                    label="Catégorie"
                                    clearable={true}
                                    data={headers
                                        .filter((f) => f.value !== csvImportChoices.title)
                                        .filter((f) => f.value !== csvImportChoices.comment)
                                        .filter((f) => f.value !== csvImportChoices.date)
                                        .filter((f) => f.value !== csvImportChoices.amount)
                                        .filter((f) => f.value !== csvImportChoices.state)
                                        .filter((f) => f.value !== csvImportChoices.paytypeId)
                                        .filter((f) => f.value !== csvImportChoices.thirdpartyId)}
                                    value={csvImportChoices.categoryId}
                                    onChange={(value) => setCsvImportChoices((old) => ({ ...old, categoryId: value }))}
                                    disabled={saving}
                                />
                            </Group>

                            <Group grow={true}>
                                <Select
                                    size={"xs"}
                                    label="Moyen de paiement"
                                    clearable={true}
                                    data={headers
                                        .filter((f) => f.value !== csvImportChoices.title)
                                        .filter((f) => f.value !== csvImportChoices.comment)
                                        .filter((f) => f.value !== csvImportChoices.date)
                                        .filter((f) => f.value !== csvImportChoices.amount)
                                        .filter((f) => f.value !== csvImportChoices.state)
                                        .filter((f) => f.value !== csvImportChoices.categoryId)
                                        .filter((f) => f.value !== csvImportChoices.thirdpartyId)}
                                    value={csvImportChoices.paytypeId}
                                    onChange={(value) => setCsvImportChoices((old) => ({ ...old, paytypeId: value }))}
                                    disabled={saving}
                                />
                                <Select
                                    size={"xs"}
                                    label="Tiers / Destinataire"
                                    clearable={true}
                                    data={headers
                                        .filter((f) => f.value !== csvImportChoices.title)
                                        .filter((f) => f.value !== csvImportChoices.comment)
                                        .filter((f) => f.value !== csvImportChoices.date)
                                        .filter((f) => f.value !== csvImportChoices.amount)
                                        .filter((f) => f.value !== csvImportChoices.state)
                                        .filter((f) => f.value !== csvImportChoices.categoryId)
                                        .filter((f) => f.value !== csvImportChoices.paytypeId)}
                                    value={csvImportChoices.thirdpartyId}
                                    onChange={(value) =>
                                        setCsvImportChoices((old) => ({ ...old, thirdpartyId: value }))
                                    }
                                    disabled={saving}
                                />
                            </Group>
                        </Stack>
                    </Stepper.Step>

                    <Stepper.Step label="Sélections" description="Données CSV">
                        {csvImportChoices.title && csvImportChoices.amount ? (
                            <OpeImportList
                                items={data}
                                selected={dataToImport.map((d) => d.id)}
                                onSelect={(item) => {
                                    setDataToImport((current) => {
                                        const exists = current.some((c) => c.id === item.id);
                                        if (!exists) return [...current, item];
                                        return current;
                                    });
                                }}
                                onSelectAll={() => {
                                    setDataToImport(data);
                                }}
                                onUnselect={(item) => {
                                    setDataToImport((current) => {
                                        return current.filter((c) => c.id !== item.id);
                                    });
                                }}
                                onUnselectAll={() => {
                                    setDataToImport([]);
                                }}
                                disabled={saving}
                            />
                        ) : (
                            <Text size={"xs"} color={"red"}>
                                Les correspondances ne sont pas encore toutes définient ou aucune donnée n'est en
                                capacité d'être importée.
                            </Text>
                        )}
                    </Stepper.Step>
                </Stepper>

                <Group position={"right"}>
                    <Button variant={"default"} onClick={() => prevStep()} disabled={active === 0 || saving}>
                        <IconArrowLeft size={16} />
                    </Button>
                    <Button
                        onClick={() => (active === 0 ? nextStep() : importSelected())}
                        disabled={
                            !csvImportChoices.title || !csvImportChoices.amount || dataToImport.length === 0 || saving
                        }
                        loading={saving}
                    >
                        {active === 0 ? "Suivant" : "Importer"}
                    </Button>
                    <Button variant={"default"} onClick={() => setOpened(false)} disabled={saving}>
                        Annuler
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default CsvImportModal;
