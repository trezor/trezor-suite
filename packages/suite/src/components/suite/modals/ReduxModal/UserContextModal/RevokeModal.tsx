import { useState } from 'react';

import styled from 'styled-components';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    type TradingExchangeType,
    invityAPI,
    tokenSupportsIncreasingAllowance,
    useTradingUtils,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    Banner,
    Box,
    CollapsibleBox,
    Column,
    Divider,
    Icon,
    Modal,
    Row,
    Text,
} from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders, spacings } from '@trezor/theme';

import { DebugOnlyBadge } from 'src/components/suite/DebugOnlyBadge';
import { AccountLabeling } from 'src/components/suite/labeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { useTradingExchangeCryptoAndProviderInfo } from 'src/hooks/wallet/trading/form/useTradingExchangeCryptoAndProviderInfo';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';
import { useAnalytics } from 'src/support/useAnalytics';
import { getProvidersInfoProps } from 'src/utils/wallet/trading/tradingTypingUtils';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

const BreakableValue = styled.span`
    word-break: break-all;
`;

const CustomIcon = styled.img`
    flex: none;
    width: 24px;
    height: 24px;
`;

type RevokeModalProps = {
    setIsWaitingForDevice: (value: boolean) => void;
    onCancel: (isSubmitting?: boolean) => void;
};

export const RevokeModal = ({ setIsWaitingForDevice, onCancel }: RevokeModalProps) => {
    const analytics = useAnalytics();
    const context = useTradingFormContext<TradingExchangeType>();
    const {
        form: {
            state: { isFormLoading },
        },
        device,
        account,
        selectedQuote,
        sendTransaction,
        feeInfo,
        composedLevels,
        changeFeeLevel,
        tradingReceiveAddress,
    } = context;

    const getCryptoInfo = useTradingExchangeCryptoAndProviderInfo();

    const isDebug = useSelector(selectIsDebugModeActive);

    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();

    const [isConfirmButtonLoading, setIsConfirmButtonLoading] = useState<boolean>(false);

    if (!selectedQuote?.exchange || !selectedQuote?.dexTx || !selectedQuote?.send) {
        return null;
    }

    const confirmAndSend = async () => {
        analytics.report({
            type: events.tradeApprovalEvent.name,
            payload: {
                type: 'revoke-modal',
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
                type: 'revoke-modal',
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
                type: 'revoke-modal',
                action: 'cancel',
                ...getCryptoInfo(),
            },
        });

        onCancel(isSubmitting);
    };

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(selectedQuote.send);
    const displaySymbol = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);
    const isIncreasingAllowanceSupported = tokenSupportsIncreasingAllowance(contractAddress);

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
                    id="TR_EXCHANGE_APPROVAL_REVOKE_TOKEN_SPENDING"
                    values={{ displaySymbol }}
                />
            }
            bottomContent={
                <>
                    {(selectedQuote.status === 'CONFIRM' ||
                        selectedQuote.status === 'APPROVAL_REQ') && (
                        <Modal.Button
                            size="medium"
                            isLoading={isFormLoading || isConfirmButtonLoading}
                            isDisabled={!device?.connected}
                            onClick={confirmAndSend}
                        >
                            <Translation id="TR_CONTINUE" />
                        </Modal.Button>
                    )}

                    {selectedQuote.status === 'ERROR' && (
                        <Modal.Button
                            size="medium"
                            isLoading={isFormLoading}
                            isDisabled={!device?.connected || isFormLoading}
                            onClick={onRefreshClick}
                        >
                            <Translation id="TR_EXCHANGE_APPROVAL_FORM_REFRESH_BUTTON" />
                        </Modal.Button>
                    )}

                    <Modal.Button
                        size="medium"
                        intent="neutral"
                        priority="secondary"
                        onClick={() => onClose()}
                    >
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
                {!isIncreasingAllowanceSupported && (
                    <Banner
                        intent="info"
                        icon="info"
                        description={
                            <Translation
                                id="TR_EXCHANGE_APPROVAL_MODAL_REVOKE_BANNER"
                                values={{ displaySymbol }}
                            />
                        }
                    />
                )}

                <Box
                    borderWidth={borders.widths.large}
                    padding={spacings.sm}
                    borderRadius={borders.radii.sm}
                >
                    <Column gap={spacings.sm}>
                        <Column gap={spacings.sm}>
                            <Text>
                                <Translation id="TR_EXCHANGE_APPROVAL_PROVIDER" />
                            </Text>
                            <Row gap={spacings.xs}>
                                {provider?.logo && (
                                    <CustomIcon
                                        src={invityAPI.getProviderLogoUrl(provider.logo)}
                                        alt={provider.logo}
                                    />
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

                        <Divider margin={{ top: 0, bottom: 0 }} />

                        <Row alignItems="flex-start" gap={spacings.xxxxl}>
                            <Column gap={spacings.sm} flex="1" overflow="hidden">
                                <Text>
                                    <Translation id="TR_EXCHANGE_APPROVAL_CURRENT_LIMIT" />
                                </Text>
                                <Row gap={spacings.sm}>
                                    <TradingCoinLogo cryptoId={selectedQuote.send} size={24} />
                                    {selectedQuote.preapprovedStringAmount} {displaySymbol}
                                </Row>
                            </Column>

                            <Column alignSelf="center">
                                <Icon name="arrowRight" />
                            </Column>

                            <Column gap={spacings.sm} flex="1">
                                <Text>
                                    <Translation id="TR_EXCHANGE_APPROVAL_NEW_LIMIT" />
                                </Text>
                                <Row gap={spacings.sm}>
                                    <TradingCoinLogo cryptoId={selectedQuote.send} size={24} />0{' '}
                                    {displaySymbol}
                                </Row>
                            </Column>
                        </Row>

                        {isDebug && selectedQuote.dexTx.data ? (
                            <CollapsibleBox
                                heading={
                                    <DebugOnlyBadge>
                                        <Translation id="TR_EXCHANGE_APPROVAL_DATA" />
                                    </DebugOnlyBadge>
                                }
                            >
                                <BreakableValue>{selectedQuote.dexTx.data}</BreakableValue>
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
