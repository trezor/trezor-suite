import { useState } from 'react';
import { FormattedList } from 'react-intl';

import { ExchangeTrade } from 'invity-api';

import { selectIsMevProtectionFeatureEnabled } from '@suite-common/mev';
import {
    TRADING_FORM_SEND_CRYPTO_CURRENCY_SELECT,
    TradingExchangeType,
    cryptoIdToNetwork,
    selectTradingComposedTransactionInfo,
    selectTradingExchangeFormStep,
    useTradingUtils,
} from '@suite-common/trading';
import { networksCollection } from '@suite-common/wallet-config';
import { selectIsMevProtectionEnabled } from '@suite-common/wallet-core';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Card, Column, Icon, InfoItem, Row, Text, Tooltip } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { Translation } from 'src/components/suite/Translation';
import { BannerPoints } from 'src/components/wallet/WalletLayout/AccountBanners/BannerPoints';
import { useSelector } from 'src/hooks/suite';
import { useTradingAssetDecimals } from 'src/hooks/wallet/trading/form/common/useTradingAssetDecimals';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { TradingExchangeProvidersInfoProps } from 'src/types/trading/trading';

import { TradingOfferExchangeSlippageModal } from './TradingOfferExchangeSlippageModal';
import { TradingProviderInfo } from '../../TradingProviderInfo';
import { TradingUtilsKyc } from '../../TradingUtils/TradingUtilsKyc';

const formatCryptoAmountAsAmount = (amount: number, baseAmount: number, decimals = 8): string => {
    let digits = 4;
    if (baseAmount < 1) {
        digits = 6;
    }
    if (baseAmount < 0.01) {
        digits = decimals;
    }

    return amount.toFixed(digits);
};

interface TradingOfferExchangeDetailsProps {
    exchangeQuote: ExchangeTrade;
    exchange: string | undefined;
    providers: TradingExchangeProvidersInfoProps;
}

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

    const [isSlippageModalOpen, setIsSlippageModalOpen] = useState(false);

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

    const minimumYouGetAmount = formatCryptoAmountAsAmount(
        ((100 - Number(exchangeQuote.swapSlippage)) / 100) *
            Number(exchangeQuote.receiveStringAmount),
        Number(exchangeQuote.receiveStringAmount),
        decimals,
    );

    return (
        <>
            <Column gap={spacings.xs}>
                {exchangeQuote.isDex && exchangeQuote.swapSlippage && (
                    <InfoItem
                        label={
                            <Tooltip
                                content={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_INFO" />}
                                hasIcon
                            >
                                <Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_AMOUNT" />
                            </Tooltip>
                        }
                        direction="row"
                    >
                        <Row
                            gap={spacings.xxs}
                            alignItems="center"
                            cursor="pointer"
                            onClick={() => setIsSlippageModalOpen(true)}
                        >
                            <Text variant="primary" typographyStyle="hint">
                                {exchangeQuote.swapSlippage}%
                            </Text>

                            <Icon name="pencilSimple" size="medium" variant="primary" />
                        </Row>
                    </InfoItem>
                )}

                {exchangeQuote.isDex && exchangeQuote.swapSlippage && (
                    <InfoItem
                        label={<Translation id="TR_EXCHANGE_SWAP_SLIPPAGE_MINIMUM" />}
                        direction="row"
                    >
                        <Text typographyStyle="hint">
                            <FormattedCryptoAmount
                                value={minimumYouGetAmount}
                                symbol={receiveCoinSymbol}
                                contractAddress={receiveContractAddress}
                            />
                        </Text>
                    </InfoItem>
                )}

                {!exchangeQuote.isDex && (
                    <InfoItem label={<Translation id="TR_TRADING_RATE" />} direction="row">
                        {rateType === 'fixed' && (
                            <Tooltip
                                content={<Translation id="TR_EXCHANGE_FIXED_OFFERS_INFO" />}
                                hasIcon
                            >
                                <Translation id="TR_EXCHANGE_FIXED" />
                            </Tooltip>
                        )}
                        {rateType === 'floating' && (
                            <Tooltip
                                content={<Translation id="TR_EXCHANGE_FLOAT_OFFERS_INFO" />}
                                hasIcon
                            >
                                <Translation id="TR_EXCHANGE_FLOAT" />
                            </Tooltip>
                        )}
                    </InfoItem>
                )}

                <InfoItem label={<Translation id="TR_TRADING_NETWORK_FEE" />} direction="row">
                    <Text typographyStyle="hint">
                        <BaseCurrencyValue
                            disableHiddenPlaceholder
                            amount={formattedNetworkFee}
                            symbol={symbol}
                            rateType="current"
                            showApproximationIndicator
                        />
                    </Text>
                </InfoItem>

                {isMevProtectionFeatureEnabled &&
                    exchangeQuote.isDex &&
                    isMevProtectionSupported &&
                    formStep !== 'SIGN_DATA' && (
                        <InfoItem
                            label={
                                <Tooltip
                                    content={
                                        <>
                                            <Translation id="TR_MEV_DESCRIPTION" />{' '}
                                            <Translation
                                                id="TR_MEV_AVAILABLE_ON"
                                                values={{
                                                    supportedNetworks: (
                                                        <FormattedList
                                                            type="conjunction"
                                                            value={supportedMevProtectionNetworks}
                                                        />
                                                    ),
                                                }}
                                            />
                                        </>
                                    }
                                    hasIcon
                                >
                                    <Translation id="TR_MEV" />
                                </Tooltip>
                            }
                            direction="row"
                        >
                            <Icon
                                name={isMevProtectionEnabled ? 'check' : 'x'}
                                size="medium"
                                variant={isMevProtectionEnabled ? 'primary' : 'tertiary'}
                            />
                        </InfoItem>
                    )}

                <InfoItem label={<Translation id="TR_BUY_PROVIDER" />} direction="row">
                    <TradingProviderInfo exchange={exchange} providers={providers} />
                </InfoItem>

                <InfoItem label={<Translation id="TR_TRADING_EXCHANGE_TYPE" />} direction="row">
                    <Text typographyStyle="hint">
                        {exchangeQuote.isDex ? (
                            <Tooltip
                                content={<Translation id="TR_EXCHANGE_DECENTRALIZED_EXCHANGE" />}
                                hasIcon
                            >
                                <Translation id="TR_EXCHANGE_DEX" />
                            </Tooltip>
                        ) : (
                            <Tooltip
                                content={<Translation id="TR_EXCHANGE_CENTRALIZED_EXCHANGE" />}
                                hasIcon
                            >
                                <Translation id="TR_EXCHANGE_CEX" />
                            </Tooltip>
                        )}
                    </Text>
                </InfoItem>
            </Column>

            <TradingUtilsKyc
                exchange={exchange}
                providers={providers as TradingExchangeProvidersInfoProps}
            />

            {formStep === 'SIGN_DATA' && (
                <Card>
                    <Text typographyStyle="highlight" as="div" margin={{ bottom: spacings.xs }}>
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

            {isSlippageModalOpen && (
                <TradingOfferExchangeSlippageModal onClose={() => setIsSlippageModalOpen(false)} />
            )}
        </>
    );
};
