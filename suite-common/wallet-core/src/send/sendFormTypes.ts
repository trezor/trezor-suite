import {
    Account,
    ComposeActionContext,
    FormState,
    PrecomposedTransactionFinal,
} from '@suite-common/wallet-types';

export type ComposeTransactionThunkArguments = {
    formValues: FormState;
    formState: ComposeActionContext;
};

export type SignTransactionThunkArguments = {
    formValues: FormState;
    precomposedTransaction: PrecomposedTransactionFinal;
    selectedAccount?: Account;
};
