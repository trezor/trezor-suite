import React from 'react';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import styled from 'styled-components';
import { getInputState } from '@wallet-utils/sendFormUtils';
import { Props } from './Container';
import { Input, Textarea } from '@trezor/components-v2';
import GasLimitTopLabel from './components/GasLimitTopLabel';
import GasPriceTopLabel from './components/GasPriceTopLabel';
import DataTopLabel from './components/DataTopLabel';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Row = styled.div`
    display: flex;

    &:last-child {
        padding: 0;
    }
`;

const GasInput = styled(Input)`
    &:first-child {
        padding-right: 20px;
    }
`;

const getErrorGasLimit = (error: State['networkTypeEthereum']['gasLimit']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation>{messages.TR_ETH_GAS_LIMIT_NOT_NUMBER}</Translation>;
        default:
            return null;
    }
};

const getErrorGasPrice = (error: State['networkTypeEthereum']['gasPrice']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_NUMBER:
            return <Translation>{messages.TR_ETH_GAS_PRICE_NOT_NUMBER}</Translation>;
        default:
            return null;
    }
};

const getErrorData = (error: State['networkTypeEthereum']['data']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.NOT_HEX:
            return <Translation>{messages.TR_ETH_DATA_NOT_HEX}</Translation>;
        default:
            return null;
    }
};

const NetworkTypeEthereum = ({ send, sendFormActionsEthereum }: Props) => {
    if (!send) return null;

    const { gasLimit, gasPrice, data } = send.networkTypeEthereum;
    return (
        <Wrapper>
            <Row>
                <GasInput
                    variant="small"
                    state={getInputState(gasLimit.error, gasLimit.value)}
                    topLabel={<GasLimitTopLabel />}
                    bottomText={getErrorGasLimit(gasLimit.error)}
                    value={gasLimit.value || ''}
                    isDisabled={false}
                    onChange={e => sendFormActionsEthereum.handleGasLimit(e.target.value)}
                />
            </Row>
            <Row>
                <GasInput
                    variant="small"
                    state={getInputState(gasPrice.error, gasPrice.value)}
                    topLabel={<GasPriceTopLabel />}
                    bottomText={getErrorGasPrice(gasPrice.error)}
                    value={send.networkTypeEthereum.gasPrice.value || ''}
                    onChange={e => sendFormActionsEthereum.handleGasPrice(e.target.value)}
                />
            </Row>
            <Row>
                <Textarea
                    state={getInputState(data.error, data.value)}
                    value={send.networkTypeEthereum.data.value || ''}
                    bottomText={getErrorData(data.error)}
                    onChange={e => sendFormActionsEthereum.handleData(e.target.value)}
                    topLabel={<DataTopLabel />}
                />
            </Row>
        </Wrapper>
    );
};

export default NetworkTypeEthereum;
