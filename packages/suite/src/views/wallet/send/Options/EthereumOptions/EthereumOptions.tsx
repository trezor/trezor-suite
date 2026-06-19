import { formInputsMaxLength } from '@suite-common/validators';
import { type FormOptions } from '@suite-common/wallet-types';
import { Column } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

import { TransactionData } from '../shared/TransactionData';

export const EthereumOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const dataEnabled = options.includes('transactionData');

    const toggle = (option: FormOptions) => {
        toggleOption(option);
        composeTransaction();
    };
    const toggleData = () => toggle('transactionData');

    return (
        <Column gap={16}>
            {dataEnabled && (
                <TransactionData maxBytes={formInputsMaxLength.ethData} close={toggleData} />
            )}
        </Column>
    );
};
