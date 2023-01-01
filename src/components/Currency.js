import React from "react";

import { Text } from "@mantine/core";
import { currencyFormatter } from "../../tools";

function Currency({ amount, currency = "EUR", ...props }) {
    return (
        <Text {...props} color={amount < 0 ? "red.8" : "inherit"}>
            {currencyFormatter(amount, currency)}
        </Text>
    );
}

export default Currency;
