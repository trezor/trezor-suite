import { SUITE } from '@suite-actions/constants';
import styled from 'styled-components';
import messages from '@suite/support/messages';
import { H2, P, Button } from '@trezor/components-v2';
import { Translation } from '@suite-components/Translation';
import React from 'react';

import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    padding: 100px 170px;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

// TODO add proper image
const Image = styled.div`
    margin: 50px;
    width: 252px;
    height: 170px;
    background: #d8d9da;
`;

const StyledP = styled(P)`
    max-width: 400px;
`;

const Acquire = ({ device, locks, acquireDevice }: Props) => {
    if (!device) return null;
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <Wrapper>
            <H2>
                <Translation {...messages.TR_ACQUIRE_DEVICE_TITLE} />
            </H2>
            <StyledP size="tiny">
                <Translation {...messages.TR_ACQUIRE_DEVICE_DESCRIPTION} />
            </StyledP>
            <Image />
            <Button isLoading={locked} onClick={() => acquireDevice()}>
                <Translation {...messages.TR_ACQUIRE_DEVICE} />
            </Button>
        </Wrapper>
    );
};

export default Acquire;
