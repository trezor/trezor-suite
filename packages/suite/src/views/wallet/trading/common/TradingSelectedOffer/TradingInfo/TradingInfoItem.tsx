import { type CryptoId } from 'invity-api';

import { AccountLabel } from '@suite/account';
import { Address } from '@suite/address';
import { Translation, useTranslation } from '@suite/intl';
import { cryptoIdToNetworkSymbolAndContractAddress, useTradingAssets } from '@suite-common/trading';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type Account, type TokenAddress } from '@suite-common/wallet-types';
import { Card, Column, Row, Skeleton, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

import { BaseCurrencyValue } from 'src/components/suite';
import { type TradingPayGetLabelType } from 'src/types/trading/trading';
import { TradingCryptoAmount } from 'src/views/wallet/trading/common/TradingCryptoAmount';

type TradingInfoItemProps = {
    account?: Account;
    label: TradingPayGetLabelType;
    currency?: CryptoId;
    amount?: string;
    isReceive?: boolean;
    receiveAddress?: string;
    cryptoAmountTestId?: string;
    accountInfoTestId?: string;
};

export const TradingInfoItem = ({
    account,
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
    const isExternalAddress = !account && !!receiveAddress;
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
                {(showAccountLabel || isExternalAddress) && (
                    <Text
                        intent="neutral"
                        priority="secondary"
                        typographyStyle="body-sm"
                        as="div"
                        data-testid={accountInfoTestId ?? `${testIdPrefix}-account`}
                    >
                        <Row>
                            {accountLabelPrefix}&nbsp;
                            {isExternalAddress && (
                                <Address isCopyAllowed isTruncated value={receiveAddress} />
                            )}
                            {!isExternalAddress && account && (
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
                <Skeleton width="100%" height={75} />
            ) : (
                <Card type="contrast" paddingType="none">
                    <Row padding={16} gap={8} justifyContent="space-between">
                        <Row gap={8} alignItems="center">
                            {isNativeToken ? (
                                <CoinLogo size={40} symbol={symbol} type="tokenWithNetwork" />
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
                </Card>
            )}
        </Column>
    );
};
