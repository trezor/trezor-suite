import React from 'react';
import styled from 'styled-components';
import { useSendFormContext } from '@wallet-hooks';
import { Translation } from '@suite-components';
import { OnOffSwitcher } from '@wallet-components';
import { Button } from '@trezor/components';
import DestinationTag from './components/DestinationTag';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Left = styled.div`
    display: flex;
    flex: 1;
    justify-content: flex-start;
`;

const StyledButton = styled(Button)`
    margin-right: 8px;
`;

const RippleOptions = () => {
    const {
        getDefaultValue,
        toggleOption,
        composeTransaction,
        resetDefaultValue,
    } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const destinationEnabled = options.includes('rippleDestinationTag');
    const broadcastEnabled = options.includes('broadcast');

    return (
        <Wrapper>
            {destinationEnabled && (
                <DestinationTag
                    close={() => {
                        resetDefaultValue('rippleDestinationTag');
                        // close additional form
                        toggleOption('rippleDestinationTag');
                        composeTransaction('outputs[0].amount', false);
                    }}
                />
            )}
            <Left>
                {!destinationEnabled && (
                    <StyledButton
                        variant="tertiary"
                        icon="DATA"
                        onClick={() => {
                            // open additional form
                            toggleOption('rippleDestinationTag');
                            composeTransaction('outputs[0].amount', false);
                        }}
                    >
                        <Translation id="DESTINATION_TAG" />
                    </StyledButton>
                )}

                <StyledButton
                    variant="tertiary"
                    icon="RBF"
                    onClick={() => {
                        toggleOption('broadcast');
                        composeTransaction('outputs[0].amount', false);
                    }}
                >
                    <Translation id="BROADCAST" />
                    <OnOffSwitcher isOn={broadcastEnabled} />
                </StyledButton>
            </Left>
        </Wrapper>
    );
};

export default RippleOptions;
