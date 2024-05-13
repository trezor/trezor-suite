import {
    Account,
    FormState,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';



export type SignTransactionThunkArguments = {
    formValues: FormState;
    transactionInfo: PrecomposedTransactionFinal;
    selectedAccount?: Account;
};
