const React = require("react");
const { IconBuildingBank, IconCreditCard, IconWallet } = require("@tabler/icons");

const defaultWalletCategories = [
    { id: "bankaccount", text: "Comptes bancaires", icon: <IconBuildingBank size={16} /> },
    { id: "paycard", text: "Cartes de paiements", icon: <IconCreditCard size={16} /> },
    { id: "moneywallet", text: "Portefeuilles d'espèces", icon: <IconWallet size={16} /> }
];

module.exports = { defaultWalletCategories };
