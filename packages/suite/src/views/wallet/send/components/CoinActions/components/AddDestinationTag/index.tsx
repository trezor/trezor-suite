import React, { useState } from 'react';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';
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
    const { getDefaultValue, composeTransaction, resetDefaultValue } = useSendFormContext();
    const destinationTagValue = getDefaultValue('rippleDestinationTag') || '';
    const hasDestinationTag = destinationTagValue.length > 0;
    const [isActive, setIsActive] = useState(hasDestinationTag);

    React.useEffect(() => {
        // destinationTag could be loaded later from draft, open additional form
        if (hasDestinationTag) setIsActive(true);
    }, [hasDestinationTag]);

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
                    <Translation id="TR_XRP_DESTINATION_TAG" />
                </Button>
            )}
            {isActive && (
                <Active>
                    <DestinationTag
                        close={() => {
                            resetDefaultValue('rippleDestinationTag');
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
