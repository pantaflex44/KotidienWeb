import React, { useState, useEffect, useMemo, cloneElement, memo, useLayoutEffect } from "react";

import {
    ActionIcon,
    Button,
    Collapse,
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
import { completeNavigationProgress, resetNavigationProgress, startNavigationProgress } from "@mantine/nprogress";

import { IconChevronDown, IconChevronUp, IconDotsVertical, IconPencil, IconSquarePlus, IconTrash } from "@tabler/icons";

import { strToColor, uid } from "../../tools";

const Category = memo(
    ({ items, category, color = "inherit", firstElement = false, onChange = null, onDelete = null, onAdd = null }) => {
        const theme = useMantineTheme();
        const [opened, setOpened] = useState(false);
        const [editing, setEditing] = useState(false);
        const [lastEdit, setLastEdit] = useState(category.name);
        const [item, setItem] = useState(category);

        const childs = (Array.isArray(items) ? items : [])
            .filter((c) => c.parentId === category.id)
            .sort((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            })
            .map((c) => (
                <Category
                    key={c.id}
                    category={c}
                    items={items}
                    color={color}
                    onChange={onChange}
                    onDelete={onDelete}
                    onAdd={onAdd}
                />
            ));

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

        const deleteCategory = () => {
            openConfirmModal({
                title: "Confirmation",
                children: (
                    <Text size="sm" mb="lg" data-autofocus>
                        Voulez-vous supprimer la catégorie "{item.name}" ?
                    </Text>
                ),
                labels: {
                    confirm: "Oui",
                    cancel: "Non"
                },
                overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
                overlayOpacity: 0.55,
                overlayBlur: 3,
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
                            fw={firstElement ? 500 : 400}
                            size={"sm"}
                            lineClamp={1}
                            style={{
                                maxWidth: "50vw",
                                width: "100%",
                                cursor: childs && childs.length > 0 ? "pointer" : "default"
                            }}
                            onClick={() => {
                                if (childs && childs.length > 0) setOpened((old) => !old);
                            }}
                        >
                            {item.name}
                        </Text>
                    )}

                    <Group spacing={"xs"} position={"right"} sx={(theme) => ({ flexWrap: "nowrap" })}>
                        {childs && childs.length > 0 && (
                            <ActionIcon size="md" onClick={() => setOpened((old) => !old)}>
                                {cloneElement(opened ? <IconChevronUp /> : <IconChevronDown />, {
                                    color: theme.colorScheme === "dark" ? theme.colors.dark[1] : theme.colors.dark[7],
                                    size: 16
                                })}
                            </ActionIcon>
                        )}

                        <Menu shadow="md" width={200}>
                            <Menu.Target>
                                <Tooltip label="Options" withArrow>
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
                                <Menu.Item
                                    icon={<IconSquarePlus size={14} />}
                                    onClick={() => {
                                        if (onAdd) onAdd(item.id);
                                    }}
                                >
                                    Ajouter
                                </Menu.Item>
                                <Menu.Item icon={<IconPencil size={14} />} onClick={() => changeEditMode()}>
                                    Modifier
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item color="red" icon={<IconTrash size={14} />} onClick={() => deleteCategory()}>
                                    Supprimer
                                </Menu.Item>
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Group>
                {childs && childs.length > 0 && (
                    <Collapse in={opened} ml={28}>
                        {childs}
                    </Collapse>
                )}
            </Stack>
        );
    }
);

function CategoriesTree({ value = [], onChange = null, useColors = true }) {
    const theme = useMantineTheme();

    const [items, setItems] = useState([...value]);
    const [addModalOpened, setAddModalOpened] = useState(false);
    const [loading, setLoading] = useState(true);

    const childs = useMemo(() => {
        const result = items
            .filter((c) => (c.parentId === null || c.parentId === undefined) && c.name && c.id)
            .sort((a, b) => {
                if (a.name < b.name) return -1;
                if (a.name > b.name) return 1;
                return 0;
            })
            .map((c) => {
                return (
                    <Category
                        key={c.id}
                        category={c}
                        items={items}
                        color={useColors ? strToColor(c.name, theme.colorScheme) : "inherit"}
                        firstElement={true}
                        onChange={(id, name) => {
                            updateCategory(id, name);
                        }}
                        onDelete={(id) => {
                            deleteCategory(id);
                        }}
                        onAdd={(parentId) => {
                            addCategory(parentId);
                        }}
                    />
                );
            });

        return result;
    }, [items]);

    const addForm = useForm({
        initialValues: {
            id: `category_${uid()}`,
            name: "Nouvelle catégorie",
            parentId: null
        },
        validate: {
            name: (value) => (value.trim().length > 0 ? null : "Dénomination requise!")
        }
    });

    const addCategory = (parentId) => {
        addForm.setValues({ id: `category_${uid()}`, name: "Nouvelle catégorie", parentId });
        setAddModalOpened(true);
    };

    const deleteCategory = (id) => {
        setItems((old) => {
            const newItems = old.filter((i) => i.id !== id && i.parentId !== id);
            return newItems;
        });
    };

    const deleteAll = () => {
        openConfirmModal({
            title: "Confirmation",
            children: (
                <Text size="sm" mb="lg" data-autofocus>
                    Voulez-vous supprimer toutes les catégories et sous-catégories ?
                </Text>
            ),
            labels: {
                confirm: "Oui",
                cancel: "Non"
            },
            overlayColor: theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2],
            overlayOpacity: 0.55,
            overlayBlur: 3,
            onConfirm: () => {
                setItems([]);
            }
        });
    };

    const updateCategory = (id, name) => {
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
                id="category-add"
                opened={addModalOpened}
                onClose={() => setAddModalOpened(false)}
                title={"Nouvelle catégorie"}
                overlayColor={theme.colorScheme === "dark" ? theme.colors.dark[9] : theme.colors.gray[2]}
                overlayOpacity={0.55}
                overlayBlur={3}
            >
                <TextInput
                    label="Nom"
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
                        Annuler
                    </Button>
                    <Button
                        type="submit"
                        onClick={() => {
                            addFormSubmit();
                        }}
                    >
                        Valider
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
                        <Group position={"right"} spacing={0}>
                            <Tooltip label="Ajouter une catégorie" withArrow>
                                <ActionIcon
                                    size="lg"
                                    color={theme.colors.gray[7]}
                                    onClick={() => {
                                        addCategory(null);
                                    }}
                                >
                                    <IconSquarePlus size={16} />
                                </ActionIcon>
                            </Tooltip>
                            {childs && childs.length > 0 && (
                                <Tooltip label="Tout supprimer" withArrow>
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
                        <Divider my={0} variant={"dotted"} />
                        {(!childs || childs.length === 0) && (
                            <Text size={"sm"} m={"xs"}>
                                Cliquez sur <IconSquarePlus size={14} /> pour ajouter une nouvelle catégorie.
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

export default CategoriesTree;
