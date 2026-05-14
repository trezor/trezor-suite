import type { ExchangeTrade } from 'invity-api';

import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { cryptoIdToNetwork, useTradingUtils } from '@suite-common/trading';
import { networksCollection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled } from '@suite-common/wallet-core';
import { Card, Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import type { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import type { Account } from 'src/types/wallet';
import { TradingExchangeMevProtectionInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingExchangeMevProtectionInfoItem';
import { TradingExchangeMinimumReceivedInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingExchangeMinimumReceivedInfoItem';
import { TradingExchangeRateInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingExchangeRateInfoItem';
import { TradingExchangeSlippageInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingExchangeSlippageInfoItem';
import { TradingInfoItem } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingInfo/TradingInfoItem';
import { TradingUtilsKyc } from 'src/views/wallet/trading/common/TradingUtils/TradingUtilsKyc';
import { formatCryptoAmountAsAmount } from 'src/views/wallet/trading/common/formatCryptoAmountAsAmount';

type TradingDetailExchangeSidebarProps = {
    providers?: TradingExchangeProvidersInfoProps;
    receiveAccount?: Account;
    sendAccount?: Account;
    trade: ExchangeTrade;
};

export const TradingDetailExchangeSidebar = ({
    providers,
    receiveAccount,
    sendAccount,
    trade,
}: TradingDetailExchangeSidebarProps) => {
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();
    const { getAssetDecimals } = useTradingAssetDecimals();
    const sendNetwork = cryptoIdToNetwork(trade.send);
    const isMevProtectionSupported = sendNetwork?.features.includes('mev-protection') ?? false;
    const supportedMevProtectionNetworks = networksCollection
        .filter(network => network.features.includes('mev-protection'))
        .map(network => network.name);

    const provider = trade.exchange ? providers?.[trade.exchange] : undefined;
    const rateType = provider?.isFixedRate ? 'fixed' : 'floating';
    const { coinSymbol: receiveCoinSymbol, contractAddress: receiveContractAddress } =
        cryptoIdToSymbolAndContractAddress(trade.receive);
    const swapSlippage = trade.isDex ? trade.swapSlippage : undefined;
    const { receiveStringAmount } = trade;
    const decimals = getAssetDecimals({ accountKey: receiveAccount?.key, cryptoId: trade.receive });
    const minimumYouGetAmount =
        swapSlippage !== undefined && receiveStringAmount !== undefined
            ? formatCryptoAmountAsAmount(
                  ((100 - Number(swapSlippage)) / 100) * Number(receiveStringAmount),
                  Number(receiveStringAmount),
                  decimals,
              )
            : undefined;

    return (
        <Card paddingType="none" data-testid="@trading/transaction/detail/sidebar">
            <Column gap={24} padding={24}>
                <TradingInfoItem
                    account={sendAccount}
                    type="exchange"
                    label="TR_TRADING_YOU_PAY"
                    currency={trade.send}
                    amount={trade.sendStringAmount}
                    cryptoAmountTestId="@trading/transaction/detail/send-amount"
                    accountInfoTestId="@trading/transaction/detail/send-account"
                />

                <TradingInfoItem
                    account={receiveAccount}
                    type="exchange"
                    label="TR_TRADING_YOU_GET"
                    currency={trade.receive}
                    amount={trade.receiveStringAmount}
                    receiveAddress={trade.receiveAddress}
                    isReceive
                    cryptoAmountTestId="@trading/transaction/detail/receive-amount"
                    accountInfoTestId="@trading/transaction/detail/receive-account"
                />

                <Column gap={12}>
                    {trade.isDex && swapSlippage !== undefined && (
                        <TradingExchangeSlippageInfoItem slippage={swapSlippage} />
                    )}

                    {trade.isDex && minimumYouGetAmount && (
                        <TradingExchangeMinimumReceivedInfoItem
                            minimumYouGetAmount={minimumYouGetAmount}
                            symbol={receiveCoinSymbol}
                            contractAddress={receiveContractAddress}
                        />
                    )}

                    {trade.isDex && isMevProtectionFeatureEnabled && isMevProtectionSupported && (
                        <TradingExchangeMevProtectionInfoItem
                            isMevProtectionEnabled={isMevProtectionEnabled}
                            supportedNetworks={supportedMevProtectionNetworks}
                        />
                    )}

                    {!trade.isDex && <TradingExchangeRateInfoItem rateType={rateType} />}
                </Column>
                <TradingUtilsKyc exchange={trade.exchange} providers={providers} />
            </Column>
        </Card>
    );
};
