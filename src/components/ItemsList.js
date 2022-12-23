import React, { useState, useEffect, useMemo, cloneElement, memo } from "react";

import {
    ActionIcon,
    Button,
    Divider,
    FocusTrap,
    Group,
    Loader,
    Menu,
    Modal,
    Paper,
    Stack,
    Text,
    TextInput,
    Tooltip,
    useMantineTheme
} from "@mantine/core";
import { getHotkeyHandler } from "@mantine/hooks";
import { openConfirmModal } from "@mantine/modals";
import { useForm } from "@mantine/form";

import { IconDotsVertical, IconPencil, IconSquarePlus, IconTrash } from "@tabler/icons";

import { strToColor, uid } from "../../tools";

const ItemElement = memo(
    ({ itemElement, color = "inherit", onChange = null, onDelete = null, onAdd = null, translate = {} }) => {
        const theme = useMantineTheme();
        const [editing, setEditing] = useState(false);
        const [lastEdit, setLastEdit] = useState(itemElement.name);
        const [item, setItem] = useState(itemElement);

        const cancelEdit = () => {
            setItem((old) => ({ ...old, name: lastEdit }));
            setEditing(false);
        };

        const validEdit = () => {
            setEditing(false);
        };

        const changeEditMode = () => {
            setEditing((old) => {
                if (old) {
                    setItem((old) => {
                        const newItem = { ...old, name: old.name.trim() };
                        if (onChange) onChange(newItem.id, newItem.name);
                        return newItem;
                    });
                } else {
                    setLastEdit(item.name);
                }
                return !old;
            });
        };

        const deleteItemElement = () => {
            openConfirmModal({
                title: "Confirmation",
                children: (
                    <Text size="sm" mb="lg" data-autofocus>
                        {translate.deleteMessage(item)}
                    </Text>
                ),
                labels: {
                    confirm: translate.Yes,
                    cancel: translate.No
                },
                overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
                overlayOpacity: 0.55,
                overlayBlur: 3,
                trapFocus: true,
                zIndex: 10000,
                onConfirm: () => {
                    if (onDelete) onDelete(item.id);
                }
            });
        };

        return (
            <Stack spacing={0}>
                <Group
                    spacing={0}
                    position={"apart"}
                    pl={"xs"}
                    sx={(theme) => ({
                        flexWrap: "nowrap",
                        padding: "4px 8px",
                        "&:hover": {
                            backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[5] : theme.colors.gray[1]
                        }
                    })}
                >
                    {editing ? (
                        <FocusTrap active={true}>
                            <TextInput
                                placeholder={""}
                                label={""}
                                value={item.name}
                                style={{ maxWidth: "50%", width: "100%" }}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    if (name !== "") {
                                        setItem((old) => {
                                            const newItem = { ...old, name };
                                            return newItem;
                                        });
                                    }
                                }}
                                onKeyDown={getHotkeyHandler([
                                    ["Escape", cancelEdit],
                                    ["Enter", validEdit]
                                ])}
                                onBlur={() => cancelEdit()}
                                data-autofocus
                            />
                        </FocusTrap>
                    ) : (
                        <Text
                            color={color}
                            size={"sm"}
                            lineClamp={1}
                            style={{
                                maxWidth: "50vw",
                                width: "100%"
                            }}
                        >
                            {item.name}
                        </Text>
                    )}

                    <Group spacing={"xs"} position={"right"} sx={(theme) => ({ flexWrap: "nowrap" })}>
                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <Tooltip label={translate.options} withArrow>
                                    <ActionIcon size="md">
                                        <IconDotsVertical
                                            size={16}
                                            color={
                                                theme.colorScheme === "dark"
                                                    ? theme.colors.dark[1]
                                                    : theme.colors.dark[7]
                                            }
                                        />
                                    </ActionIcon>
                                </Tooltip>
                            </Menu.Target>

                            <Menu.Dropdown>
                                <Menu.Label>{item.name}</Menu.Label>
                                <Menu.Item icon={<IconPencil size={14} />} onClick={() => changeEditMode()}>
                                    {translate.updateItem}
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item
                                    color="red"
                                    icon={<IconTrash size={14} />}
                                    onClick={() => deleteItemElement()}
                                >
                                    {translate.deleteItem}
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
            </Stack>
        );
    }
);

function ItemsList({ value = [], onChange = null, useColors = true, translate = {} }) {
    translate = {
        ...{
            newItem: "Nouvel élément",
            itemNameExpected: "Dénomination requise!",
            Yes: "Oui",
            No: "No",
            confirm: "Confirmation",
            deleteAllItems: "Voulez-vous supprimer tous les éléments ?",
            name: "Nom",
            Cancel: "Annuler",
            Submit: "Valider",
            item: "élément",
            addItem: "Ajouter un élément",
            deleteAll: "Tout supprimer",
            newHelp: (
                <>
                    Cliquez sur <IconSquarePlus size={14} /> pour ajouter un élément.
                </>
            ),
            deleteMessage: (item) => <>Voulez-vous supprimer "{item.name}" ?</>,
            options: "Options",
            updateItem: "Modifier",
            deleteItem: "Supprimer"
        },
        ...translate
    };
    const theme = useMantineTheme();

    const [items, setItems] = useState([...value]);
    const [addModalOpened, setAddModalOpened] = useState(false);
    const [loading, setLoading] = useState(true);

    const childs = useMemo(() => {
        return items
            .filter((c) => c.name && c.id)
            .sort((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            })
            .map((c) => {
                return (
                    <ItemElement
                        key={c.id}
                        itemElement={c}
                        items={items}
                        color={useColors ? strToColor(c.name, theme.colorScheme) : "inherit"}
                        onChange={(id, name) => {
                            updateItemElement(id, name);
                        }}
                        onDelete={(id) => {
                            deleteItemElement(id);
                        }}
                        onAdd={() => {
                            addItemElement();
                        }}
                        translate={translate}
                    />
                );
            });
    }, [items]);

    const addForm = useForm({
        initialValues: {
            id: `itemElement_${uid()}`,
            name: translate.newItem
        },
        validate: {
            name: (value) => (value.trim().length > 0 ? null : translate.itemNameExpected)
        }
    });

    const addItemElement = () => {
        addForm.setValues({ id: `itemElement_${uid()}`, name: translate.newItem });
        setAddModalOpened(true);
    };

    const deleteItemElement = (id) => {
        setItems((old) => {
            const newItems = old.filter((i) => i.id !== id);
            return newItems;
        });
    };

    const deleteAll = () => {
        openConfirmModal({
            title: translate.confirm,
            children: (
                <Text size="sm" mb="lg" data-autofocus>
                    {translate.deleteAllItems}
                </Text>
            ),
            labels: {
                confirm: translate.Yes,
                cancel: translate.No
            },
            overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
            overlayOpacity: 0.55,
            overlayBlur: 3,
            trapFocus: true,
            zIndex: 10000,
            onConfirm: () => {
                setItems([]);
            }
        });
    };

    const updateItemElement = (id, name) => {
        setItems((old) => {
            const item = old.filter((i) => i.id === id);
            if (item && item.length > 0) {
                const newItem = { ...item[0], name };
                const newItems = [...old.filter((i) => i.id !== id), newItem];
                return newItems;
            }
        });
    };

    const addFormSubmit = () => {
        if (!addForm.validate().hasErrors) {
            setItems((old) => {
                const newItem = { ...addForm.values, name: addForm.values.name.trim() };
                const newItems = [...old, newItem];
                return newItems;
            });
            setAddModalOpened(false);
        }
    };

    useEffect(() => {
        if (onChange) onChange(items);
    }, [items]);

    useEffect(() => {
        setLoading(false);
    }, []);

    return (
        <>
            <Modal
                id={`itemElement-add-${uid()}`}
                opened={addModalOpened}
                onClose={() => setAddModalOpened(false)}
                title={translate.newItem}
                overlayColor={theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2]}
                overlayOpacity={0.55}
                overlayBlur={3}
            >
                <TextInput
                    label={translate.name}
                    placeholder=""
                    {...addForm.getInputProps("name")}
                    onKeyDown={getHotkeyHandler([
                        [
                            "Escape",
                            () => {
                                setAddModalOpened(false);
                            }
                        ],
                        [
                            "Enter",
                            () => {
                                addFormSubmit();
                            }
                        ]
                    ])}
                    data-autofocus
                    withAsterisk
                />
                <Group position="right" mt="md">
                    <Button
                        variant="default"
                        onClick={() => {
                            setAddModalOpened(false);
                        }}
                    >
                        {translate.Cancel}
                    </Button>
                    <Button
                        type="submit"
                        onClick={() => {
                            addFormSubmit();
                        }}
                    >
                        {translate.Submit}
                    </Button>
                </Group>
            </Modal>
            {!loading ? (
                <Paper shadow={0} withBorder={true}>
                    <Stack
                        spacing={0}
                        sx={(theme) => ({
                            backgroundColor: theme.colorScheme === "dark" ? theme.colors.dark[6] : theme.colors.gray[0]
                        })}
                    >
                        <Group position={"apart"} spacing={"xs"}>
                            <Text size={"xs"} fw={500} ml={"xs"}>
                                {items.length} {translate.item}
                                {items.length > 1 ? "s" : ""}
                            </Text>
                            <Group position={"right"} spacing={0}>
                                <Tooltip label={translate.addItem} withArrow>
                                    <ActionIcon
                                        size="lg"
                                        color={theme.colors.gray[7]}
                                        onClick={() => {
                                            addItemElement();
                                        }}
                                    >
                                        <IconSquarePlus size={16} />
                                    </ActionIcon>
                                </Tooltip>
                                {childs && childs.length > 0 && (
                                    <Tooltip label={translate.deleteAll} withArrow>
                                        <ActionIcon
                                            size="lg"
                                            color={"red"}
                                            onClick={() => {
                                                deleteAll();
                                            }}
                                        >
                                            <IconTrash size={16} />
                                        </ActionIcon>
                                    </Tooltip>
                                )}
                            </Group>
                        </Group>
                        <Divider my={0} variant={"dotted"} />
                        {(!childs || childs.length === 0) && (
                            <Text size={"sm"} m={"xs"}>
                                {translate.newHelp}
                            </Text>
                        )}
                        {childs}
                    </Stack>
                </Paper>
            ) : (
                <Group position={"center"} spacing={"xs"}>
                    <Loader size={"xs"} variant={"bars"} />
                    <Text size={"xs"} fw={500}>
                        Chargement en cours, veuillez patienter SVP...
                    </Text>
                </Group>
            )}
        </>
    );
}

export default ItemsList;
