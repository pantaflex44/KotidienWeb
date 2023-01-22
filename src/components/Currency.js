import React, { memo, useMemo } from "react";

import { Text } from "@mantine/core";
import { currencyFormatter } from "../../tools";

function Currency({ amount, currency = "EUR", useColor = true, negativeColor = "red.8", color = null, ...props }) {
    const formattedAmount = useMemo(() => currencyFormatter(amount, currency), [amount, currency]);

    return (
        <Text {...props} style={{ whiteSpace: "nowrap" }} color={amount < 0 && useColor ? negativeColor : color}>
            {formattedAmount}
        </Text>
    );
}

export default memo(
    Currency,
    (p, n) =>
        p.amount === n.amount &&
        p.currency === n.currency &&
        p.useColor === n.useColor &&
        p.negativeColor === n.negativeColor &&
        p.color === n.color
);
