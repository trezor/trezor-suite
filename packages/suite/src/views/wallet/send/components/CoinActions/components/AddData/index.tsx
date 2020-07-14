import React, { useState } from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button } from '@trezor/components';
import Data from './components/Data';

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
                    <Translation id="TR_ETH_ADD_DATA" />
                </Button>
            )}
            {isActive && (
                <Active>
                    <Data setIsActive={setIsActive} />
                </Active>
            )}
        </Wrapper>
    );
};
