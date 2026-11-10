import type { ExchangeTrade } from 'invity-api';

import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import { cryptoIdToNetwork, useTradingUtils } from '@suite-common/trading';
import { networksCollection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled } from '@suite-common/wallet-core';
import { Card, Column, Divider } from '@trezor/components';

import { useSelector } from '../../../../../hooks/suite';
import { useTradingAssetDecimals } from '../../../../../hooks/wallet/trading/form/common/useTradingAssetDecimals';
import type { TradingExchangeProvidersInfoProps } from '../../../../../types/trading/trading';
import type { Account } from '../../../../../types/wallet';
import { TradingDetailAssetRow } from '../../common/TradingDetail/TradingDetailAssetRow';
import { TradingDetailSidebarSection } from '../../common/TradingDetail/TradingDetailSidebarSection';
import { TradingDetailTradeInfo } from '../../common/TradingDetail/TradingDetailTradeInfo';
import { TradingExchangeMevProtectionInfoItem } from '../../common/TradingSelectedOffer/TradingInfo/TradingExchangeMevProtectionInfoItem';
import { TradingExchangeMinimumReceivedInfoItem } from '../../common/TradingSelectedOffer/TradingInfo/TradingExchangeMinimumReceivedInfoItem';
import { TradingExchangeRateInfoItem } from '../../common/TradingSelectedOffer/TradingInfo/TradingExchangeRateInfoItem';
import { TradingExchangeSlippageInfoItem } from '../../common/TradingSelectedOffer/TradingInfo/TradingExchangeSlippageInfoItem';
import { TradingUtilsProviderKyc } from '../../common/TradingUtils/TradingUtilsProviderKyc';
import { formatCryptoAmountAsAmount } from '../../common/formatCryptoAmountAsAmount';

type TradingExchangeDetailSidebarProps = {
    providers?: TradingExchangeProvidersInfoProps;
    receiveAccount?: Account;
    sendAccount?: Account;
    trade: ExchangeTrade;
    date: string;
};

export const TradingExchangeDetailSidebar = ({
    providers,
    receiveAccount,
    sendAccount,
    trade,
    date,
}: TradingExchangeDetailSidebarProps) => {
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
            <Column gap={20} padding={{ vertical: 20 }}>
                <TradingDetailSidebarSection>
                    <TradingDetailAssetRow
                        account={sendAccount}
                        label="TR_TRADING_YOU_PAY"
                        currency={trade.send}
                        amount={trade.sendStringAmount}
                        cryptoAmountTestId="@trading/transaction/detail/send-amount"
                        accountInfoTestId="@trading/transaction/detail/send-account"
                    />
                </TradingDetailSidebarSection>

                <Divider margin={0} />

                <TradingDetailSidebarSection>
                    <TradingDetailAssetRow
                        account={receiveAccount}
                        label="TR_TRADING_YOU_GET"
                        currency={trade.receive}
                        amount={trade.receiveStringAmount}
                        receiveAddress={trade.receiveAddress}
                        isReceive
                        cryptoAmountTestId="@trading/transaction/detail/receive-amount"
                        accountInfoTestId="@trading/transaction/detail/receive-account"
                    />
                </TradingDetailSidebarSection>

                <Divider margin={0} />

                <TradingDetailSidebarSection>
                    <TradingDetailTradeInfo
                        date={date}
                        orderId={trade.orderId}
                        provider={provider}
                        trade={trade}
                    >
                        {trade.isDex &&
                            isMevProtectionFeatureEnabled &&
                            isMevProtectionSupported && (
                                <TradingExchangeMevProtectionInfoItem
                                    isMevProtectionEnabled={isMevProtectionEnabled}
                                    supportedNetworks={supportedMevProtectionNetworks}
                                />
                            )}

                        {trade.isDex && swapSlippage !== undefined && (
                            <TradingExchangeSlippageInfoItem slippage={swapSlippage} />
                        )}

                        {trade.isDex && !!minimumYouGetAmount && (
                            <TradingExchangeMinimumReceivedInfoItem
                                minimumYouGetAmount={minimumYouGetAmount}
                                symbol={receiveCoinSymbol}
                                contractAddress={receiveContractAddress}
                            />
                        )}

                        {!trade.isDex && <TradingExchangeRateInfoItem rateType={rateType} />}
                    </TradingDetailTradeInfo>

                    <TradingUtilsProviderKyc exchange={trade.exchange} providers={providers} />
                </TradingDetailSidebarSection>
            </Column>
        </Card>
    );
};
