import { useEffect, useState } from 'react';
import { usePrevious } from 'react-use';

import { DexApprovalType, ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import {
    type TradingExchangeType,
    cryptoIdToNetwork,
    parseCryptoId,
    useTradingInfo,
} from '@suite-common/trading';
import { tradingExchangeActions } from '@suite-common/trading';
import { getExplorerUrl } from '@suite-common/wallet-config/src/getExplorerUrls';
import {
    Banner,
    Button,
    Card,
    CollapsibleBox,
    Column,
    Divider,
    InfoItem,
    Paragraph,
    Radio,
    Spinner,
    Text,
} from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';

import { AccountLabeling, Translation } from 'src/components/suite';
import { TxAddress } from 'src/components/suite/copy/TxAddress';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeWatchSendApproval } from 'src/hooks/wallet/trading/form/useTradingExchangeWatchSendApproval';
import useTradingVerifyAccount from 'src/hooks/wallet/trading/form/useTradingVerifyAccount';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';

// add APPROVED means no approval request is necessary
type ExtendedDexApprovalType = DexApprovalType | 'APPROVED';

const BreakableValue = styled.span`
    word-break: break-all;
`;

export const TradingOfferExchangeSendApproval = () => {
    const dispatch = useDispatch();
    const {
        form: {
            state: { isFormLoading },
        },
        device,
        account,
        selectedQuote,
        exchangeInfo,
        confirmTrade,
        sendTransaction,
        watchTradeApproval,
    } = useTradingFormContext<TradingExchangeType>();
    const { cryptoIdToCoinSymbol } = useTradingInfo();
    const [approvalType, setApprovalType] = useState<ExtendedDexApprovalType>(
        selectedQuote?.status === 'CONFIRM' ? 'APPROVED' : 'MINIMAL',
    );
    const [approvedQuote] = useState<ExchangeTrade | undefined>(
        selectedQuote?.status === 'CONFIRM' ? selectedQuote : undefined,
    );

    const currentQuoteStatus = selectedQuote?.status;
    const previousQuoteStatus = usePrevious(currentQuoteStatus);

    const { navigateToExchangeForm } = useTradingNavigation(account);

    useTradingExchangeWatchSendApproval({
        selectedQuote,
        watchTradeApproval,
    });

    const explorers = useSelector(state => state.wallet.explorer);

    const [approvalStep, setApprovalStep] = useState<
        'REQUIRED' | 'APPROVED' | 'LOADING' | undefined
    >();

    const { accountAddress } = useTradingVerifyAccount({
        cryptoId: selectedQuote?.receive,
        nonSuiteAccount: !selectedQuote?.tags?.includes('noExternalAddress'),
    });

    useEffect(() => {
        if (
            (!previousQuoteStatus || previousQuoteStatus === 'APPROVAL_REQ') &&
            currentQuoteStatus === 'APPROVAL_REQ'
        ) {
            setApprovalStep('REQUIRED');
        }

        if (
            (!previousQuoteStatus || previousQuoteStatus === 'APPROVAL_PENDING') &&
            currentQuoteStatus === 'APPROVAL_PENDING'
        ) {
            setApprovalStep('LOADING');
        }

        if (
            (!previousQuoteStatus || previousQuoteStatus === 'CONFIRM') &&
            currentQuoteStatus === 'CONFIRM'
        ) {
            setApprovalStep('APPROVED');
        }

        const forceConfirmTrade = async () => {
            if (!accountAddress?.address) {
                return;
            }

            await confirmTrade({
                trade: selectedQuote,
                receiveAddress: accountAddress?.address,
            });
        };

        if (previousQuoteStatus === 'APPROVAL_PENDING' && currentQuoteStatus === 'CONFIRM') {
            forceConfirmTrade();

            if (approvalType === 'ZERO') {
                setApprovalStep('REQUIRED');

                return;
            }

            setApprovalStep('APPROVED');
            dispatch(tradingExchangeActions.setFormStep('RECEIVING_ADDRESS'));
        }
    }, [
        currentQuoteStatus,
        previousQuoteStatus,
        approvalType,
        confirmTrade,
        selectedQuote,
        accountAddress,
        dispatch,
    ]);

    if (!selectedQuote) return null;

    const { exchange, dexTx } = selectedQuote;
    if (!exchange || !dexTx) return null;

    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    const isFullApproval = !(Number(selectedQuote.preapprovedStringAmount) > 0);

    if (!selectedQuote.send) return null;

    const network = cryptoIdToNetwork(selectedQuote.send);
    const explorer =
        network?.symbol && (explorers[network.symbol].custom ?? explorers[network.symbol].default);

    const isToken = parseCryptoId(selectedQuote.send)?.contractAddress !== undefined;

    if (isFullApproval && approvalType === 'ZERO') {
        setApprovalType('MINIMAL');
    }

    const translationValues = {
        value: selectedQuote.approvalStringAmount,
        send: cryptoIdToCoinSymbol(selectedQuote.send),
        provider: providerName,
    };

    const selectApprovalValue = async (type: ExtendedDexApprovalType) => {
        if (!selectedQuote.receiveAddress) {
            return;
        }

        setApprovalType(type);
        if (type !== 'APPROVED') {
            const updatedSelectedQuote = {
                ...selectedQuote,
                approvalType: type,
            };

            dispatch(tradingExchangeActions.saveSelectedQuote(updatedSelectedQuote));

            await confirmTrade({
                receiveAddress: selectedQuote.receiveAddress,
                extraField: undefined,
                trade: updatedSelectedQuote,
            });
        } else {
            dispatch(tradingExchangeActions.saveSelectedQuote(approvedQuote));
        }
    };

    // if the last step was change in approval, we have to recompute the swap request
    const proceedToSwap = async () => {
        if (!selectedQuote.receiveAddress) {
            return;
        }

        const updatedSelectedQuote: ExchangeTrade = {
            ...selectedQuote,
        };

        if (selectedQuote.approvalType) {
            updatedSelectedQuote.approvalType = undefined;
            dispatch(tradingExchangeActions.saveSelectedQuote(updatedSelectedQuote));
        }

        await confirmTrade({
            receiveAddress: selectedQuote.receiveAddress,
            extraField: undefined,
            trade: updatedSelectedQuote,
        });

        dispatch(tradingExchangeActions.setFormStep('RECEIVING_ADDRESS'));

        analytics.report({
            type: EventType.TradingExchange,
            payload: {
                action: 'continue',
                step: 'already-approved',
                approvalType: selectedQuote.approvalType,
            },
        });
    };

    const confirmAndSend = async () => {
        const result = await sendTransaction();

        dispatch(tradingExchangeActions.setFormStep('SEND_APPROVAL_TRANSACTION'));

        analytics.report({
            type: EventType.TradingExchange,
            payload: {
                action: result ? 'continue' : 'cancel',
                step: 'create-approval',
                approvalType,
            },
        });
    };

    return (
        <Column gap={spacings.lg} flex="1">
            <InfoItem label={<Translation id="TR_EXCHANGE_SEND_FROM" />}>
                <AccountLabeling account={account} />
            </InfoItem>
            <InfoItem
                label={
                    <Translation
                        id={
                            approvalType === 'APPROVED'
                                ? 'TR_EXCHANGE_SWAP_SEND_TO'
                                : 'TR_EXCHANGE_APPROVAL_SEND_TO'
                        }
                        values={translationValues}
                    />
                }
            >
                <TxAddress txAddress={dexTx.to} shouldChunk />
            </InfoItem>
            {selectedQuote.approvalSendTxHash && (
                <InfoItem label={<Translation id="TR_EXCHANGE_APPROVAL_TXID" />}>
                    <TxAddress
                        txAddress={selectedQuote.approvalSendTxHash}
                        explorerUrl={getExplorerUrl(explorer, 'tx')}
                        explorerUrlQueryString={explorer?.queryString}
                    />
                </InfoItem>
            )}

            {approvalStep === 'REQUIRED' && (
                <Card
                    label={
                        <Text typographyStyle="hint">
                            <Translation id="TR_EXCHANGE_APPROVAL_VALUE" />
                        </Text>
                    }
                    margin={{ top: spacings.md }}
                >
                    <Column gap={spacings.xl} alignItems="flex-start">
                        <>
                            <Radio
                                isChecked={approvalType === 'MINIMAL'}
                                onClick={() => selectApprovalValue('MINIMAL')}
                                verticalAlignment="center"
                                isDisabled={isFormLoading}
                            >
                                <Column alignItems="flex-start">
                                    <Text typographyStyle="highlight">
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL"
                                            values={translationValues}
                                        />
                                    </Text>
                                    <Paragraph typographyStyle="hint">
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO"
                                            values={translationValues}
                                        />
                                    </Paragraph>
                                </Column>
                            </Radio>
                            <Radio
                                isChecked={approvalType === 'INFINITE'}
                                onClick={() => selectApprovalValue('INFINITE')}
                                verticalAlignment="center"
                                isDisabled={isFormLoading}
                            >
                                <Column alignItems="flex-start">
                                    <Text typographyStyle="highlight">
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE"
                                            values={translationValues}
                                        />
                                    </Text>
                                    <Paragraph typographyStyle="hint">
                                        <Translation
                                            id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO"
                                            values={translationValues}
                                        />
                                    </Paragraph>
                                </Column>
                            </Radio>

                            {isToken && !isFullApproval && (
                                <Radio
                                    isChecked={approvalType === 'ZERO'}
                                    onClick={() => selectApprovalValue('ZERO')}
                                    verticalAlignment="center"
                                    isDisabled={isFormLoading}
                                >
                                    <Column alignItems="flex-start">
                                        <Text typographyStyle="highlight">
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_ZERO"
                                                values={translationValues}
                                            />
                                        </Text>
                                        <Paragraph typographyStyle="hint">
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_ZERO_INFO"
                                                values={translationValues}
                                            />
                                        </Paragraph>
                                    </Column>
                                </Radio>
                            )}
                        </>
                    </Column>
                </Card>
            )}

            {approvalStep === 'APPROVED' && (
                <Card
                    label={
                        <Text typographyStyle="hint">
                            <Translation id="TR_EXCHANGE_APPROVAL_VALUE" />
                        </Text>
                    }
                    margin={{ top: spacings.md }}
                >
                    <Column gap={spacings.xl} alignItems="flex-start">
                        <>
                            <Radio
                                isChecked={approvalType === 'APPROVED'}
                                onClick={() => selectApprovalValue('APPROVED')}
                                verticalAlignment="center"
                                isDisabled={isFormLoading}
                            >
                                <Column alignItems="flex-start">
                                    <Text typographyStyle="highlight">
                                        {!isToken && (
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_NOT_REQUIRED"
                                                values={translationValues}
                                            />
                                        )}
                                        {isToken && selectedQuote.approvalSendTxHash && (
                                            <Translation id="TR_EXCHANGE_APPROVAL_SUCCESS" />
                                        )}
                                        {isToken && !selectedQuote.approvalSendTxHash && (
                                            <Translation id="TR_EXCHANGE_APPROVAL_PREAPPROVED" />
                                        )}
                                    </Text>
                                    <Paragraph typographyStyle="hint">
                                        <Translation id="TR_EXCHANGE_APPROVAL_PROCEED" />
                                    </Paragraph>
                                </Column>
                            </Radio>

                            {isToken && !isFullApproval && (
                                <Radio
                                    isChecked={approvalType === 'ZERO'}
                                    onClick={() => selectApprovalValue('ZERO')}
                                    verticalAlignment="center"
                                    isDisabled={isFormLoading}
                                >
                                    <Column alignItems="flex-start">
                                        <Text typographyStyle="highlight">
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_ZERO"
                                                values={translationValues}
                                            />
                                        </Text>
                                        <Paragraph typographyStyle="hint">
                                            <Translation
                                                id="TR_EXCHANGE_APPROVAL_VALUE_ZERO_INFO"
                                                values={translationValues}
                                            />
                                        </Paragraph>
                                    </Column>
                                </Radio>
                            )}
                        </>
                    </Column>
                </Card>
            )}

            {approvalStep === 'LOADING' && (
                <Column
                    alignItems="center"
                    justifyContent="center"
                    margin={{ top: spacings.xxxxl, bottom: spacings.md }}
                >
                    <Spinner />
                    <Paragraph typographyStyle="highlight" margin={{ top: spacings.lg }}>
                        <Translation id="TR_EXCHANGE_APPROVAL_CONFIRMING" />
                    </Paragraph>
                </Column>
            )}

            {dexTx.data && (selectedQuote.status !== 'CONFIRM' || approvalType === 'ZERO') && (
                <CollapsibleBox heading={<Translation id="TR_EXCHANGE_APPROVAL_DATA" />}>
                    <BreakableValue>{dexTx.data}</BreakableValue>
                </CollapsibleBox>
            )}

            {selectedQuote.status === 'ERROR' && (
                <Banner variant="destructive" icon margin={{ top: spacings.xl }}>
                    <Translation id="TR_EXCHANGE_APPROVAL_FAILED" />
                </Banner>
            )}

            <Column>
                <Divider margin={{ top: spacings.xxs, bottom: spacings.lg }} />

                {(approvalStep === 'REQUIRED' ||
                    (approvalStep === 'APPROVED' && approvalType === 'ZERO')) && (
                    <Button
                        isLoading={isFormLoading}
                        isDisabled={!device?.connected}
                        onClick={confirmAndSend}
                    >
                        <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                    </Button>
                )}

                {approvalStep === 'APPROVED' && approvalType !== 'ZERO' && (
                    <Button
                        isLoading={isFormLoading}
                        isDisabled={isFormLoading}
                        onClick={proceedToSwap}
                    >
                        <Translation id="TR_EXCHANGE_APPROVAL_TO_SWAP_BUTTON" />
                    </Button>
                )}

                {selectedQuote.status === 'ERROR' && (
                    <Button onClick={navigateToExchangeForm}>
                        <Translation id="TR_EXCHANGE_DETAIL_ERROR_BUTTON" />
                    </Button>
                )}
            </Column>
        </Column>
    );
};
