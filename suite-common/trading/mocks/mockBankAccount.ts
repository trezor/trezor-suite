import { type BankAccount } from 'invity-api';

export const mockBankAccount = (bankAccount: Partial<BankAccount> = {}): BankAccount => ({
    bankAccount: 'LT253250037491714738',
    holder: 'holder',
    verified: true,
    ...bankAccount,
});
