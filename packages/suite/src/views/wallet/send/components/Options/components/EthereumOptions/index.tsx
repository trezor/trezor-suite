import React from 'react';
import styled from 'styled-components';
import { Button, Tooltip } from '@trezor/components';
import { Translation } from '@suite-components';
import { OnOffSwitcher } from '@wallet-components';
import { useSendFormContext } from '@wallet-hooks';
import Data from './components/Data';

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

const EthereumOptions = () => {
    const {
        getDefaultValue,
        toggleOption,
        composeTransaction,
        resetDefaultValue,
    } = useSendFormContext();

    const options = getDefaultValue('options', []);
    const dataEnabled = options.includes('ethereumData');
    const tokenValue = getDefaultValue<string, string | undefined>('outputs[0].token', undefined);
    const broadcastEnabled = options.includes('broadcast');

    return (
        <Wrapper>
            {dataEnabled && (
                <Data
                    close={() => {
                        resetDefaultValue('ethereumDataAscii');
                        resetDefaultValue('ethereumDataHex');
                        // close additional form
                        toggleOption('ethereumData');
                        composeTransaction();
                    }}
                />
            )}
            <Left>
                {!dataEnabled && !tokenValue && (
                    <Tooltip content={<Translation id="DATA_ETH_ADD_TOOLTIP" />} cursor="pointer">
                        <StyledButton
                            variant="tertiary"
                            icon="DATA"
                            data-test="send/open-ethereum-data"
                            onClick={() => {
                                // open additional form
                                toggleOption('ethereumData');
                                composeTransaction();
                            }}
                        >
                            <Translation id="DATA_ETH_ADD" />
                        </StyledButton>
                    </Tooltip>
                )}
                <Tooltip content={<Translation id="BROADCAST_TOOLTIP" />} cursor="pointer">
                    <StyledButton
                        variant="tertiary"
                        icon="BROADCAST"
                        data-test="send/broadcast"
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
        </Wrapper>
    );
};

export default EthereumOptions;
