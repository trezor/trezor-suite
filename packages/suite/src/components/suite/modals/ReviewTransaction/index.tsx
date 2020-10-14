import React, { createRef } from 'react';
import styled from 'styled-components';
import { colors, Modal, ConfirmOnDevice, Button, variables } from '@trezor/components';
import { FiatValue, Translation } from '@suite-components';
import { useDevice, useActions } from '@suite-hooks';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { copyToClipboard, download } from '@suite-utils/dom';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as notificationActions from '@suite-actions/notificationActions';

import { Props } from './Container';
import Output, { OutputProps, Left, Right, Coin, Fiat, Symbol, Amounts } from './components/Output';
import Detail from './components/Detail';

const Bottom = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    border-top: 1px solid ${colors.NEUE_STROKE_GREY};
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
    color: ${colors.NEUE_TYPE_DARK_GREY};
`;

const Content = styled.div`
    padding: 20px 20px 0 20px;
`;

const Buttons = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
`;

const StyledButton = styled(Button)`
    display: flex;
    align-self: center;
    width: 240px;
`;

const TotalFiat = styled(Fiat)`
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const getState = (index: number, buttonRequests: number) => {
    if (index === buttonRequests - 1) {
        return 'warning';
    }

    if (index < buttonRequests - 1) {
        return 'success';
    }

    return undefined;
};

const ReviewTransaction = ({ selectedAccount, send, decision }: Props) => {
    const htmlElement = createRef<HTMLDivElement>();
    const { device } = useDevice();
    const { cancelSignTx, addNotification } = useActions({
        cancelSignTx: sendFormActions.cancelSignTx,
        addNotification: notificationActions.addToast,
    });

    const { precomposedTx, precomposedForm, signedTx } = send;
    if (selectedAccount.status !== 'loaded' || !device || !precomposedTx || !precomposedForm)
        return null;

    const { symbol, networkType } = selectedAccount.account;
    const broadcastEnabled = precomposedForm.options.includes('broadcast');

    const outputs: OutputProps[] = [];
    precomposedTx.transaction.outputs.forEach(o => {
        if (typeof o.address === 'string') {
            outputs.push({
                type: 'regular',
                label: o.address,
                value: o.amount,
                token: precomposedTx.token,
            });
        } else if (o.script_type === 'PAYTOOPRETURN') {
            outputs.push({
                type: 'opreturn',
                value: o.op_return_data,
            });
        }
    });

    if (precomposedForm.bitcoinLockTime) {
        outputs.push({ type: 'locktime', value: precomposedForm.bitcoinLockTime });
    }

    if (precomposedForm.ethereumDataHex) {
        outputs.push({ type: 'data', value: precomposedForm.ethereumDataHex });
    }

    if (networkType === 'ripple') {
        // ripple displays requests on device in different order:
        // 1. destination tag
        // 2. fee
        // 3. output
        outputs.unshift({ type: 'fee', value: precomposedTx.fee });
        if (precomposedForm.rippleDestinationTag) {
            outputs.unshift({
                type: 'destination-tag',
                value: precomposedForm.rippleDestinationTag,
            });
        }
    } else {
        outputs.push({ type: 'fee', value: precomposedTx.fee });
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
                    {!precomposedTx.token && (
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
                                        {formatNetworkAmount(precomposedTx.totalSpent, symbol)}
                                        <Symbol>{symbol}</Symbol>
                                    </Coin>
                                    <TotalFiat>
                                        <FiatValue
                                            disableHiddenPlaceholder
                                            amount={formatNetworkAmount(
                                                precomposedTx.totalSpent,
                                                symbol,
                                            )}
                                            symbol={symbol}
                                        />
                                    </TotalFiat>
                                </Amounts>
                            </Right>
                        </BottomContent>
                    )}
                    {broadcastEnabled ? (
                        <StyledButton
                            isDisabled={!signedTx}
                            onClick={() => {
                                if (decision) decision.resolve(true);
                            }}
                        >
                            <Translation id="SEND_TRANSACTION" />
                        </StyledButton>
                    ) : (
                        <Buttons ref={htmlElement}>
                            <StyledButton
                                isDisabled={!signedTx}
                                onClick={async () => {
                                    const result = copyToClipboard(
                                        signedTx!.tx,
                                        htmlElement.current,
                                    );
                                    if (typeof result !== 'string') {
                                        addNotification({ type: 'copy-to-clipboard' });
                                    }
                                }}
                            >
                                <Translation id="COPY_TRANSACTION_TO_CLIPBOARD" />
                            </StyledButton>
                            <StyledButton
                                variant="secondary"
                                isDisabled={!signedTx}
                                onClick={() => download(signedTx!.tx, 'signed-transaction.txt')}
                            >
                                <Translation id="DOWNLOAD_TRANSACTION" />
                            </StyledButton>
                        </Buttons>
                    )}
                </Bottom>
            }
        >
            <Content>
                {outputs.map((output, index) => {
                    const state = signedTx ? 'success' : getState(index, buttonRequests.length);
                    // it's safe to use array index since outputs do not change
                    // eslint-disable-next-line react/no-array-index-key
                    return <Output key={index} {...output} state={state} symbol={symbol} />;
                })}
                <Detail tx={precomposedTx} txHash={signedTx ? signedTx.tx : undefined} />
            </Content>
        </Modal>
    );
};

export default ReviewTransaction;
