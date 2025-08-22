import { useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { convertCryptoToFiatAmount, useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FiatRatesRootState,
    TransactionsRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectTransactionBlockTimeById,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Card, CheckBox, Divider, HStack, Text, TextButton, VStack } from '@suite-native/atoms';
import {
    AccountAddressFormatter,
    BaseCurrencyAmountFormatter,
    CryptoAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import { AddressLabel, TransactionOutputLabel } from '@suite-native/labeling';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Utxo } from '@trezor/blockchain-link-types';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const accountAddressFormatterStyle = prepareNativeStyle(() => ({
    maxWidth: '80%',
}));

const cardStyle = prepareNativeStyle(utils => ({
    borderWidth: utils.borders.widths.large,
}));

export type Props = {
    utxo: Utxo;
    deviceStaticSessionId: StaticSessionId;
    onToggle: (utxo: Utxo) => void;
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    isSelected?: boolean;
};

type TransactionDetailNavigation = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TransactionDetail
>;

export const UtxoCard = ({
    utxo,
    onToggle,
    deviceStaticSessionId,
    accountKey,
    symbol,
    isSelected = false,
}: Props) => {
    const { DateFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<TransactionDetailNavigation>();

    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, accountKey, utxo.txid),
    );

    const fiatCurrencyCode = useSelector(selectBaseCurrency);
    const fiatRateKey = getFiatRateKey(symbol, fiatCurrencyCode);

    const currentRates = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const handleShowDetails = () => {
        navigation.push(RootStackRoutes.TransactionDetail, {
            txid: utxo.txid,
            accountKey,
        });
    };

    const fiatAmount = convertCryptoToFiatAmount({
        amount: utxo.amount,
        symbol,
        rate: currentRates?.rate,
    });

    const handleToggle = useCallback(() => {
        onToggle(utxo);
    }, [onToggle, utxo]);

    return (
        <Card
            noPadding
            borderColor={isSelected ? 'backgroundSecondaryDefault' : 'transparent'}
            style={applyStyle(cardStyle)}
        >
            <VStack spacing="sp12">
                <TouchableOpacity onPress={handleToggle}>
                    <HStack
                        paddingTop="sp16"
                        paddingHorizontal="sp12"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <VStack>
                            <HStack alignItems="center">
                                <CryptoAmountFormatter
                                    color="textDefault"
                                    variant="highlight"
                                    value={utxo.amount}
                                    isBalance={false}
                                    symbol={symbol}
                                />
                                {fiatAmount && (
                                    <>
                                        <Text color="textSubdued">≈</Text>
                                        <BaseCurrencyAmountFormatter
                                            color="textSubdued"
                                            symbol={symbol}
                                            value={fiatAmount}
                                        />
                                    </>
                                )}
                            </HStack>

                            <HStack>
                                <AddressLabel
                                    address={utxo.address}
                                    deviceStaticSessionId={deviceStaticSessionId}
                                    fallback={
                                        <AccountAddressFormatter
                                            style={applyStyle(accountAddressFormatterStyle)}
                                            value={utxo.address}
                                            variant="hint"
                                            color="textSubdued"
                                        />
                                    }
                                />
                                <TransactionOutputLabel
                                    txId={utxo.txid}
                                    outputIndex={utxo.vout}
                                    deviceStaticSessionId={deviceStaticSessionId}
                                />
                            </HStack>
                        </VStack>
                        <CheckBox isChecked={isSelected} onChange={handleToggle} />
                    </HStack>
                </TouchableOpacity>
                <Divider />
                <HStack
                    justifyContent="space-between"
                    paddingBottom="sp12"
                    paddingHorizontal="sp12"
                >
                    {transactionBlockTime && (
                        <Text color="textSubdued" variant="hint">
                            <DateFormatter value={transactionBlockTime} />
                        </Text>
                    )}
                    <TextButton variant="primary" onPress={handleShowDetails} isBold size="small">
                        <Translation id="moduleSend.coinControl.utxos.showDetails" />
                    </TextButton>
                </HStack>
            </VStack>
        </Card>
    );
};
