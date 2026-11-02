import { useState } from 'react';

import { type BankAccount } from 'invity-api';

import { sellUtils } from '@suite-common/trading';

export const useTradingSellBankAccountSelection = (
    bankAccounts: BankAccount[] | undefined,
    confirmedBankAccount: BankAccount | undefined,
) => {
    const [selectedIban, setSelectedIban] = useState<string>();

    const selectedBankAccount =
        confirmedBankAccount ?? sellUtils.findSelectedBankAccount(bankAccounts, selectedIban);

    const selectBankAccount = (bankAccount: BankAccount) =>
        setSelectedIban(bankAccount.bankAccount);

    return { selectedBankAccount, selectBankAccount };
};
