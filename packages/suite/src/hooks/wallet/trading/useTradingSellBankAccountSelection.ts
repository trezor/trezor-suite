import { useState } from 'react';

import { type BankAccount } from 'invity-api';

import { sellUtils } from '@suite-common/trading';

export const useTradingSellBankAccountSelection = (bankAccounts: BankAccount[] | undefined) => {
    const [selectedIban, setSelectedIban] = useState<string>();

    const selectedBankAccount = sellUtils.findSelectedBankAccount(bankAccounts, selectedIban);

    const selectBankAccount = (bankAccount: BankAccount) =>
        setSelectedIban(bankAccount.bankAccount);

    return { selectedBankAccount, selectBankAccount };
};
