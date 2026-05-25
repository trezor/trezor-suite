import type { BankAccount } from 'invity-api';

export const verifiedBankAccount: BankAccount = {
    bankAccount: 'CZ6508000000192000145399',
    bic: 'GIBACZPX',
    holder: 'John Doe',
    verified: true,
};

export const unverifiedBankAccount: BankAccount = {
    bankAccount: 'CZ6508000000192000145400',
    bic: 'GIBACZPX',
    holder: 'Jane Smith',
    verified: false,
};

export const bankAccounts: BankAccount[] = [
    verifiedBankAccount,
    unverifiedBankAccount,
    {
        bankAccount: 'CZ6508000000192000145401',
        bic: 'GIBACZPX',
        holder: 'Bob Johnson',
        verified: true,
    },
];
