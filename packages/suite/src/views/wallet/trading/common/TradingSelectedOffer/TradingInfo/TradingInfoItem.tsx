import { type CryptoId } from 'invity-api';

import { Translation, useTranslation } from '@suite/intl';
import {
    type TradingType,
    cryptoIdToNetworkSymbolAndContractAddress,
    useTradingAssets,
} from '@suite-common/trading';
import { type NetworkSymbol, getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { Box, Column, Row, SkeletonRectangle, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';
import { borders } from '@trezor/theme';

import { AccountLabel, Address, BaseCurrencyValue } from 'src/components/suite';
import { type TradingPayGetLabelType } from 'src/types/trading/trading';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';

interface TradingInfoItemProps {
    account?: Account;
    type: TradingType;
    label: TradingPayGetLabelType;
    currency?: CryptoId;
    amount?: string;
    isReceive?: boolean;
    receiveAddress?: string;
    cryptoAmountTestId?: string;
    accountInfoTestId?: string;
}

export const TradingInfoItem = ({
    account,
    type,
    isReceive,
    label,
    currency,
    amount,
    receiveAddress,
    cryptoAmountTestId,
    accountInfoTestId,
}: TradingInfoItemProps) => {
    const { translationString } = useTranslation();
    const { createAssetOptionFromCryptoId } = useTradingAssets();
    const currencyInfo = currency && cryptoIdToNetworkSymbolAndContractAddress(currency);
    const accountLabelPrefix = translationString(isReceive ? 'TR_TO' : 'TR_FROM').toLowerCase();

    const showAccountLabel = !!account;
    const isExternalExchange = type === 'exchange' && !account && !!receiveAddress;
    const testIdPrefix = `@trading/detail/${isReceive ? 'receive' : 'send'}`;

    const {
        id,
        isNativeToken,
        networkSymbol,
        name,
        displaySymbol,
        networkName,
        contractAddress,
        symbol,
    } = createAssetOptionFromCryptoId(currency);

    const displayName = isNativeToken ? getNetworkDisplaySymbolName(networkSymbol) : name;

    const showNetwork = networkSymbol !== displaySymbol.toLowerCase();

    if (!amount || !currency) return null;

    return (
        <Column width="100%" gap={8} data-testid={`${testIdPrefix}-info`}>
            <Row justifyContent="space-between">
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <Translation id={label} />
                </Text>
                {(showAccountLabel || isExternalExchange) && (
                    <Text
                        intent="neutral"
                        priority="secondary"
                        typographyStyle="body-sm"
                        as="div"
                        data-testid={accountInfoTestId ?? `${testIdPrefix}-account`}
                    >
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
            {id !== currency ? (
                <SkeletonRectangle width="100%" height={75} />
            ) : (
                <Box
                    borderWidth={borders.widths.medium}
                    borderRadius={borders.radii.sm}
                    padding={16}
                    backgroundColor="legacyBackgroundSurfaceElevation2"
                >
                    <Row gap={8} justifyContent="space-between">
                        <Row gap={8} alignItems="center">
                            {isNativeToken ? (
                                <CoinLogo
                                    size={40}
                                    symbol={symbol as NetworkSymbol}
                                    type="tokenWithNetwork"
                                />
                            ) : (
                                <AssetLogo
                                    size={40}
                                    symbol={networkSymbol}
                                    contractAddress={contractAddress}
                                    placeholder={displaySymbol}
                                    showNetworkIcon={showNetwork}
                                />
                            )}
                            <Column alignItems="start">
                                <Text data-testid={`${testIdPrefix}-asset-name`}>
                                    {displayName}
                                </Text>
                                {showNetwork && (
                                    <Text
                                        intent="neutral"
                                        priority="secondary"
                                        typographyStyle="body-sm"
                                        data-testid={`${testIdPrefix}-network-name`}
                                    >
                                        {networkName}
                                    </Text>
                                )}
                            </Column>
                        </Row>
                        <Column alignItems="flex-end">
                            <TradingCryptoAmount
                                amount={amount}
                                cryptoId={currency}
                                testId={cryptoAmountTestId}
                            />

                            {currencyInfo?.symbol && (
                                <Text
                                    intent="neutral"
                                    priority="secondary"
                                    typographyStyle="body-sm"
                                >
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
            )}
        </Column>
    );
};
