import { SUITE } from '@suite-actions/constants';
import styled from 'styled-components';
import messages from '@suite/support/messages';
import { H2, P, Button } from '@trezor/components';
import { Translation, Image } from '@suite-components';
import React from 'react';

import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    padding: 100px 120px;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

const ImageWrapper = styled.div`
    width: 360px;
`;

const StyledP = styled(P)`
    max-width: 500px;
`;

const Acquire = ({ device, locks, acquireDevice }: Props) => {
    if (!device) return null;
    const locked = locks.includes(SUITE.LOCK_TYPE.DEVICE) || locks.includes(SUITE.LOCK_TYPE.UI);
    return (
        <Wrapper>
            <H2>
                <Translation {...messages.TR_ACQUIRE_DEVICE_TITLE} />
            </H2>
            <StyledP>
                <Translation {...messages.TR_ACQUIRE_DEVICE_DESCRIPTION} />
            </StyledP>
            <ImageWrapper>
                <Image image="DEVICE_ANOTHER_SESSION" />
            </ImageWrapper>
            <Button isLoading={locked} onClick={() => acquireDevice()}>
                <Translation {...messages.TR_ACQUIRE_DEVICE} />
            </Button>
        </Wrapper>
    );
};

export default Acquire;
