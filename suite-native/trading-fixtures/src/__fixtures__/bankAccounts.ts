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

const verifiedBankAccount = bankAccounts[0];
const unverifiedBankAccount = bankAccounts[1];

if (!verifiedBankAccount || !unverifiedBankAccount) {
    throw new Error('bankAccounts fixture is missing required entries');
}

export { verifiedBankAccount, unverifiedBankAccount };
