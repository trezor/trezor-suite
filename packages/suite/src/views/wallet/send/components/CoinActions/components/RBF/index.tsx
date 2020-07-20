import React, { useState } from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button } from '@trezor/components';

const Wrapper = styled.div`
    display: flex;
    margin-left: 8px;
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
                    icon="RBF"
                    onClick={() => {
                        setIsActive(true);
                    }}
                >
                    <Translation id="TR_RBF" />
                </Button>
            )}
            {isActive && <Active>a</Active>}
        </Wrapper>
    );
};
