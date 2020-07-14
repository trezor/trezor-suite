import React, { useState } from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button } from '@trezor/components';
import DestinationTag from './components/DestinationTag';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
`;

const Active = styled.div`
    display: flex;
    width: 100%;
    justify-content: space-between;
`;

export default () => {
    const [isActive, setIsActive] = useState(false);

    return (
        <Wrapper>
            {!isActive && (
                <Button
                    variant="tertiary"
                    icon="DATA"
                    onClick={() => {
                        setIsActive(true);
                    }}
                >
                    <Translation id="TR_XRP_DESTINATION_TAG" />
                </Button>
            )}
            {isActive && (
                <Active>
                    <DestinationTag setIsActive={setIsActive} />
                </Active>
            )}
        </Wrapper>
    );
};
