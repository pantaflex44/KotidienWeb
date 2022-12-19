import { data2body, encryptedData2body } from "../../tools";
import api from "./api";

export const exists = async (email) => {
    const caller = api("/wallet/exists", "POST");
    const response = await caller.request({
        body: data2body({ email })
    });
    return response.data === true;
};

export const register = async (data) => {
    const caller = api("/wallet/register", "POST");
    const response = await caller.request({
        body: encryptedData2body(data)
    });
    return { registered: false, errorCode: 0, errorMessage: null, ...response.data };
};

export const login = async (data) => {
    const caller = api("/wallet/login", "POST");
    const response = await caller.request({
        body: encryptedData2body(data)
    });
    return { metas: null, errorCode: 0, errorMessage: null, ...response.data };
};
