import { Translation } from '@suite/intl';
import { selectLanguage } from '@suite/settings';
import {
    type FormState,
    type GeneralPrecomposedTransactionFinal,
    type StakeFormState,
} from '@suite-common/wallet-types';
import { localizeNumber } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';

import {
    TransactionReviewOutputElement,
    type TransactionReviewOutputElementProps,
} from './TransactionReviewOutputElement';

type TransactionReviewTronFeeLimitOutputProps = {
    state: TransactionReviewOutputElementProps['state'];
    precomposedForm: FormState | StakeFormState;
    precomposedTx: GeneralPrecomposedTransactionFinal;
    account: Account;
};

export const TransactionReviewTronFeeLimitOutput = ({
    state,
    precomposedForm,
    precomposedTx,
    account,
}: TransactionReviewTronFeeLimitOutputProps) => {
    const locale = useSelector(selectLanguage);

    if (!('token' in precomposedTx) || !precomposedTx.token) {
        return null;
    }

    const feeLimitSun =
        precomposedForm.feeLimit !== ''
            ? precomposedForm.feeLimit
            : (precomposedTx.estimatedFeeLimit ?? precomposedTx.fee);

    return (
        <TransactionReviewOutputElement
            title={<Translation id="TR_SUMMARY" />}
            account={account}
            lines={[
                {
                    id: 'fee-limit',
                    label: <Translation id="TR_FEE_LIMIT" />,
                    value: `${localizeNumber(feeLimitSun, locale)} SUN`,
                    type: 'default',
                },
            ]}
            state={state}
        />
    );
};
