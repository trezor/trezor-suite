import { useState } from 'react';

import { DexApprovalType, ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import {
    type TradingExchangeType,
    cryptoIdToSymbol,
    parseCryptoId,
    useTradingInfo,
} from '@suite-common/trading';
import { tradingExchangeActions } from '@suite-common/trading';
import { getNetwork } from '@suite-common/wallet-config';
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

import { AccountLabeling, Address, Translation } from 'src/components/suite';
import { IOAddress } from 'src/components/suite/copy/IOAddress';
import { useDispatch } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeWatchSendApproval } from 'src/hooks/wallet/trading/form/useTradingExchangeWatchSendApproval';
import { useTradingNavigation } from 'src/hooks/wallet/useTradingNavigation';

// add APPROVED means no approval request is necessary
type ExtendedDexApprovalType = DexApprovalType | 'APPROVED';

const BreakableValue = styled.span`
    word-break: break-all;
`;

export const TradingOfferExchangeSendApproval = () => {
    const dispatch = useDispatch();
    const {
        type,
        device,
        account,
        callInProgress,
        selectedQuote,
        exchangeInfo,
        confirmTrade,
        sendTransaction,
    } = useTradingFormContext<TradingExchangeType>();
    const { cryptoIdToCoinSymbol } = useTradingInfo(type);
    const [approvalType, setApprovalType] = useState<ExtendedDexApprovalType>(
        selectedQuote?.status === 'CONFIRM' ? 'APPROVED' : 'MINIMAL',
    );

    const { navigateToExchangeForm } = useTradingNavigation(account);

    useTradingExchangeWatchSendApproval({
        selectedQuote,
        confirmTrade,
    });

    if (!selectedQuote) return null;

    const { exchange, dexTx } = selectedQuote;
    if (!exchange || !dexTx) return null;

    const providerName =
        exchangeInfo?.providerInfos[exchange]?.companyName || selectedQuote.exchange;

    const isFullApproval = !(Number(selectedQuote.preapprovedStringAmount) > 0);

    if (!selectedQuote.send) return null;

    const symbol = cryptoIdToSymbol(selectedQuote.send);
    const network = symbol && getNetwork(symbol);

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
                <Address value={dexTx.to} />
            </InfoItem>
            {selectedQuote.approvalSendTxHash && (
                <InfoItem label={<Translation id="TR_EXCHANGE_APPROVAL_TXID" />}>
                    <IOAddress
                        txAddress={selectedQuote.approvalSendTxHash}
                        explorerUrl={network?.explorer.tx}
                        explorerUrlQueryString={network?.explorer.queryString}
                    />
                </InfoItem>
            )}
            {selectedQuote.status === 'APPROVAL_PENDING' && (
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
            {selectedQuote.status === 'ERROR' && (
                <Banner variant="destructive" icon margin={{ top: spacings.xl }}>
                    <Translation id="TR_EXCHANGE_APPROVAL_FAILED" />
                </Banner>
            )}

            {(selectedQuote.status === 'APPROVAL_REQ' || selectedQuote.status === 'CONFIRM') && (
                <Card
                    label={
                        <Text typographyStyle="hint">
                            <Translation id="TR_EXCHANGE_APPROVAL_VALUE" />
                        </Text>
                    }
                    margin={{ top: spacings.md }}
                >
                    <Column gap={spacings.xl} alignItems="flex-start">
                        {selectedQuote.status === 'APPROVAL_REQ' && (
                            <>
                                <Radio
                                    isChecked={approvalType === 'MINIMAL'}
                                    onClick={() => selectApprovalValue('MINIMAL')}
                                    verticalAlignment="center"
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
                            </>
                        )}
                        {selectedQuote.status !== 'APPROVAL_REQ' && (
                            <Radio
                                isChecked={approvalType === 'APPROVED'}
                                onClick={() => selectApprovalValue('APPROVED')}
                                verticalAlignment="center"
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
                        )}
                        {isToken && !isFullApproval && (
                            <Radio
                                isChecked={approvalType === 'ZERO'}
                                onClick={() => selectApprovalValue('ZERO')}
                                verticalAlignment="center"
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
                    </Column>
                </Card>
            )}

            {dexTx.data && (selectedQuote.status !== 'CONFIRM' || approvalType === 'ZERO') && (
                <CollapsibleBox heading={<Translation id="TR_EXCHANGE_APPROVAL_DATA" />}>
                    <BreakableValue>{dexTx.data}</BreakableValue>
                </CollapsibleBox>
            )}

            <Column>
                <Divider margin={{ top: spacings.xxs, bottom: spacings.lg }} />
                {(selectedQuote.status === 'APPROVAL_REQ' ||
                    (selectedQuote.status === 'CONFIRM' && approvalType === 'ZERO')) && (
                    <Button
                        isLoading={callInProgress}
                        isDisabled={!device?.connected}
                        onClick={confirmAndSend}
                    >
                        <Translation id="TR_EXCHANGE_CONFIRM_ON_TREZOR_SEND" />
                    </Button>
                )}

                {selectedQuote.status === 'CONFIRM' && approvalType !== 'ZERO' && (
                    <Button
                        isLoading={callInProgress}
                        isDisabled={callInProgress}
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
