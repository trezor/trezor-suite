import React from 'react';
import styled from 'styled-components';
import { Props } from './Container';
import { Input, TextArea } from '@trezor/components';
import GasLimitTopLabel from './components/GasLimitTopLabel';
import GasPriceTopLabel from './components/GasPriceTopLabel';
import DataTopLabel from './components/DataTopLabel';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    padding: 0 0 30px 0;
    display: flex;

    &:last-child {
        padding: 0;
    }
`;

const GasInput = styled(Input)`
    padding-bottom: 28px;
    &:first-child {
        padding-right: 20px;
    }
`;

const NetworkTypeEthereum = ({ send, sendFormActionsEthereum }: Props) => {
    if (!send) return null;
    return (
        <Wrapper>
            <Row>
                <GasInput
                    state={undefined}
                    topLabel={<GasLimitTopLabel />}
                    bottomText={undefined}
                    value={send.networkTypeEthereum.gasLimit.value || ''}
                    isDisabled={false}
                    onChange={e => sendFormActionsEthereum.handleGasLimit(e.target.value)}
                />

                <GasInput
                    state={undefined}
                    topLabel={<GasPriceTopLabel />}
                    bottomText=""
                    value={send.networkTypeEthereum.gasPrice.value || ''}
                    onChange={e => sendFormActionsEthereum.handleGasPrice(e.target.value)}
                />
            </Row>
            <Row>
                <TextArea
                    value={send.networkTypeEthereum.data.value || ''}
                    topLabel={<DataTopLabel />}
                />
            </Row>
        </Wrapper>
    );
};

export default NetworkTypeEthereum;
