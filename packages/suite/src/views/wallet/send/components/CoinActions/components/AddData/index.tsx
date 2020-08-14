import React, { useState } from 'react';
import styled from 'styled-components';

import { Translation } from '@suite-components';
import { Button } from '@trezor/components';
import Data from './components/Data';
import { useSendFormContext } from '@wallet-hooks';

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
    const { getDefaultValue, composeTransaction, resetDefaultValue } = useSendFormContext();

    const dataValue = getDefaultValue('ethereumDataHex') || '';
    const hasData = dataValue.length > 0;
    const [isActive, setIsActive] = useState(hasData);

    React.useEffect(() => {
        // ethereumDataHex could be loaded later from draft, open additional form
        if (hasData) setIsActive(true);
    }, [hasData]);

    return (
        <Wrapper>
            {!isActive && (
                <Button
                    variant="tertiary"
                    icon="DATA"
                    onClick={() => {
                        // open additional form
                        setIsActive(true);
                    }}
                >
                    <Translation id="TR_ETH_ADD_DATA" />
                </Button>
            )}
            {isActive && (
                <Active>
                    <Data
                        close={() => {
                            resetDefaultValue('ethereumDataAscii');
                            resetDefaultValue('ethereumDataHex');
                            // close additional form
                            setIsActive(false);
                            composeTransaction('outputs[0].amount', false);
                        }}
                    />
                </Active>
            )}
        </Wrapper>
    );
};
