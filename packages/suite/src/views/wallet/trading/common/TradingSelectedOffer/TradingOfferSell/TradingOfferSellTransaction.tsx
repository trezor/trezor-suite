import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import {
    selectTradingSellActiveTrade,
    selectTradingSellInfo,
    selectTradingSellIsLoading,
    selectTradingSellSelectedQuote,
} from '@suite-common/trading';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Button, Column, Divider, Spinner, Text } from '@trezor/components';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { AccountLabeling } from 'src/components/suite/labeling/AccountLabeling';
import { useSelector } from 'src/hooks/suite';
import { useTradingSellTradeActions } from 'src/hooks/wallet/trading/useTradingSellTradeActions';
import { useTradingWatchTrade } from 'src/hooks/wallet/trading/useTradingWatchTrade';

export const TradingSelectedOfferSellTransaction = () => {
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const { handleClick, disabled } = useAsyncClickHandler();
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { device } = useDevice();
    const { account, sendTransaction } = useTradingSellTradeActions();
    const sellInfo = useSelector(selectTradingSellInfo);
    const isLoading = useSelector(selectTradingSellIsLoading);
    const selectedQuote = useSelector(selectTradingSellSelectedQuote);
    const trade = useSelector(selectTradingSellActiveTrade);

    useTradingWatchTrade({
        account,
        trade,
    });
    const sellTrade = trade?.data || selectedQuote;

    if (!sellTrade?.exchange) return null;

    const {
        exchange,
        destinationAddress,
        destinationPaymentExtraId,
        destinationPaymentExtraIdDescription,
        status,
    } = sellTrade;
    const providerName = sellInfo?.providerInfos[exchange]?.companyName || exchange;

    const onConfirmAndSendClick = async () => {
        const result = await sendTransaction();

        analytics.report({
            type: events.tradeSellEvent.name,
            payload: {
                action: result ? 'continue' : 'cancel',
                step: 'confirm-and-send-transaction',
            },
        });
    };

    const handleSendAndConfirmClick = () => handleClick(() => onConfirmAndSendClick());

    if (status !== 'SEND_CRYPTO' || !destinationAddress) {
        return (
            <Column
                alignItems="center"
                justifyContent="center"
                margin={{ horizontal: 20, vertical: 48 }}
            >
                <Spinner size={40} isDisabled={true} margin={{ bottom: 24 }} />
                <Text>
                    <Translation
                        id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO"
                        values={{ providerName }}
                    />
                </Text>
                <Text intent="neutral" priority="secondary">
                    <Translation
                        id="TR_SELL_DETAIL_WAITING_FOR_SEND_CRYPTO_INFO"
                        values={{ providerName }}
                    />
                </Text>
            </Column>
        );
    }

    return (
        <Column margin={{ top: 12 }}>
            <Column margin={24}>
                <Text typographyStyle="body-xs" color="contentSecondary">
                    <Translation id="TR_SELL_SEND_FROM" />
                </Text>
                <Column data-testid="@trading/form/verify/account">
                    {account && (
                        <AccountLabeling
                            account={account}
                            showAccountTypeBadge
                            accountTypeBadgeSize="small"
                        />
                    )}
                </Column>
            </Column>
            <Column margin={24}>
                <Text typographyStyle="body-xs" color="contentSecondary">
                    <Translation id="TR_SELL_SEND_TO" values={{ providerName }} />
                </Text>
                <Text
                    typographyStyle="body-md"
                    color="contentPrimary"
                    data-testid="@trading/form/verify/address"
                >
                    {destinationAddress}
                </Text>
            </Column>
            {destinationPaymentExtraId && (
                <Column margin={24}>
                    <Text typographyStyle="body-xs" color="contentSecondary">
                        {destinationPaymentExtraIdDescription?.name ? (
                            <Translation
                                id="TR_SELL_EXTRA_FIELD"
                                values={{
                                    extraFieldName: destinationPaymentExtraIdDescription.name,
                                }}
                            />
                        ) : (
                            <Translation id="DESTINATION_TAG" />
                        )}
                    </Text>
                    <Text
                        typographyStyle="body-md"
                        color="contentPrimary"
                        data-testid="@trading/form/verify/extra-id"
                    >
                        {destinationPaymentExtraId}
                    </Text>
                </Column>
            )}

            <Divider margin={{ top: 24, bottom: 24 }} />
            <Column alignItems="center" margin={{ bottom: 24 }}>
                <Button
                    minWidth={200}
                    isLoading={isLoading || disabled}
                    isDisabled={
                        isLoading ||
                        !account ||
                        !device?.connected ||
                        isDiscoveryRunning ||
                        disabled
                    }
                    onClick={handleSendAndConfirmClick}
                    data-testid="@trading/offer/confirm-on-trezor-and-send"
                >
                    <Translation id="TR_SELL_CONFIRM_ON_TREZOR_SEND" />
                </Button>
            </Column>
        </Column>
    );
};
