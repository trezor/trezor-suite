import type { BankAccount } from 'invity-api';

export const bankAccounts: BankAccount[] = [
    {
        bankAccount: 'CZ6508000000192000145399',
        bic: 'GIBACZPX',
        holder: 'John Doe',
        verified: true,
    },
    {
        bankAccount: 'CZ6508000000192000145400',
        bic: 'GIBACZPX',
        holder: 'Jane Smith',
        verified: false,
    },
    {
        bankAccount: 'CZ6508000000192000145401',
        bic: 'GIBACZPX',
        holder: 'Bob Johnson',
        verified: true,
    },
];

export const verifiedBankAccount: BankAccount = bankAccounts[0];
export const unverifiedBankAccount: BankAccount = bankAccounts[1];
