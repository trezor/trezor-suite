import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import styled from 'styled-components';
import { Textarea, colors, Icon } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import { Props } from './Container';

const Label = styled.div`
    display: flex;
    align-items: center;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
    display: flex;
    padding-left: 5px;
`;

const getError = (error: State['networkTypeEthereum']['data']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_HEX:
            return <Translation>{messages.TR_ETH_DATA_NOT_HEX}</Translation>;
        default:
            return null;
    }
};

export default ({ send, sendFormActionsEthereum, account }: Props) => {
    if (!send || !account) return null;
    const { data } = send.networkTypeEthereum;
    const { error, value } = data;

    return (
        <Textarea
            state={getInputState(error, value)}
            value={value || ''}
            bottomText={getError(error)}
            onChange={e => sendFormActionsEthereum.handleData(e.target.value)}
            topLabel={
                <Label>
                    Data
                    <StyledIcon size={12} color={colors.BLACK50} icon="QUESTION" />
                </Label>
            }
        />
    );
};
