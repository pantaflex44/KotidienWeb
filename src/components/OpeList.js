import packagejson from "../../package.json";

import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

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
import { useFocusTrap, useHotkeys, useListState } from "@mantine/hooks";
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

function OpeList({ items, selected = [], onSelect = null }) {
    const opeItems = useMemo(() => items, [items]);

    return (
        <Stack>
            <Text>{JSON.stringify(opeItems)}</Text>
        </Stack>
    );
}

export default OpeList;
