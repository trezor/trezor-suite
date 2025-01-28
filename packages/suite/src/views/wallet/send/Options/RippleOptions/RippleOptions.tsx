import styled from 'styled-components';

import { Button, Tooltip } from '@trezor/components';

import { Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';

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

const Inline = styled.span`
    display: inline-flex;
`;

export const RippleOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const broadcastEnabled = options.includes('broadcast');

    return (
        <Wrapper>
            <Left>
                <Tooltip content={<Translation id="BROADCAST_TOOLTIP" />} cursor="pointer">
                    <Button
                        variant="tertiary"
                        size="small"
                        icon="broadcast"
                        onClick={() => {
                            toggleOption('broadcast');
                            composeTransaction();
                        }}
                    >
                        <Inline>
                            <Translation id="BROADCAST" />
                            <OnOffSwitcher isOn={broadcastEnabled} />
                        </Inline>
                    </Button>
                </Tooltip>
            </Left>
        </Wrapper>
    );
};
