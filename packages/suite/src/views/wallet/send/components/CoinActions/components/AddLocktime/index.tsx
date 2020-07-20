import React, { useState } from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button } from '@trezor/components';
import Locktime from './components/Locktime';

const Wrapper = styled.div`
    display: flex;
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
                    icon="CALENDAR"
                    onClick={() => {
                        setIsActive(true);
                    }}
                >
                    <Translation id="TR_ADD_LOCKTIME" />
                </Button>
            )}
            {isActive && (
                <Active>
                    <Locktime setIsActive={setIsActive} />
                </Active>
            )}
        </Wrapper>
    );
};
