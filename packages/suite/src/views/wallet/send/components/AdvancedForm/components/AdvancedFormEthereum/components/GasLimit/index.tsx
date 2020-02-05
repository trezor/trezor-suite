import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Input } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';

import { Props } from './Container';

const getError = (error: State['networkTypeEthereum']['gasLimit']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation>{messages.TR_ETH_GAS_LIMIT_NOT_NUMBER}</Translation>;
        default:
            return null;
    }
};

export default ({ send, sendFormActionsEthereum, account }: Props) => {
    if (!send || !account) return null;
    const { selectedFee } = send;
    const { gasLimit, data } = send.networkTypeEthereum;
    const { error, value } = gasLimit;

    return (
        <Input
            variant="small"
            disabled={selectedFee.label === 'custom' && data.value !== null}
            state={getInputState(error, value, true)}
            topLabel="Gas limit"
            bottomText={getError(error)}
            value={value || ''}
            onChange={e => sendFormActionsEthereum.handleGasLimit(e.target.value)}
        />
    );
};
