import React, { createRef } from 'react';
import styled from 'styled-components';
import { ConfirmOnDevice, Button, variables, Icon, useTheme, CoinLogo } from '@trezor/components';
import { FiatValue, Translation, Modal } from '@suite-components';
import { useDevice, useActions } from '@suite-hooks';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { copyToClipboard, download } from '@suite-utils/dom';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as notificationActions from '@suite-actions/notificationActions';

import { Props } from './Container';
import Output, { OutputProps, Left, Right, Coin, Fiat, Symbol, Amounts } from './components/Output';
import Indicator from './components/Indicator';
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

const ReviewRbf = styled.div`
    display: flex;
    padding: 0 0 20px 0;
`;

const ReviewRbfLeft = styled.div`
    padding: 20px 15px;
    display: flex;
    flex-direction: column;
    border-radius: 7px;
    background: ${props => props.theme.BG_GREY};
    width: 225px;
    justify-content: center;
    align-items: center;
`;

const ReviewRbfRight = styled.div`
    flex: 1;
    margin: 20px 0 10px 40px;
    max-width: 435px;
`;

const ReviewRbfRightTop = styled.div`
    flex: 1;
`;

const ReviewRbfRightBottom = styled.div`
    margin: 20px 0 0 50px;
    padding: 20px 0 0 0;
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
`;

const ReviewRbfIconWrapper = styled.div`
    background-color: ${props => props.theme.BG_WHITE};
    padding: 4px;
    border-radius: 100px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    & > svg {
        margin: 0 auto;
        display: block;
    }
`;

const ReviewRbfNestedIconWrapper = styled(ReviewRbfIconWrapper)`
    width: 16px;
    height: 16px;
    position: absolute;
    top: 0px;
    right: 0px;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2);
`;

const ReviewRbfHeadline = styled.div`
    font-size: 16px;
    font-weight: 600;
    margin-top: 20px;
`;

const ReviewRbfAccount = styled.div`
    font-size: 12px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    display: flex;
    margin-top: 5px;
    & > div {
        margin: 1px 5px 0 0;
        display: block;
    }
`;

const ReviewRbfLeftDetials = styled.div`
    border-top: 1px solid ${props => props.theme.STROKE_GREY};
    margin-top: 20px;
    padding: 20px 0;
    width: 100%;
    flex-direction: column;
`;

const ReviewRbfLeftDetailsLine = styled.div`
    display: flex;
    font-size: 12px;
    & + & {
        margin-top: 10px;
    }
`;

const ReviewRbfLeftDetailsLineLeft = styled.div`
    display: flex;
    margin: 0 5px 0 0;
    width: 50%;
    color: ${props => props.theme.TYPE_LIGHT_GREY};

    & > div:first-child {
        margin: 1px 5px 0 0;
        display: block;
    }
`;

const ReviewRbfLeftDetailsLineRight = styled.div<{ color: string; uppercase?: boolean }>`
    color: ${props => props.color};
    font-weight: 500;
    ${({ uppercase }) =>
        uppercase &&
        `
        text-transform: uppercase;
  `};
`;

const ReviewRbfStep = styled.div`
    display: flex;
    padding: 0 20px 0 0;
    & + & {
        margin-top: 20px;
    }
`;

const ReviewRbfStepHeadline = styled.div`
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 2px;
    color: ${props => props.theme.TYPE_DARK_GREY};
`;

const ReviewRbfStepTransaction = styled.div`
    font-size: 12px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    word-break: break-word;
    font-weight: 500;
`;

const ReviewRbfStepAmount = styled.div`
    font-size: 12px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: 500;
    & + & {
        margin-top: 20px;
    }
`;

const ReviewRbfStepValue = styled.div`
    font-size: 14px;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-weight: 500;
`;

const ReviewRbfStepLeft = styled.div`
    display: flex;
    width: 50px;
    margin-top: -5px;
`;

const ReviewRbfStepRight = styled.div`
    flex: 1;
    text-align: left;
`;

const ReviewRbfSubmit = styled(Button)`
    display: flex;
    align-self: center;
    width: 100%;
`;

const ReviewRbfDualIndicatorWrapper = styled.div`
    display: flex;
    align-self: center;
    height: 60px;
    align-items: center;
    position: relative;
    z-index: 1;

    &:after {
        z-index: -2;
        width: 10px;
        left: 10px;
        position: absolute;
        height: 100%;
        border-top: 1px solid ${props => props.theme.STROKE_GREY};
        border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
        border-left: 1px solid ${props => props.theme.STROKE_GREY};
        content: '';
        display: block;
    }
    &:before {
        z-index: -1;
        width: 20px;
        background: ${props => props.theme.BG_WHITE};
        position: absolute;
        height: 50%;
        content: '';
        display: block;
    }
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
    const theme = useTheme();
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
    if (precomposedTx.prevTxid && !device.unavailableCapabilities?.replaceTransaction) {
        outputs.push({
            type: 'txid',
            value: precomposedTx.prevTxid,
        });
    } else {
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
    }

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

    const RBF = true;

    return (
        <>
            {RBF && (
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
                            animated
                            onCancel={cancelSignTx}
                        />
                    }
                >
                    <Content>
                        <ReviewRbf>
                            <ReviewRbfLeft>
                                <ReviewRbfIconWrapper>
                                    <CoinLogo size={48} symbol={symbol} />
                                    <ReviewRbfNestedIconWrapper>
                                        <Icon size={12} color={theme.TYPE_DARK_GREY} icon="SEND" />
                                    </ReviewRbfNestedIconWrapper>
                                </ReviewRbfIconWrapper>
                                <ReviewRbfHeadline>Change Fee</ReviewRbfHeadline>
                                <ReviewRbfAccount>
                                    <Icon size={12} color={theme.TYPE_DARK_GREY} icon="WALLET" />{' '}
                                    Account #1
                                </ReviewRbfAccount>
                                <ReviewRbfLeftDetials>
                                    <ReviewRbfLeftDetailsLine>
                                        <ReviewRbfLeftDetailsLineLeft>
                                            <Icon
                                                size={12}
                                                color={theme.TYPE_LIGHT_GREY}
                                                icon="GAS"
                                            />
                                            Speed
                                        </ReviewRbfLeftDetailsLineLeft>
                                        <ReviewRbfLeftDetailsLineRight color={theme.TYPE_DARK_GREY}>
                                            12345 Sat/B
                                        </ReviewRbfLeftDetailsLineRight>
                                    </ReviewRbfLeftDetailsLine>
                                    <ReviewRbfLeftDetailsLine>
                                        <ReviewRbfLeftDetailsLineLeft>
                                            <Icon
                                                size={12}
                                                color={theme.TYPE_LIGHT_GREY}
                                                icon="RBF"
                                            />
                                            <Translation id="RBF" />
                                        </ReviewRbfLeftDetailsLineLeft>
                                        <ReviewRbfLeftDetailsLineRight
                                            color={theme.TYPE_GREEN}
                                            uppercase
                                        >
                                            <Translation id="TR_ON" />
                                        </ReviewRbfLeftDetailsLineRight>
                                    </ReviewRbfLeftDetailsLine>
                                </ReviewRbfLeftDetials>
                            </ReviewRbfLeft>
                            <ReviewRbfRight>
                                <ReviewRbfRightTop>
                                    <ReviewRbfStep>
                                        <ReviewRbfStepLeft>
                                            <Indicator state="success" size={16} />
                                        </ReviewRbfStepLeft>
                                        <ReviewRbfStepRight>
                                            <ReviewRbfStepHeadline>
                                                <Translation id="TR_TRANSACTION_ID" />
                                            </ReviewRbfStepHeadline>
                                            <ReviewRbfStepTransaction>
                                                #$G#W$T%$YTW$%y4w5yt54gtgw456g45yt45sys45y45y54rhh6ys45y51111111111
                                            </ReviewRbfStepTransaction>
                                        </ReviewRbfStepRight>
                                    </ReviewRbfStep>
                                    <ReviewRbfStep>
                                        <ReviewRbfStepLeft>
                                            <ReviewRbfDualIndicatorWrapper>
                                                <Indicator size={16} />
                                            </ReviewRbfDualIndicatorWrapper>
                                        </ReviewRbfStepLeft>
                                        <ReviewRbfStepRight>
                                            <ReviewRbfStepAmount>
                                                <ReviewRbfStepHeadline>
                                                    <Translation id="TR_INCREASED_BY" />
                                                </ReviewRbfStepHeadline>
                                                <ReviewRbfStepValue>
                                                    12345 BTC
                                                </ReviewRbfStepValue>
                                            </ReviewRbfStepAmount>
                                            <ReviewRbfStepAmount>
                                                <ReviewRbfStepHeadline>
                                                    <Translation id="TR_NEW_FEE" />
                                                </ReviewRbfStepHeadline>
                                                <ReviewRbfStepValue>
                                                    12345 BTC
                                                </ReviewRbfStepValue>
                                            </ReviewRbfStepAmount>
                                        </ReviewRbfStepRight>
                                    </ReviewRbfStep>
                                </ReviewRbfRightTop>
                                <ReviewRbfRightBottom>
                                    <ReviewRbfSubmit variant="primary" onClick={() => {}}>
                                        <Translation id="SEND_TRANSACTION" />
                                    </ReviewRbfSubmit>
                                </ReviewRbfRightBottom>
                            </ReviewRbfRight>
                        </ReviewRbf>
                    </Content>
                </Modal>
            )}
            {!RBF && (
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
                            animated
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
                                                {formatNetworkAmount(
                                                    precomposedTx.totalSpent,
                                                    symbol,
                                                )}
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
                                        onClick={() => {
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
                                        onClick={() =>
                                            download(signedTx!.tx, 'signed-transaction.txt')
                                        }
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
                            const state = signedTx
                                ? 'success'
                                : getState(index, buttonRequests.length);
                            // it's safe to use array index since outputs do not change
                            // eslint-disable-next-line react/no-array-index-key
                            return <Output key={index} {...output} state={state} symbol={symbol} />;
                        })}
                        <Detail tx={precomposedTx} txHash={signedTx ? signedTx.tx : undefined} />
                    </Content>
                </Modal>
            )}
        </>
    );
};

export default ReviewTransaction;
