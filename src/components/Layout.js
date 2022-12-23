import packagejson from "../../package.json";

import React, { cloneElement, useContext } from "react";
import {
    AppShell,
    Navbar,
    ScrollArea,
    Header,
    Text,
    MediaQuery,
    Burger,
    Title,
    Group,
    Anchor,
    ActionIcon,
    Space,
    Divider,
    Tooltip,
} from "@mantine/core";
import { IconAlien, IconDeviceFloppy, IconMoonStars, IconPlugConnectedX, IconSettings, IconSun } from "@tabler/icons";

import { AppContext } from "./AppProvider";

const Layout = ({ navbar = { header: null, content: null }, children }) => {
    const app = useContext(AppContext);

    return (
        <AppContext.Consumer>
            {(value) => {
                return (
                    <AppShell
                        styles={{
                            main: {
                                background:
                                    value.theme.colorScheme === "dark"
                                        ? value.theme.colors.dark[8]
                                        : value.theme.colors.gray[0]
                            }
                        }}
                        fixed={true}
                        navbarOffsetBreakpoint="md"
                        navbar={
                            <Navbar p="md" hiddenBreakpoint="md" hidden={!value.navbarOpened} width={{ sm: 350 }}>
                                <Navbar.Section mt="xs">{value.navbar.header ?? navbar.header ?? ""}</Navbar.Section>

                                <Navbar.Section grow component={ScrollArea} mx="-xs" px="xs">
                                    {value.navbar.content ?? navbar.content ?? ""}
                                </Navbar.Section>

                                <Navbar.Section>
                                    <Space h="lg" />
                                    <Divider variant="dotted" />
                                    <Group
                                        position={"apart"}
                                        spacing={"md"}
                                        p={"xs"}
                                        sx={(theme) => ({
                                            backgroundColor:
                                                theme.colorScheme === "dark"
                                                    ? theme.colors.dark[8]
                                                    : theme.colors.gray[0]
                                        })}
                                    >
                                        {value.path === "/" && (
                                            <Group position={"left"} spacing={"md"}>
                                                <Tooltip
                                                    label={
                                                        value.colorScheme === "dark"
                                                            ? "Basculer sur le thème clair (Ctrl+J)"
                                                            : "Basculer sur le thème sombre (Ctrl+J)"
                                                    }
                                                >
                                                    <ActionIcon
                                                        variant={"filled"}
                                                        color={value.colorScheme === "light" ? "yellow" : "gray"}
                                                        onClick={() => value.toggleColorScheme()}
                                                    >
                                                        {value.colorScheme === "light" ? (
                                                            <IconSun size={18} stroke={2.5} />
                                                        ) : (
                                                            <IconMoonStars size={18} stroke={2.5} />
                                                        )}
                                                    </ActionIcon>
                                                </Tooltip>
                                                {app.toolbarItems.map((item, idx) => (
                                                    <Tooltip label={item.text} key={`toolbarItem_${idx}`}>
                                                        <ActionIcon
                                                            variant={"filled"}
                                                            color={item.color || app.theme.colors.gray[7]}
                                                            onClick={item.callback}
                                                        >
                                                            {cloneElement(item.icon || <IconAlien />, { size: 18 })}
                                                        </ActionIcon>
                                                    </Tooltip>
                                                ))}
                                            </Group>
                                        )}
                                        {app.wallet && (
                                            <Group position={"right"} spacing={"md"}>
                                                {app.walletToolbarItems.map((item, idx) => (
                                                    <Tooltip label={item.text} key={`toolbarItem_wallet_${idx}`}>
                                                        <ActionIcon
                                                            variant={"subtle"}
                                                            color={item.color || app.theme.colors.gray[7]}
                                                            onClick={item.callback}
                                                        >
                                                            {cloneElement(item.icon || <IconAlien />, {
                                                                size: 18,
                                                                stroke: 2.5
                                                            })}
                                                        </ActionIcon>
                                                    </Tooltip>
                                                ))}
                                                {app.expectedSaving && (
                                                    <Tooltip label={"Enregistrer"}>
                                                        <ActionIcon
                                                            variant={"filled"}
                                                            color={"blue"}
                                                            onClick={() => app.save()}
                                                        >
                                                            <IconDeviceFloppy size={16} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                                <Tooltip label={"Me déconnecter"}>
                                                    <ActionIcon
                                                        variant={"filled"}
                                                        color={"red"}
                                                        onClick={() => app.disconnect(true)}
                                                    >
                                                        <IconPlugConnectedX size={18} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        )}
                                    </Group>
                                    <Divider variant="dotted" />
                                    <Space h="sm" />
                                    <Text size={"xs"}>Copyright (c)2022-2023 {packagejson.author.name}</Text>
                                    <Text size={"xs"}>
                                        <Anchor
                                            href="https://github.com/pantaflex44/Kotidien"
                                            target={"_blank"}
                                            rel={"noreferer"}
                                        >
                                            https://github.com/pantaflex44/Kotidien
                                        </Anchor>
                                    </Text>
                                    <Text size={"xs"}>
                                        {packagejson.name.trim().capitalize()} v{packagejson.version}
                                        {" - "}
                                        <Anchor
                                            href="https://fr.wikipedia.org/wiki/Licence_MIT"
                                            target={"_blank"}
                                            rel={"noreferer"}
                                        >
                                            Licence {packagejson.license}
                                        </Anchor>
                                    </Text>
                                </Navbar.Section>
                            </Navbar>
                        }
                        header={
                            <Header px="lg" py="sm" height={70}>
                                <Group position="apart">
                                    <Title
                                        weight={900}
                                        order={1}
                                        sx={(theme) => ({
                                            textTransform: "capitalize",

                                            "&:first-letter": {
                                                color: theme.colors.brand[5]
                                            }
                                        })}
                                    >
                                        {packagejson.name.trim()}
                                    </Title>

                                    <MediaQuery smallerThan="lg" styles={{ display: "none" }}>
                                        <Text fw={500} fz="xs">
                                            Gestion de vos finances personnelles assistée par ordinateur.
                                        </Text>
                                    </MediaQuery>

                                    <MediaQuery largerThan="md" styles={{ display: "none" }}>
                                        <Burger
                                            opened={value.navbarOpened}
                                            onClick={() => value.setNavbarState(!value.navbarOpened)}
                                            size="sm"
                                            color={value.theme.colors.gray[6]}
                                        />
                                    </MediaQuery>
                                </Group>
                            </Header>
                        }
                    >
                        {children}
                    </AppShell>
                );
            }}
        </AppContext.Consumer>
    );
};

export default Layout;
