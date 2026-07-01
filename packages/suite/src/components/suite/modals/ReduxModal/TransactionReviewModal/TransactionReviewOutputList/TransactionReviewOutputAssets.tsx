import { type ReactNode } from 'react';

import { type CryptoId } from 'invity-api';

import { Address } from '@suite/address';
import { Translation } from '@suite/intl';
import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getCoingeckoId, getNetwork } from '@suite-common/wallet-config';
import {
    type FormStateTradingCryptoCurrency,
    type FormStateTradingFiatCurrency,
    type TokenAddress,
} from '@suite-common/wallet-types';
import { localizeNumber } from '@suite-common/wallet-utils';
import { Card, Column, Divider, H4, InfoItem, Row, Text } from '@trezor/components';
import {
    AssetLogo,
    CoinLogo,
    isCoinSymbol,
    shouldShowNetworkIcon,
} from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { TransactionReviewOutputStatus } from 'src/components/suite/modals/ReduxModal/TransactionReviewModal/TransactionReviewOutputList/TransactionReviewOutputStatus';
import { useSelector } from 'src/hooks/suite';

export type TransactionReviewOutputAssetsProps = {
    title: ReactNode;
    state: 'active' | 'confirmed' | 'unconfirmed';
    send: FormStateTradingCryptoCurrency;
    receive?: FormStateTradingCryptoCurrency | FormStateTradingFiatCurrency;
    receiveAddress?: string;
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
    const formattedAmount = localizeNumber(amount, 'en-US');

    const cryptoId = contractAddress
        ? toTokenCryptoId(symbol, contractAddress)
        : (getCoingeckoId(symbol) as CryptoId);
    const displaySymbol = useSelector(state =>
        contractAddress
            ? selectTradingCoinSymbolByCryptoId(state, cryptoId)
            : network.displaySymbol,
    );

    const renderAssetLogo = () => {
        if (contractAddress) {
            return (
                <AssetLogo
                    size={24}
                    symbol={symbol}
                    contractAddress={contractAddress}
                    placeholder={displaySymbol ?? ''}
                    showNetworkIcon={shouldShowNetworkIcon(symbol, contractAddress)}
                />
            );
        }

        if (isCoinSymbol(symbol)) {
            return <CoinLogo size={24} symbol={symbol} type="tokenWithNetwork" />;
        }

        return null;
    };

    return (
        <InfoItem
            label={
                <Row alignItems="center" gap={12} margin={{ left: 32 }}>
                    {renderAssetLogo()}
                    <Text
                        intent={type === 'receive' ? 'brand' : 'critical'}
                        data-testid={`@modal/assets/${type}/crypto`}
                    >
                        {type === 'receive' ? ' + ' : ' - '}
                        {formattedAmount} {displaySymbol}
                    </Text>
                </Row>
            }
            direction="row"
            verticalAlignment="center"
            data-testid={`@modal/assets/${type}`}
        >
            <Text
                intent="neutral"
                priority="secondary"
                typographyStyle="body-sm"
                data-testid={`@modal/assets/${type}/fiat`}
            >
                &asymp;{' '}
                <BaseCurrencyValue
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
                        intent="brand"
                        data-testid="@modal/assets/receive/label"
                    >
                        + {localizeNumber(receive.amount, 'en-US')} {receive.fiatCurrency}
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
    receiveAddress,
    state,
}: TransactionReviewOutputAssetsProps) => (
    <>
        <Card
            paddingType="none"
            type={state === 'confirmed' ? 'contrast' : 'raised'}
            header={
                <Row gap={12} padding={12}>
                    <TransactionReviewOutputStatus state={state} />
                    <H4
                        margin={{ left: 4 }}
                        typographyStyle={state !== 'unconfirmed' ? 'body-sm-strong' : 'body-sm'}
                    >
                        {title}
                    </H4>
                </Row>
            }
        >
            <Column>
                <Column padding={12}>
                    <TransactionReviewOutputAssetsCryptoCurrency
                        cryptoCurrency={send}
                        type="send"
                    />
                </Column>
                {receive && (
                    <>
                        <Divider margin={{}} />
                        <Column padding={12}>
                            <TransactionReviewOutputAssetsTo receive={receive} />
                        </Column>
                    </>
                )}
                {receiveAddress && (
                    <>
                        <Divider margin={{}} />
                        <Column padding={12}>
                            <InfoItem
                                label={
                                    <Text intent="neutral" padding={{ left: 32 }}>
                                        <Translation id="TR_RECIPIENT" />
                                    </Text>
                                }
                                direction="row"
                                verticalAlignment="start"
                            >
                                <Address
                                    typographyStyle="body-sm"
                                    value={receiveAddress}
                                    isChunked={false}
                                    isDeviceRendered
                                />
                            </InfoItem>
                        </Column>
                    </>
                )}
            </Column>
        </Card>
    </>
);
