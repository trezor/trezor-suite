import { type ExchangeTrade } from 'invity-api';

import { Translation } from '@suite/intl';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import {
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    type TradingExchangeType,
    cryptoIdToNetwork,
    selectTradingComposedTransactionInfo,
    selectTradingExchangeFormStep,
    useTradingUtils,
} from '@suite-common/trading';
import { networksCollection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled } from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Column, InfoItem, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BannerPoints } from 'src/components/wallet/WalletLayout/AccountBanners/BannerPoints';
import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { type TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { formatCryptoAmountAsAmount } from 'src/views/wallet/trading/common/formatCryptoAmountAsAmount';

import { TradingUtilsKyc } from '../../TradingUtils/TradingUtilsKyc';
import { TradingExchangeMevProtectionInfoItem } from '../TradingInfo/TradingExchangeMevProtectionInfoItem';
import { TradingExchangeMinimumReceivedInfoItem } from '../TradingInfo/TradingExchangeMinimumReceivedInfoItem';
import { TradingExchangeRateInfoItem } from '../TradingInfo/TradingExchangeRateInfoItem';
import { TradingExchangeSlippageInfoItem } from '../TradingInfo/TradingExchangeSlippageInfoItem';
import { TradingNetworkFeeInfoItem } from '../TradingInfo/TradingNetworkFeeInfoItem';
import { TradingProviderInfoItem } from '../TradingInfo/TradingProviderInfoItem';

type TradingOfferExchangeDetailsProps = {
    exchangeQuote: ExchangeTrade;
    exchange: string | undefined;
    providers: TradingExchangeProvidersInfoProps;
};

export const TradingOfferExchangeDetails = ({
    exchangeQuote,
    exchange,
    providers,
}: TradingOfferExchangeDetailsProps) => {
    const formStep = useSelector(selectTradingExchangeFormStep);
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);
    const composedTransactionInfo = useSelector(selectTradingComposedTransactionInfo);
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();

    const context = useTradingFormContext<TradingExchangeType>();
    const { account, exchangeInfo, getValues } = context;
    const { symbol } = account;

    const networkFee = composedTransactionInfo?.composed?.fee;
    const formattedNetworkFee = formatNetworkAmount(networkFee || '0', symbol);

    const sendCryptoSelect = getValues(TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT);
    const { getAssetDecimals } = useTradingAssetDecimals();
    const decimals = getAssetDecimals({
        accountKey: sendCryptoSelect?.accountKey,
        cryptoId: sendCryptoSelect?.id,
    });

    const supportedMevProtectionNetworks = networksCollection
        .filter(network => network.features.includes('mev-protection'))
        .map(network => network.name);
    const sendNetwork = sendCryptoSelect?.id ? cryptoIdToNetwork(sendCryptoSelect.id) : undefined;
    const isMevProtectionSupported = sendNetwork?.features.includes('mev-protection') ?? false;

    const { coinSymbol: receiveCoinSymbol, contractAddress: receiveContractAddress } =
        cryptoIdToSymbolAndContractAddress(exchangeQuote.receive);

    const provider =
        providers && exchangeQuote.exchange ? providers[exchangeQuote.exchange] : undefined;
    const providerName = exchange
        ? exchangeInfo?.providerInfos[exchange]?.companyName || exchangeQuote.exchange
        : undefined;
    const rateType = provider?.isFixedRate ? 'fixed' : 'floating';
    const dexSlippage = exchangeQuote.isDex ? exchangeQuote.swapSlippage : undefined;

    const minimumYouGetAmount = formatCryptoAmountAsAmount(
        ((100 - Number(exchangeQuote.swapSlippage)) / 100) *
            Number(exchangeQuote.receiveStringAmount),
        Number(exchangeQuote.receiveStringAmount),
        decimals,
    );

    return (
        <>
            <Column gap={spacings.xs}>
                {dexSlippage !== undefined && (
                    <>
                        <TradingExchangeSlippageInfoItem isEditable slippage={dexSlippage} />
                        <TradingExchangeMinimumReceivedInfoItem
                            minimumYouGetAmount={minimumYouGetAmount}
                            symbol={receiveCoinSymbol}
                            contractAddress={receiveContractAddress}
                        />
                    </>
                )}

                {!exchangeQuote.isDex && <TradingExchangeRateInfoItem rateType={rateType} />}

                <TradingNetworkFeeInfoItem amount={formattedNetworkFee} symbol={symbol} />

                {isMevProtectionFeatureEnabled &&
                    exchangeQuote.isDex &&
                    isMevProtectionSupported &&
                    formStep !== 'SIGN_DATA' && (
                        <TradingExchangeMevProtectionInfoItem
                            isMevProtectionEnabled={isMevProtectionEnabled}
                            supportedNetworks={supportedMevProtectionNetworks}
                        />
                    )}

                <TradingProviderInfoItem exchange={exchange} providers={providers} />

                <InfoItem label={<Translation id="TR_TRADING_EXCHANGE_TYPE" />} direction="row">
                    <Text typographyStyle="body-sm">
                        <Tooltip
                            content={
                                <Translation
                                    id={
                                        exchangeQuote.isDex
                                            ? 'TR_EXCHANGE_DECENTRALIZED_EXCHANGE'
                                            : 'TR_EXCHANGE_CENTRALIZED_EXCHANGE'
                                    }
                                />
                            }
                            hasIcon
                        >
                            <Translation
                                id={exchangeQuote.isDex ? 'TR_EXCHANGE_DEX' : 'TR_EXCHANGE_CEX'}
                            />
                        </Tooltip>
                    </Text>
                </InfoItem>
            </Column>

            <TradingUtilsKyc
                exchange={exchange}
                providers={providers as TradingExchangeProvidersInfoProps}
            />

            {formStep === 'SIGN_DATA' && (
                <Card>
                    <Text
                        typographyStyle="body-md-strong"
                        as="div"
                        margin={{ bottom: spacings.xs }}
                    >
                        <Translation
                            id="TR_TRADING_EXCHANGE_SIGN_BANNER_TITLE"
                            values={{ provider: providerName }}
                        />
                    </Text>
                    <BannerPoints
                        points={[
                            <Translation
                                id="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_1"
                                key="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_1"
                            />,
                            <Translation
                                id="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_2"
                                key="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_2"
                            />,
                            <Translation
                                id="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_3"
                                key="TR_TRADING_EXCHANGE_SIGN_BANNER_POINT_3"
                            />,
                        ]}
                    />
                </Card>
            )}
        </>
    );
};
