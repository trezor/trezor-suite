import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { Input, Textarea } from '@trezor/components-v2';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';
import { State } from '@wallet-types/sendForm';
import { getInputState } from '@wallet-utils/sendFormUtils';
import React from 'react';
import styled from 'styled-components';

import TransactionInfo from '../TransactionInfo/Container';
import Fee from '../Fee';
import Layout from '../Layout';
import DataTopLabel from './components/DataTopLabel';
import GasLimitTopLabel from './components/GasLimitTopLabel';
import GasPriceTopLabel from './components/GasPriceTopLabel';
import { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
`;

const Row = styled.div`
    margin-bottom: 15px;
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

const NetworkTypeEthereum = ({
    send,
    sendFormActions,
    sendFormActionsEthereum,
    selectedAccount,
}: Props) => {
    const { account } = selectedAccount;
    if (!send || !account) return null;
    const { transactionInfo } = send.networkTypeEthereum;
    const { gasLimit, gasPrice, data } = send.networkTypeEthereum;
    return (
        <Wrapper>
            <Layout
                left={
                    <>
                        <Row>
                            <Fee
                                networkType={account.networkType}
                                feeLevels={send.feeInfo.levels}
                                sendFormActions={sendFormActions}
                                selectedFee={send.selectedFee}
                                symbol={account.symbol}
                            />
                        </Row>
                        <Row>
                            <GasInput
                                variant="small"
                                display="block"
                                state={getInputState(gasLimit.error, gasLimit.value)}
                                topLabel={<GasLimitTopLabel />}
                                bottomText={getErrorGasLimit(gasLimit.error)}
                                value={gasLimit.value || ''}
                                isDisabled={false}
                                onChange={e =>
                                    sendFormActionsEthereum.handleGasLimit(e.target.value)
                                }
                            />
                        </Row>
                        <Row>
                            <GasInput
                                variant="small"
                                display="block"
                                state={getInputState(gasPrice.error, gasPrice.value)}
                                topLabel={<GasPriceTopLabel />}
                                bottomText={getErrorGasPrice(gasPrice.error)}
                                value={gasPrice.value || ''}
                                onChange={e =>
                                    sendFormActionsEthereum.handleGasPrice(e.target.value)
                                }
                            />
                        </Row>
                    </>
                }
                right={null}
                middle={
                    <Textarea
                        state={getInputState(data.error, data.value)}
                        value={send.networkTypeEthereum.data.value || ''}
                        display="block"
                        bottomText={getErrorData(data.error)}
                        onChange={e => sendFormActionsEthereum.handleData(e.target.value)}
                        topLabel={<DataTopLabel />}
                    />
                }
                bottom={transactionInfo?.type === 'final' ? <TransactionInfo /> : null}
            />
        </Wrapper>
    );
};

export default NetworkTypeEthereum;
