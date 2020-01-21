import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Textarea } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';

import { Props } from './Container';

const getErrorData = (error: State['networkTypeEthereum']['data']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_HEX:
            return <Translation>{messages.TR_ETH_DATA_NOT_HEX}</Translation>;
        default:
            return null;
    }
};

const GasPrice = ({ send, sendFormActionsEthereum, account }: Props) => {
    if (!send || !account) return null;
    const { data } = send.networkTypeEthereum;
    const { error, value } = data;

    return (
        <Textarea
            state={getInputState(error, value)}
            value={value || ''}
            display="block"
            bottomText={getErrorData(error)}
            onChange={e => sendFormActionsEthereum.handleData(e.target.value)}
            topLabel={'Data'}
        />
    );
};

export default GasPrice;
