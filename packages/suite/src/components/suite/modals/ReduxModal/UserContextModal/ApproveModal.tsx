import { useState } from 'react';

import { type DexApprovalType, type ExchangeTrade } from 'invity-api';
import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    type TradingExchangeType,
    invityAPI,
    tradingExchangeActions,
    useTradingUtils,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    Box,
    CollapsibleBox,
    Column,
    Modal,
    Paragraph,
    RadioCard,
    Row,
    Text,
} from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders, spacings } from '@trezor/theme';

import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { AccountLabeling } from 'src/components/suite/labeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';
import { useAnalytics } from 'src/support/useAnalytics';
import { type TradingExchangeApprovalType } from 'src/types/trading/tradingForm';
import { getProvidersInfoProps } from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

const BreakableValue = styled.span`
    word-break: break-all;
`;

const Icon = styled.img`
    flex: none;
    width: 24px;
    height: 24px;
`;

type ApproveModalProps = {
    setApprovalType: (approvalType: TradingExchangeApprovalType) => void;
    setIsWaitingForDevice: (value: boolean) => void;
    onCancel: (isSubmitting?: boolean) => void;
};

export const ApproveModal = ({
    setApprovalType: setParentApprovalType,
    setIsWaitingForDevice,
    onCancel,
}: ApproveModalProps) => {
    const dispatch = useDispatch();
    const analytics = useAnalytics();
    const context = useTradingFormContext<TradingExchangeType>();
    const {
        form: {
            state: { isFormLoading },
        },
        device,
        account,
        selectedQuote,
        exchangeInfo,
        confirmApproval,
        sendTransaction,
        preselectedQuote,
        feeInfo,
        composedLevels,
        setValue,
        changeFeeLevel,
        fetchFeesAndCompose,
        tradingReceiveAddress,
    } = context;

    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();

    const isDebug = useSelector(selectIsDebugModeActive);

    const { cryptoIdToSymbolAndContractAddress, cryptoIdToCoinSymbol } = useTradingUtils();
    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(selectedQuote?.send);
    const displaySymbol = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);

    const [approvalType, setApprovalType] = useState<DexApprovalType>('MINIMAL');
    const [isConfirmButtonLoading, setIsConfirmButtonLoading] = useState<boolean>(false);

    if (!selectedQuote) return null;

    const { exchange, dexTx } = selectedQuote;
    if (!exchange || !dexTx) return null;

    const quoteExchange = preselectedQuote?.exchange ?? exchange;

    const providerName = exchangeInfo?.providerInfos[quoteExchange]?.companyName || quoteExchange;

    if (!selectedQuote.send) return null;

    const translationValues = {
        value: selectedQuote.approvalStringAmount,
        send: cryptoIdToCoinSymbol(selectedQuote.send),
        provider: providerName,
    };

    const selectApprovalValue = async (type: DexApprovalType) => {
        if (!selectedQuote.receiveAddress || approvalType === type) {
            return;
        }

        if (['MINIMAL', 'INFINITE'].includes(type)) {
            analytics.report({
                type: events.tradeApprovalEvent.name,
                payload: {
                    type: 'approve-modal',
                    action: type === 'MINIMAL' ? 'limit-exact' : 'limit-unlimited',
                    ...getCryptoInfo(),
                },
            });
        }

        setIsConfirmButtonLoading(true);
        setApprovalType(type);

        switch (type) {
            case 'MINIMAL':
            case 'INFINITE':
                setParentApprovalType('APPROVE');
                break;
            case 'ZERO':
                setParentApprovalType('REVOKE');
                break;
        }

        const updatedSelectedQuote: ExchangeTrade = {
            ...selectedQuote,
            approvalType: type,
        };

        dispatch(tradingExchangeActions.saveSelectedQuote(updatedSelectedQuote));

        const trade = await confirmApproval({
            trade: updatedSelectedQuote,
            receiveAddress: selectedQuote.receiveAddress,
        });

        setValue('transactionData', trade?.dexTx?.data);

        await fetchFeesAndCompose();

        setIsConfirmButtonLoading(false);
    };

    const confirmAndSend = async () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'continue',
                ...getCryptoInfo(),
            },
        });

        setIsConfirmButtonLoading(true);
        setIsWaitingForDevice(true);

        onCancel(true);

        await sendTransaction();

        setIsConfirmButtonLoading(false);
        setIsWaitingForDevice(false);
    };

    const onRefreshClick = async () => {
        const { receiveAddress } = tradingReceiveAddress;
        if (!receiveAddress) return;

        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'refresh',
                ...getCryptoInfo(),
            },
        });

        await context.confirmTrade({
            receiveAddress,
            trade: { ...selectedQuote, status: 'CONFIRM' },
        });
    };

    const onClose = (isSubmitting?: boolean) => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'cancel',
                ...getCryptoInfo(),
            },
        });

        onCancel(isSubmitting);
    };

    const providers = getProvidersInfoProps(context);
    const provider =
        selectedQuote && selectedQuote.exchange && providers
            ? providers[selectedQuote.exchange]
            : undefined;

    return (
        <Modal
            onCancel={() => onClose()}
            intent="brand"
            width={600}
            heading={
                <Translation
                    id="TR_EXCHANGE_APPROVAL_APPROVE_TOKEN_SPENDING"
                    values={{ displaySymbol }}
                />
            }
            bottomContent={
                <>
                    {selectedQuote.status === 'APPROVAL_REQ' && (
                        <Modal.Button
                            isLoading={isFormLoading || isConfirmButtonLoading}
                            isDisabled={!device?.connected}
                            onClick={confirmAndSend}
                        >
                            <Translation id="TR_CONTINUE" />
                        </Modal.Button>
                    )}

                    {selectedQuote.status === 'ERROR' && (
                        <Modal.Button
                            isLoading={isFormLoading}
                            isDisabled={!device?.connected || isFormLoading}
                            onClick={onRefreshClick}
                        >
                            <Translation id="TR_EXCHANGE_APPROVAL_FORM_REFRESH_BUTTON" />
                        </Modal.Button>
                    )}

                    <Modal.Button intent="neutral" priority="secondary" onClick={() => onClose()}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            description={
                <Row margin={{ top: spacings.xs }} gap={spacings.xxs}>
                    <CoinLogo size={20} symbol={account.symbol} />
                    <AccountLabeling
                        account={account}
                        showAccountTypeBadge
                        accountTypeBadgeSize="small"
                    />
                </Row>
            }
            // Disable shadow bottom to make `Fees` component fully visible
            shadowBottom={false}
        >
            <Column gap={spacings.sm}>
                <Box
                    padding={spacings.sm}
                    borderWidth={borders.widths.large}
                    borderRadius={borders.radii.sm}
                >
                    <Column gap={spacings.sm}>
                        <Text>
                            <Translation id="TR_EXCHANGE_APPROVAL_PROVIDER" />
                        </Text>
                        <Row gap={spacings.xs}>
                            {provider?.logo && (
                                <Icon src={invityAPI.getProviderLogoUrl(provider.logo)} alt="" />
                            )}
                            <Column>
                                {provider?.companyName && <Text>{provider.companyName}</Text>}
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    {contractAddress}
                                </Text>
                            </Column>
                        </Row>
                    </Column>
                </Box>

                <Box
                    borderWidth={borders.widths.large}
                    padding={spacings.sm}
                    borderRadius={borders.radii.sm}
                >
                    <Column gap={spacings.sm}>
                        <Text>
                            <Translation id="TR_EXCHANGE_APPROVAL_SET_LIMIT" />
                        </Text>
                        <RadioCard
                            isActive={approvalType === 'INFINITE'}
                            isDisabled={isConfirmButtonLoading}
                            onClick={() => selectApprovalValue('INFINITE')}
                        >
                            <Row>
                                <TradingCoinLogo
                                    cryptoId={selectedQuote.send}
                                    size={20}
                                    margin={{ right: spacings.xxs }}
                                />
                                <Text>
                                    <Translation id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE" />
                                </Text>
                            </Row>
                            <Paragraph
                                margin={{ top: spacings.xxs }}
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation
                                    id="TR_EXCHANGE_APPROVAL_VALUE_INFINITE_INFO"
                                    values={translationValues}
                                />
                            </Paragraph>
                        </RadioCard>
                        <RadioCard
                            isActive={approvalType === 'MINIMAL'}
                            isDisabled={isConfirmButtonLoading}
                            onClick={() => selectApprovalValue('MINIMAL')}
                        >
                            <Row>
                                <TradingCoinLogo
                                    cryptoId={selectedQuote.send}
                                    size={20}
                                    margin={{ right: spacings.xxs }}
                                />
                                <Text>
                                    <Translation
                                        id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL"
                                        values={translationValues}
                                    />
                                </Text>
                            </Row>
                            <Paragraph
                                margin={{ top: spacings.xxs }}
                                typographyStyle="body-sm"
                                intent="neutral"
                                priority="secondary"
                            >
                                <Translation
                                    id="TR_EXCHANGE_APPROVAL_VALUE_MINIMAL_INFO"
                                    values={translationValues}
                                />
                            </Paragraph>
                        </RadioCard>
                        {isDebug && dexTx.data ? (
                            <CollapsibleBox
                                heading={
                                    <DebugOnlyBadge>
                                        <Translation id="TR_EXCHANGE_APPROVAL_DATA" />
                                    </DebugOnlyBadge>
                                }
                            >
                                <BreakableValue>{dexTx.data}</BreakableValue>
                            </CollapsibleBox>
                        ) : null}
                    </Column>
                </Box>

                <Box
                    padding={spacings.sm}
                    borderWidth={borders.widths.large}
                    borderRadius={borders.radii.sm}
                >
                    <Fees
                        label="TR_TX_FEE"
                        feeInfo={feeInfo}
                        account={account}
                        composedLevels={composedLevels}
                        changeFeeLevel={changeFeeLevel}
                    />
                </Box>
            </Column>
        </Modal>
    );
};
