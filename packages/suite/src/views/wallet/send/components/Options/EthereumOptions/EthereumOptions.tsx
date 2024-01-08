import styled from 'styled-components';

import { FormOptions } from '@suite-common/wallet-types';
import { Button, Tooltip } from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { Data } from './Data';
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

const StyledButton = styled(Button)`
    margin-right: 8px;
`;

export const EthereumOptions = () => {
    const { getDefaultValue, toggleOption, composeTransaction } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const dataEnabled = options.includes('ethereumData');
    const tokenValue = getDefaultValue<string, string | undefined>('outputs.0.token', undefined);
    const broadcastEnabled = options.includes('broadcast');

    const toggle = (option: FormOptions) => {
        toggleOption(option);
        composeTransaction();
    };
    const toggleData = () => toggle('ethereumData');
    const toggleBroadcast = () => toggle('broadcast');

    return (
        <Wrapper>
            <Left>
                {!dataEnabled && !tokenValue && (
                    <Tooltip content={<Translation id="DATA_ETH_ADD_TOOLTIP" />} cursor="pointer">
                        <StyledButton
                            variant="tertiary"
                            size="small"
                            icon="DATA"
                            data-test="send/open-ethereum-data"
                            onClick={toggleData}
                        >
                            <Translation id="DATA_ETH_ADD" />
                        </StyledButton>
                    </Tooltip>
                )}

                <Tooltip content={<Translation id="BROADCAST_TOOLTIP" />} cursor="pointer">
                    <StyledButton
                        variant="tertiary"
                        size="small"
                        icon="BROADCAST"
                        data-test="send/broadcast"
                        onClick={toggleBroadcast}
                    >
                        <Translation id="BROADCAST" />
                        <OnOffSwitcher isOn={broadcastEnabled} />
                    </StyledButton>
                </Tooltip>
            </Left>

            {dataEnabled && <Data close={toggleData} />}
        </Wrapper>
    );
};
