import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Input, Tooltip, Icon, colors } from '@trezor/components';
import sendMessages from '@wallet-views/account/messages';
import commonMessages from '@wallet-views/messages';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    padding: 0 0 30px 0;
    display: flex;

    &:last-child {
        padding: 0;
    }
`;

const Label = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
`;

const NetworkTypeBitcoin = () => (
    <Wrapper>
        <Row>
            <Input
                state={undefined}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                topLabel={
                    <Label>
                        <FormattedMessage {...sendMessages.TR_FEE} />
                    </Label>
                }
                bottomText=""
                value=""
                onChange={() => {}}
            />
        </Row>
    </Wrapper>
);

export default NetworkTypeBitcoin;
