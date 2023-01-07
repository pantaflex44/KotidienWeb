import React from "react";

import { Text } from "@mantine/core";
import { currencyFormatter } from "../../tools";

function Currency({
    amount,
    currency = "EUR",
    useColor = true,
    negativeColor = "red.8",
    color = null,
    ...props
}) {
    return (
        <Text {...props} color={amount < 0 && useColor ? negativeColor : color}>
            {currencyFormatter(amount, currency)}
        </Text>
    );
}

export default Currency;
