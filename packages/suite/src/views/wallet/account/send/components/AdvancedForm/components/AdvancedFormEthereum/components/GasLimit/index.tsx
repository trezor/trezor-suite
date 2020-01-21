import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Input } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';

import { Props } from './Container';

const getErrorGasLimit = (error: State['networkTypeEthereum']['gasLimit']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation>{messages.TR_ETH_GAS_LIMIT_NOT_NUMBER}</Translation>;
        default:
            return null;
    }
};

const GasPrice = ({ send, sendFormActionsEthereum, account }: Props) => {
    if (!send || !account) return null;
    const { gasLimit } = send.networkTypeEthereum;
    const { error, value } = gasLimit;
    return (
        <Input
            variant="small"
            display="block"
            state={getInputState(error, value)}
            topLabel={'Gas limit'}
            bottomText={getErrorGasLimit(error)}
            value={value || ''}
            onChange={e => sendFormActionsEthereum.handleGasLimit(e.target.value)}
        />
    );
};

export default GasPrice;
