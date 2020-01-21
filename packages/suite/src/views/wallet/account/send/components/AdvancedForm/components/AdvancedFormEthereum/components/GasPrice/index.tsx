import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Input } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';

import { Props } from './Container';

const getErrorGasPrice = (error: State['networkTypeEthereum']['gasPrice']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation>{messages.TR_ETH_GAS_PRICE_NOT_NUMBER}</Translation>;
        default:
            return null;
    }
};

const GasPrice = ({ send, sendFormActionsEthereum, account }: Props) => {
    if (!send || !account) return null;
    const { gasPrice } = send.networkTypeEthereum;

    return (
        <Input
            variant="small"
            display="block"
            state={getInputState(gasPrice.error, gasPrice.value)}
            topLabel={'Gas Price'}
            bottomText={getErrorGasPrice(gasPrice.error)}
            value={gasPrice.value || ''}
            onChange={e => sendFormActionsEthereum.handleGasPrice(e.target.value)}
        />
    );
};

export default GasPrice;
