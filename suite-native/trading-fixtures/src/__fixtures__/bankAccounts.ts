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

const verifiedBankAccountEntry = bankAccounts[0];
const unverifiedBankAccountEntry = bankAccounts[1];

if (!verifiedBankAccountEntry || !unverifiedBankAccountEntry) {
    throw new Error('bankAccounts fixture is missing required entries');
}

export const verifiedBankAccount: BankAccount = verifiedBankAccountEntry;
export const unverifiedBankAccount: BankAccount = unverifiedBankAccountEntry;
