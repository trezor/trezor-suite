import { SUITE } from '@suite-actions/constants';
import styled from 'styled-components';
import messages from '@suite/support/messages';
import { H2, P, Button } from '@trezor/components-v2';
import { resolveStaticPath } from '@suite-utils/nextjs';
import { Translation } from '@suite-components/Translation';
import React from 'react';

import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    padding: 100px 120px;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`;

const Image = styled.img`
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
            <Image src={resolveStaticPath('images/suite/device-another-session.svg')} />
            <Button isLoading={locked} onClick={() => acquireDevice()}>
                <Translation {...messages.TR_ACQUIRE_DEVICE} />
            </Button>
        </Wrapper>
    );
};

export default Acquire;
