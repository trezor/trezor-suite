import React, { useState } from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button, Icon } from '@trezor/components';
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

const Left = styled.div``;

const Right = styled.div`
    display: flex;
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
                    <Left>
                        <DestinationTag />
                    </Left>
                    <Right>
                        <Icon size={20} icon="CROSS" onClick={() => setIsActive(false)} />
                    </Right>
                </Active>
            )}
        </Wrapper>
    );
};
