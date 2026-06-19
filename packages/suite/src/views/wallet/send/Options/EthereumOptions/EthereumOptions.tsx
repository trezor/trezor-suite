import { Translation } from '@suite/intl';
import { formInputsMaxLength } from '@suite-common/validators';
import { type FormOptions } from '@suite-common/wallet-types';
import { Button, Column, Row, Tooltip } from '@trezor/components';

import { useSendFormContext } from 'src/hooks/wallet';

import { TransactionData } from '../shared/TransactionData';

export const EthereumOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const dataEnabled = options.includes('transactionData');
    const tokenValue = getDefaultValue<string, string | undefined>('outputs.0.token', undefined);

    const toggle = (option: FormOptions) => {
        toggleOption(option);
        composeTransaction();
    };
    const toggleData = () => toggle('transactionData');

    return (
        <Column gap={16}>
            <Row gap={8}>
                {!dataEnabled && !tokenValue && (
                    <Tooltip content={<Translation id="DATA_ADD_TOOLTIP" />} cursor="pointer">
                        <Button
                            intent="neutral"
                            priority="secondary"
                            iconLeft="database"
                            data-testid="send/open-ethereum-data"
                            onClick={toggleData}
                        >
                            <Translation id="DATA_ADD" />
                        </Button>
                    </Tooltip>
                )}
            </Row>

            {dataEnabled && (
                <TransactionData maxBytes={formInputsMaxLength.ethData} close={toggleData} />
            )}
        </Column>
    );
};
