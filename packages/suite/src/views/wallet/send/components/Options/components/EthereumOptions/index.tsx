import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
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
                )}
                <StyledButton
                    variant="tertiary"
                    icon="RBF"
                    data-test="send/broadcast"
                    onClick={() => {
                        toggleOption('broadcast');
                        composeTransaction();
                    }}
                >
                    <Translation id="BROADCAST" />
                    <OnOffSwitcher isOn={broadcastEnabled} />
                </StyledButton>
            </Left>
        </Wrapper>
    );
};

export default EthereumOptions;
