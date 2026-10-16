import { type ExchangeTrade } from 'invity-api';

import { ExperimentId, ExperimentWrapper } from '@suite-common/message-system';
import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import {
    cryptoIdToNetwork,
    selectTradingDisplayComposedFee,
    selectTradingExchangeFormStep,
    selectTradingExchangeInfo,
    selectTradingExchangeReceiveAccountKey,
    useTradingUtils,
} from '@suite-common/trading';
import { networksCollection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Translation } from '@suite-lego/intl';
import { Card, Column, InfoItem, Text, Tooltip } from '@trezor/components';

import { BannerPoints } from 'src/components/wallet/WalletLayout/AccountBanners/BannerPoints';
import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { type TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';
import { formatCryptoAmountAsAmount } from 'src/views/wallet/trading/common/formatCryptoAmountAsAmount';

import { TradingUtilsProviderKyc } from '../../TradingUtils/TradingUtilsProviderKyc';
import { TradingComposedNetworkFeeInfoItem } from '../TradingInfo/TradingComposedNetworkFeeInfoItem';
import { TradingExchangeMevProtectionInfoItem } from '../TradingInfo/TradingExchangeMevProtectionInfoItem';
import { TradingExchangeMinimumReceivedInfoItem } from '../TradingInfo/TradingExchangeMinimumReceivedInfoItem';
import { TradingExchangeRateInfoItem } from '../TradingInfo/TradingExchangeRateInfoItem';
import { TradingExchangeSlippageInfoItem } from '../TradingInfo/TradingExchangeSlippageInfoItem';
import { type TradingNetworkFeeInfoItemProps } from '../TradingInfo/TradingNetworkFeeInfoItem';
import { TradingProviderInfoItem } from '../TradingInfo/TradingProviderInfoItem';
import { TradingTrezorFeeInfoItem } from '../TradingInfo/TradingTrezorFeeInfoItem';

type TradingOfferExchangeDetailsProps = {
    account: Account;
    exchangeQuote: ExchangeTrade;
    exchange: string | undefined;
    providers: TradingExchangeProvidersInfoProps;
    networkFeeEdit?: TradingNetworkFeeInfoItemProps['edit'];
};

export const TradingOfferExchangeDetails = ({
    account,
    exchangeQuote,
    exchange,
    providers,
    networkFeeEdit,
}: TradingOfferExchangeDetailsProps) => {
    const formStep = useSelector(selectTradingExchangeFormStep);
    const exchangeInfo = useSelector(selectTradingExchangeInfo);
    const isMevProtectionEnabled = useSelector(selectIsMevProtectionEnabled);
    const isMevProtectionFeatureEnabled = useSelector(selectIsMevProtectionFeatureEnabled);
    const networkFee = useSelector(state => selectTradingDisplayComposedFee(state, exchangeQuote));
    const { cryptoIdToSymbolAndContractAddress } = useTradingUtils();

    const receiveAccountKey = useSelector(selectTradingExchangeReceiveAccountKey);
    const { getAssetDecimals } = useTradingAssetDecimals();
    const decimals = getAssetDecimals({
        accountKey: receiveAccountKey,
        cryptoId: exchangeQuote.receive,
    });

    const supportedMevProtectionNetworks = networksCollection
        .filter(network => network.features.includes('mev-protection'))
        .map(network => network.name);
    const sendNetwork = exchangeQuote.send ? cryptoIdToNetwork(exchangeQuote.send) : undefined;
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
            <Column gap={8}>
                <ExperimentWrapper
                    id={ExperimentId.tradingShowTradeFee}
                    components={[
                        { variant: 'control', element: <></> },
                        { variant: 'treatment', element: <TradingTrezorFeeInfoItem /> },
                    ]}
                />

                {dexSlippage !== undefined && (
                    <>
                        <TradingExchangeSlippageInfoItem
                            isEditable
                            slippage={dexSlippage}
                            selectedQuote={exchangeQuote}
                        />
                        <TradingExchangeMinimumReceivedInfoItem
                            minimumYouGetAmount={minimumYouGetAmount}
                            symbol={receiveCoinSymbol}
                            contractAddress={receiveContractAddress}
                        />
                    </>
                )}

                {!exchangeQuote.isDex && <TradingExchangeRateInfoItem rateType={rateType} />}

                <TradingComposedNetworkFeeInfoItem
                    account={account}
                    fee={networkFee}
                    edit={networkFeeEdit}
                />

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
                    <Text
                        typographyStyle="body-sm"
                        data-testid="@trading/offer/info/exchange-dex-type"
                    >
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
                <TradingUtilsProviderKyc exchange={exchange} providers={providers} />
            </Column>

            {formStep === 'SIGN_DATA' && (
                <Card>
                    <Text typographyStyle="body-md-strong" as="div" margin={{ bottom: 8 }}>
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
