import packagejson from "../../package.json";

import dayjs from "dayjs";
import moment from "moment/moment";
import ofx from "@wademason/ofx";

import React, { useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { Button, Code, Divider, Group, Modal, ScrollArea, Select, Space, Stack, Stepper, Text } from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { IconArrowLeft, IconBackspace, IconListDetails, IconThumbUp, IconX } from "@tabler/icons";

import { AppContext } from "./AppProvider";
import { toSqlDate, uid } from "../../tools";
import OpeImportList from "./OpeImportList";

import { saveOperations } from "../wrappers/wallet_api";

function OfxImportModal({
    walletItem,
    ofxContent = {},
    visible = false,
    initialValue = false,
    onClose = null,
    onSaved = null
}) {
    const app = useContext(AppContext);
    const [opened, setOpened] = useState(initialValue);
    const [data, setData] = useState([]);
    const [dataToImport, setDataToImport] = useState([]);
    const [saving, setSaving] = useState(false);

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

    const showBadFormatError = (tag) => {
        showNotification({
            id: `import-error-notification-${uid()}`,
            disallowClose: true,
            autoClose: 5000,
            title: "Erreur d'importation!",
            message: `La version du fichier OFX est incompatible avec ${packagejson.name
                .trim()
                .toLowerCase()
                .capitalize()} (tag ${tag}).`,
            color: "red",
            icon: <IconX size={18} />,
            loading: false
        });
    };

    const showCurrencyError = () => {
        showNotification({
            id: `import-error-notification-${uid()}`,
            disallowClose: true,
            autoClose: 5000,
            title: "Erreur d'importation!",
            message: `La monnaie utilisée pour les transactions inscrites dans le fichier OFX est incompatible avec votre portefeuille.`,
            color: "red",
            icon: <IconX size={18} />,
            loading: false
        });
    };

    const showError = (message) => {
        showNotification({
            id: `import-error-notification-${uid()}`,
            disallowClose: true,
            autoClose: 5000,
            title: "Erreur d'importation!",
            message,
            color: "red",
            icon: <IconX size={18} />,
            loading: false
        });
    };

    const loadOfx = useCallback(() => {
        try {
            if (!ofxContent) return;
            
            const ofxData = ofx.parse(ofxContent);

            if (
                !ofxData ||
                !ofxData.headers ||
                !ofxData.body ||
                !ofxData.body.OFX ||
                !ofxData.headers.OFXHEADER ||
                ofxData.headers.OFXHEADER !== "100"
            ) {
                showBadFormatError();
            } else {
                const BANKMSGSRSV = ofxData.body.OFX.BANKMSGSRSV1 || ofxData.body.OFX.BANKMSGSRSV2 || null;
                if (!BANKMSGSRSV) {
                    showBadFormatError("BANKMSGSRSV");
                } else {
                    const STMTRS = BANKMSGSRSV.STMTTRNRS?.STMTRS || null;
                    if (!STMTRS) {
                        showBadFormatError("STMTTRNRS | STMTRS");
                    } else {
                        const CURDEF = STMTRS.CURDEF?._text || null;
                        if (CURDEF && CURDEF.trim().toUpperCase() !== "EUR") {
                            showCurrencyError();
                        } else {
                            const STMTTRN = STMTRS.BANKTRANLIST?.STMTTRN || null;
                            if (!STMTTRN || !Array.isArray(STMTTRN)) {
                                showBadFormatError("BANKTRANLIST | STMTTRN");
                            } else {
                                setData(() => {
                                    const r = STMTTRN.map((item) => {
                                        const date = moment(
                                            item.DTPOSTED?._text || dayjs().format("YYYYMMDD")
                                        ).toDate();
                                        const amount = item.TRNAMT?._text ? parseFloat(item.TRNAMT?._text) : null;
                                        const title = item.NAME?._text || null;
                                        if (
                                            title !== null &&
                                            title !== undefined &&
                                            amount !== null &&
                                            amount !== undefined &&
                                            !isNaN(amount) &&
                                            amount !== 0
                                        ) {
                                            return {
                                                title,
                                                comment: "",
                                                date,
                                                amount,
                                                state: 0,
                                                closed: false,
                                                category: "",
                                                categoryId: null,
                                                paytype: "",
                                                paytypeId: null,
                                                thirdparty: "",
                                                thirdpartyId: null,
                                                id: `operation_${uid()}`,
                                                toWalletItemId: walletItem.id,
                                                fromWalletItemId: null
                                            };
                                        }

                                        return null;
                                    }).filter((r) => r !== null);

                                    setDataToImport(r);

                                    return r;
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
            showBadFormatError("OFX");
        }
    }, [ofxContent]);

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
        loadOfx();
    }, [ofxContent]);

    return (
        <Modal
            opened={opened}
            overlayColor={app.theme.colorScheme === "dark" ? app.theme.colors.dark[9] : app.theme.colors.gray[2]}
            overlayOpacity={0.55}
            overlayBlur={3}
            closeButtonLabel={"Annuler"}
            onClose={() => setOpened(false)}
            title={"Importer un fichier OFX"}
            size={"xl"}
        >
            <Stack>
                {useMemo(
                    () => (
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
                    ),
                    [data, dataToImport, saving]
                )}

                <Group position={"right"}>
                    <Button
                        onClick={() => importSelected()}
                        disabled={dataToImport.length === 0 || saving}
                        loading={saving}
                    >
                        Importer
                    </Button>
                    <Button variant={"default"} onClick={() => setOpened(false)} disabled={saving}>
                        Annuler
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default OfxImportModal;
