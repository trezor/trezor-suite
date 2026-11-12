import { useSelector } from 'react-redux';

import { type CryptoId } from 'invity-api';

import { AccountLabel } from '@suite/account';
import { Address } from '@suite/address';
import { AssetIcon, AssetName } from '@suite/assets';
import { Translation, useTranslation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import {
    type NetworksRootState,
    selectIsNativeTokenNetworkNameRedundant,
} from '@suite-common/networks';
import { cryptoIdToNetworkSymbolAndContractAddress, useTradingAssets } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { Column, Row, Skeleton, Text } from '@trezor/components';

import { BaseCurrencyValue } from '#src/components/suite';
import { type TradingPayGetLabelType } from '#src/types/trading/trading';
import { TradingCryptoAmount } from '#src/views/wallet/trading/common/TradingCryptoAmount';

type TradingDetailAssetRowProps = {
    account?: Account;
    label: TradingPayGetLabelType;
    currency?: CryptoId;
    amount?: string;
    isReceive?: boolean;
    receiveAddress?: string;
    cryptoAmountTestId?: string;
    accountInfoTestId?: string;
};

export const TradingDetailAssetRow = ({
    account,
    label,
    currency,
    amount,
    isReceive,
    receiveAddress,
    cryptoAmountTestId,
    accountInfoTestId,
}: TradingDetailAssetRowProps) => {
    const { translationString } = useTranslation();
    const { createAssetOptionFromCryptoId } = useTradingAssets();
    const currencyInfo = currency && cryptoIdToNetworkSymbolAndContractAddress(currency);
    const accountLabelPrefix = translationString(isReceive ? 'TR_TO' : 'TR_FROM').toLowerCase();

    const showAccountLabel = !!account;
    const isExternalAddress = !account && !!receiveAddress;
    const testIdPrefix = `@trading/detail/${isReceive ? 'receive' : 'send'}`;

    const { id, isNativeToken, networkSymbol, contractAddress } =
        createAssetOptionFromCryptoId(currency);

    const { NetworkNameFormatter } = useFormatters();
    const isNetworkNameRedundant = useSelector((state: NetworksRootState) =>
        selectIsNativeTokenNetworkNameRedundant(state, networkSymbol),
    );
    const tokenContract = isNativeToken ? undefined : contractAddress;
    const showNetwork = !isNativeToken || !isNetworkNameRedundant;

    if (!amount || !currency) {
        return null;
    }

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
                <Skeleton width="100%" height={40} />
            ) : (
                <Row gap={8} justifyContent="space-between">
                    <Row gap={8} alignItems="center">
                        <AssetIcon
                            size={40}
                            networkSymbol={networkSymbol}
                            contractAddress={tokenContract}
                            showNetworkIcon={showNetwork}
                        />
                        <Column alignItems="start">
                            <Text data-testid={`${testIdPrefix}-asset-name`}>
                                <AssetName
                                    networkSymbol={networkSymbol}
                                    contractAddress={tokenContract}
                                />
                            </Text>
                            {showNetwork && (
                                <Text
                                    intent="neutral"
                                    priority="secondary"
                                    typographyStyle="body-sm"
                                    data-testid={`${testIdPrefix}-network-name`}
                                >
                                    <NetworkNameFormatter value={networkSymbol} />
                                </Text>
                            )}
                        </Column>
                    </Row>
                    <Column alignItems="flex-end">
                        <Text typographyStyle="body-md-strong" as="div">
                            <TradingCryptoAmount
                                amount={amount}
                                cryptoId={currency}
                                testId={cryptoAmountTestId}
                            />
                        </Text>
                        {currencyInfo?.symbol && (
                            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                                <BaseCurrencyValue
                                    amount={amount}
                                    symbol={currencyInfo.symbol}
                                    rateType="current"
                                    tokenAddress={currencyInfo.contractAddress}
                                    showApproximationIndicator
                                />
                            </Text>
                        )}
                    </Column>
                </Row>
            )}
        </Column>
    );
};
