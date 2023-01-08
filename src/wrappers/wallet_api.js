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

export const saveWallet = async (data) => {
    const caller = api("/wallet/savewallet", "POST");
    const response = await caller.request({
        body: encryptedData2body(data)
    });
    return { saved: false, errorCode: 0, errorMessage: null, ...response.data };
};

export const saveOperation = async (email, data) => {
    const caller = api("/wallet/saveoperation", "POST");
    const response = await caller.request({
        body: encryptedData2body({ email, ...data })
    });
    return { saved: false, errorCode: 0, errorMessage: null, ...response.data };
};

export const getAmountAt = async (email, walletId, date) => {
    const caller = api("/wallet/getamountat", "POST");
    const response = await caller.request({
        body: encryptedData2body({ email, walletId, date })
    });
    return { amount: 0.0, errorCode: 0, errorMessage: null, ...response.data };
};

export const getOperations = async (email, walletItemId, filters) => {
    const caller = api("/wallet/getoperations", "POST");
    const response = await caller.request({
        body: encryptedData2body({ email, walletItemId, filters })
    });
    return { operations: [], errorCode: 0, errorMessage: null, ...response.data };
};
