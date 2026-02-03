import { CryptoId } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import {
    type TradingType,
    cryptoIdToNetworkSymbolAndContractAddress,
    useTradingAssets,
} from '@suite-common/trading';
import { Account, TokenAddress } from '@suite-common/wallet-types';
import { Box, Column, Row, Text } from '@trezor/components';
import { borders } from '@trezor/theme';

import { AccountLabel, Address, BaseCurrencyValue } from 'src/components/suite';
import { TradingPayGetLabelType } from 'src/types/trading/trading';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';

interface TradingInfoItemProps {
    account?: Account;
    type: TradingType;
    label: TradingPayGetLabelType;
    currency?: CryptoId;
    amount?: string;
    isReceive?: boolean;
    receiveAddress?: string;
}

export const TradingInfoItem = ({
    account,
    type,
    isReceive,
    label,
    currency,
    amount,
    receiveAddress,
}: TradingInfoItemProps) => {
    const { translationString } = useTranslation();
    const { createAssetOptionFromCryptoId } = useTradingAssets();
    const currencyInfo = currency && cryptoIdToNetworkSymbolAndContractAddress(currency);
    const accountLabelPrefix = translationString(isReceive ? 'TR_TO' : 'TR_FROM').toLowerCase();

    const showAccountLabel = !!account && type !== 'sell';
    const isExternalExchange = type === 'exchange' && !account && !!receiveAddress;

    const assetOption = createAssetOptionFromCryptoId(currency);

    if (!amount || !currency) return null;

    return (
        <Column width="100%" gap={8}>
            <Row justifyContent="space-between">
                <Text variant="tertiary" typographyStyle="hint">
                    <Translation id={label} />
                </Text>
                {(showAccountLabel || isExternalExchange) && (
                    <Text variant="tertiary" typographyStyle="hint" as="div">
                        <Row>
                            {accountLabelPrefix}&nbsp;
                            {isExternalExchange && (
                                <Address isCopyAllowed isTruncated value={receiveAddress} />
                            )}
                            {!isExternalExchange && account && (
                                <Text maxWidth={200} as="div">
                                    <AccountLabel
                                        account={account}
                                        showAccountTypeBadge
                                        accountTypeBadgeSize="small"
                                    />
                                </Text>
                            )}
                        </Row>
                    </Text>
                )}
            </Row>
            <Box
                borderWidth={borders.widths.medium}
                borderRadius={borders.radii.sm}
                padding={16}
                backgroundColor="backgroundSurfaceElevation2"
            >
                <Row gap={8} justifyContent="space-between">
                    <Row gap={8} alignItems="center">
                        <TradingCoinLogo
                            cryptoId={currency}
                            size={40}
                            showNetworkIcon={!assetOption.isNativeToken}
                        />
                        <Column alignItems="start">
                            <Text>{assetOption?.name}</Text>
                            {!assetOption.isNativeToken && assetOption.networkName && (
                                <Text variant="tertiary" typographyStyle="hint">
                                    {assetOption.networkName}
                                </Text>
                            )}
                        </Column>
                    </Row>
                    <Column alignItems="flex-end">
                        <TradingCryptoAmount amount={amount} cryptoId={currency} />

                        {currencyInfo?.symbol && (
                            <Text variant="tertiary" typographyStyle="hint">
                                <BaseCurrencyValue
                                    amount={amount}
                                    symbol={currencyInfo.symbol}
                                    rateType="current"
                                    tokenAddress={
                                        currencyInfo.contractAddress as TokenAddress | undefined
                                    }
                                    showApproximationIndicator
                                />
                            </Text>
                        )}
                    </Column>
                </Row>
            </Box>
        </Column>
    );
};
