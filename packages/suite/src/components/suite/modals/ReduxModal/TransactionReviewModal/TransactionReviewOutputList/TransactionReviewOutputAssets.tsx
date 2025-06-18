import { ReactNode } from 'react';

import { CryptoId } from 'invity-api';

import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getCoingeckoId, getNetwork } from '@suite-common/wallet-config';
import {
    FormStateTradingCryptoCurrency,
    FormStateTradingFiatCurrency,
    TokenAddress,
} from '@suite-common/wallet-types';
import { AssetLogo, Card, Column, Divider, H4, InfoItem, Row, Text } from '@trezor/components';
import { mapPaddingTypeToPadding } from '@trezor/components/src/components/Card/utils';
import { CoinLogo } from '@trezor/product-components';
import { isCoinSymbol } from '@trezor/product-components/src/components/CoinLogo/coins';
import { spacings } from '@trezor/theme';

import { FiatValue } from 'src/components/suite/FiatValue';
import { TransactionReviewOutputStatus } from 'src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputStatus';
import { useSelector } from 'src/hooks/suite';

export type TransactionReviewOutputAssetsProps = {
    title: ReactNode;
    state: 'active' | 'confirmed' | 'unconfirmed';
    send: FormStateTradingCryptoCurrency;
    receive: FormStateTradingCryptoCurrency | FormStateTradingFiatCurrency;
};

type TransactionReviewOutputAssetsCryptoCurrencyProps = {
    type: 'send' | 'receive';
    cryptoCurrency: FormStateTradingCryptoCurrency;
};

type TransactionReviewOutputAssetsToProps = {
    receive: FormStateTradingCryptoCurrency | FormStateTradingFiatCurrency;
};

const TransactionReviewOutputAssetsCryptoCurrency = ({
    cryptoCurrency,
    type,
}: TransactionReviewOutputAssetsCryptoCurrencyProps) => {
    const { symbol, contractAddress, amount } = cryptoCurrency;
    const network = getNetwork(symbol);
    const isTokenAmount = !!cryptoCurrency.contractAddress;

    const cryptoId = contractAddress
        ? toTokenCryptoId(symbol, contractAddress)
        : (getCoingeckoId(symbol) as CryptoId);
    const displaySymbol = useSelector(state => selectTradingCoinSymbolByCryptoId(state, cryptoId));

    const getCoinLogo = () =>
        isCoinSymbol(symbol) ? (
            <CoinLogo size={20} symbol={symbol} type="tokenWithNetwork" />
        ) : null;

    return (
        <InfoItem
            label={
                <Row alignItems="center" gap={spacings.sm}>
                    {network.coingeckoId ? (
                        <AssetLogo
                            size={20}
                            coingeckoId={network.coingeckoId}
                            contractAddress={
                                symbol && contractAddress ? contractAddress : undefined
                            }
                            placeholder={displaySymbol ?? ''}
                        />
                    ) : (
                        getCoinLogo()
                    )}
                    <Text
                        variant={type === 'receive' ? 'primary' : 'destructive'}
                        data-testid={`@modal/assets/${type}/crypto`}
                    >
                        {type === 'receive' ? ' + ' : ' - '}
                        {amount} {displaySymbol}
                    </Text>
                </Row>
            }
            direction="row"
            verticalAlignment="center"
            data-testid={`@modal/assets/${type}`}
        >
            <Text
                variant="tertiary"
                typographyStyle="hint"
                data-testid={`@modal/assets/${type}/fiat`}
            >
                &asymp;{' '}
                <FiatValue
                    amount={amount}
                    symbol={symbol}
                    tokenAddress={isTokenAmount ? (contractAddress as TokenAddress) : undefined}
                    disableHiddenPlaceholder
                />
            </Text>
        </InfoItem>
    );
};

const TransactionReviewOutputAssetsTo = ({ receive }: TransactionReviewOutputAssetsToProps) => {
    if ('fiatCurrency' in receive) {
        return (
            <InfoItem
                label={
                    <Text
                        margin={{ left: spacings.xxl }}
                        variant="primary"
                        data-testid="@modal/assets/receive/label"
                    >
                        + {receive.amount} {receive.fiatCurrency}
                    </Text>
                }
                data-testid="@modal/assets/receive"
                direction="row"
                verticalAlignment="start"
            />
        );
    }

    return <TransactionReviewOutputAssetsCryptoCurrency cryptoCurrency={receive} type="receive" />;
};

export const TransactionReviewOutputAssets = ({
    title,
    send,
    receive,
    state,
}: TransactionReviewOutputAssetsProps) => (
    <Card
        paddingType="none"
        fillType={state === 'confirmed' ? 'flat' : 'default'}
        header={
            <Row gap={spacings.sm} padding={mapPaddingTypeToPadding({ paddingType: 'small' })}>
                <TransactionReviewOutputStatus state={state} />
                <H4
                    margin={{ left: spacings.xxs }}
                    typographyStyle={state !== 'unconfirmed' ? 'callout' : 'hint'}
                >
                    {title}
                </H4>
            </Row>
        }
    >
        <Column>
            <Column padding={mapPaddingTypeToPadding({ paddingType: 'small' })}>
                <TransactionReviewOutputAssetsCryptoCurrency cryptoCurrency={send} type="send" />
            </Column>
            <Divider margin={{}} />
            <Column padding={mapPaddingTypeToPadding({ paddingType: 'small' })}>
                <TransactionReviewOutputAssetsTo receive={receive} />
            </Column>
        </Column>
    </Card>
);
