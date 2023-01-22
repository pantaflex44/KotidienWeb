import React, { memo } from "react";

import dayjs from "dayjs";

import { Box } from "@mantine/core";

function CalendarView(items, currentDate = dayjs().toDate()) {
    return <Box>bob</Box>;
}

export default memo(
    CalendarView,
    (p, n) => JSON.stringify(p.items) === JSON.stringify(n.items) && p.currentDate === n.currentDate
);
