import React from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice, variables, Button } from '@trezor/components';
import { FiatValue, Translation, Modal } from '@suite-components';
import { useDevice, useActions, useSelector } from '@suite-hooks';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { UserContextPayload } from '@suite-actions/modalActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';

import Output, { OutputProps, Left, Right, Coin, Fiat, Symbol, Amounts } from './components/Output';
import Detail from './components/Detail';

const Bottom = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    padding-top: 20px;
`;

const BottomContent = styled.div`
    padding: 20px;
    padding-top: 0px; /* Bottom padding */
    display: flex;
    justify-content: space-between;
    flex: 1;
`;

const Total = styled(Left)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const StyledButton = styled(Button)`
    display: flex;
    align-self: center;
    width: 240px;
`;

const Content = styled.div`
    padding: 20px 20px 0 20px;
`;

const TotalFiat = styled(Fiat)`
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const getState = (index: number, buttonRequests: number) => {
    if (index === buttonRequests - 1) {
        return 'active';
    }

    if (index < buttonRequests - 1) {
        return 'success';
    }

    return undefined;
};

type Props =
    | Extract<UserContextPayload, { type: 'coinmarket-review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined };

const CoinmarketReviewTransaction = (props: Props) => {
    const { selectedAccount, reviewData } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
        reviewData: state.wallet.coinmarket.transaction.reviewData,
    }));
    const { cancelSignTx } = useActions({
        cancelSignTx: sendFormActions.cancelSignTx,
    });
    const { device } = useDevice();

    if (!reviewData) {
        return null;
    }

    const { transactionInfo, signedTx } = reviewData;
    if (selectedAccount.status !== 'loaded' || !device || !transactionInfo) return null;

    const { symbol, networkType } = selectedAccount.account;
    const outputs: OutputProps[] = [];
    transactionInfo.transaction.outputs.forEach(o => {
        if (typeof o.address === 'string') {
            outputs.push({
                type: 'regular',
                label: o.address,
                value: o.amount,
                token: transactionInfo.token,
            });
        } else if (o.script_type === 'PAYTOOPRETURN') {
            outputs.push({
                type: 'opreturn',
                value: o.op_return_data,
            });
        }
    });

    // if (precomposedForm.bitcoinLockTime) {
    //     outputs.push({ type: 'locktime', value: precomposedForm.bitcoinLockTime });
    // }

    // if (precomposedForm.ethereumDataHex) {
    //     outputs.push({ type: 'data', value: precomposedForm.ethereumDataHex });
    // }

    if (networkType === 'ripple') {
        // ripple displays requests on device in different order:
        // 1. destination tag
        // 2. fee
        // 3. output
        outputs.unshift({ type: 'fee', value: transactionInfo.fee });
        if (reviewData.extraFields?.destinationTag) {
            outputs.unshift({
                type: 'destination-tag',
                value: reviewData.extraFields.destinationTag,
            });
        }
    } else {
        outputs.push({ type: 'fee', value: transactionInfo.fee });
    }

    // omit other button requests (like passphrase)
    const buttonRequests = device.buttonRequests.filter(
        r => r === 'ButtonRequest_ConfirmOutput' || r === 'ButtonRequest_SignTx',
    );

    return (
        <Modal
            noPadding
            size="large"
            header={
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    steps={outputs.length}
                    activeStep={signedTx ? outputs.length + 1 : buttonRequests.length}
                    trezorModel={device.features?.major_version === 1 ? 1 : 2}
                    successText={<Translation id="TR_CONFIRMED_TX" />}
                    onCancel={cancelSignTx}
                />
            }
            bottomBar={
                <Bottom>
                    {!transactionInfo.token && (
                        <BottomContent>
                            <Total>
                                <Translation
                                    id="TOTAL_SYMBOL"
                                    values={{ symbol: symbol.toUpperCase() }}
                                />
                            </Total>
                            <Right>
                                <Amounts>
                                    <Coin bold>
                                        {formatNetworkAmount(transactionInfo.totalSpent, symbol)}
                                        <Symbol>{symbol}</Symbol>
                                    </Coin>
                                    <TotalFiat>
                                        <FiatValue
                                            disableHiddenPlaceholder
                                            amount={formatNetworkAmount(
                                                transactionInfo.totalSpent,
                                                symbol,
                                            )}
                                            symbol={symbol}
                                        />
                                    </TotalFiat>
                                </Amounts>
                            </Right>
                        </BottomContent>
                    )}
                    <StyledButton
                        isDisabled={!signedTx}
                        onClick={() => {
                            if (props.decision) {
                                props.decision.resolve(true);
                            }
                        }}
                    >
                        <Translation id="SEND_TRANSACTION" />
                    </StyledButton>
                </Bottom>
            }
        >
            <Content>
                {outputs.map((output, index) => {
                    const state = signedTx ? 'success' : getState(index, buttonRequests.length);

                    return (
                        <Output
                            // it's safe to use array index since outputs do not change
                            // eslint-disable-next-line react/no-array-index-key
                            key={index}
                            {...output}
                            state={state}
                            symbol={symbol}
                        />
                    );
                })}
                <Detail tx={transactionInfo} txHash={signedTx ? signedTx.tx : undefined} />
            </Content>
        </Modal>
    );
};

export default CoinmarketReviewTransaction;
