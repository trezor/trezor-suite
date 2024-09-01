import styled from 'styled-components';

import { Button, Tooltip } from '@trezor/components';
import { useSendFormContext } from 'src/hooks/wallet';
import { Translation } from 'src/components/suite';
import { DestinationTag } from './DestinationTag';
import { OnOffSwitcher } from '../OnOffSwitcher';

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

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledButton = styled(Button)`
    margin-right: 8px;
`;

export const RippleOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction, resetDefaultValue } =
        useSendFormContext();

    const options = getDefaultValue('options', []);
    const destinationEnabled = options.includes('rippleDestinationTag');
    const broadcastEnabled = options.includes('broadcast');

    return (
        <Wrapper>
            <Left>
                {!destinationEnabled && (
                    <Tooltip
                        content={<Translation id="DESTINATION_TAG_TOOLTIP" />}
                        cursor="pointer"
                    >
                        <StyledButton
                            variant="tertiary"
                            size="small"
                            icon="database"
                            onClick={() => {
                                // open additional form
                                toggleOption('rippleDestinationTag');
                                composeTransaction();
                            }}
                        >
                            <Translation id="DESTINATION_TAG" />
                        </StyledButton>
                    </Tooltip>
                )}

                <Tooltip content={<Translation id="BROADCAST_TOOLTIP" />} cursor="pointer">
                    <StyledButton
                        variant="tertiary"
                        size="small"
                        icon="broadcast"
                        onClick={() => {
                            toggleOption('broadcast');
                            composeTransaction();
                        }}
                    >
                        <Translation id="BROADCAST" />
                        <OnOffSwitcher isOn={broadcastEnabled} />
                    </StyledButton>
                </Tooltip>
            </Left>

            {destinationEnabled && (
                <DestinationTag
                    close={() => {
                        resetDefaultValue('rippleDestinationTag');
                        // close additional form
                        toggleOption('rippleDestinationTag');
                        composeTransaction();
                    }}
                />
            )}
        </Wrapper>
    );
};
