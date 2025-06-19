import { useSelector } from 'react-redux';

import { pipe } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { convertCryptoToFiatAmount, useFormatters } from '@suite-common/formatters';
import {
    FiatRatesRootState,
    TransactionsRootState,
    selectFiatRatesByFiatRateKey,
    selectLocalCurrency,
    selectTransactionBlockTimeById,
} from '@suite-common/wallet-core';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Button, Card, CheckBox, Divider, HStack, Text, VStack } from '@suite-native/atoms';
import { FiatAmountFormatter } from '@suite-native/formatters';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Utxo } from '@trezor/blockchain-link-types';

export type Props = {
    utxo: Utxo;
    onToggle: (utxo: Utxo) => void;
    accountKey: string;
    isSelected?: boolean;
};

type TransactionDetailNavigation = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TransactionDetail
>;

export const UtxoCard = ({ utxo, onToggle, accountKey, isSelected = false }: Props) => {
    const { DateFormatter, CryptoAmountFormatter } = useFormatters();
    const navigation = useNavigation<TransactionDetailNavigation>();

    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, accountKey, utxo.txid),
    );

    const fiatCurrencyCode = useSelector(selectLocalCurrency);
    const fiatRateKey = getFiatRateKey('btc', fiatCurrencyCode);

    const currentRates = useSelector((state: FiatRatesRootState) =>
        selectFiatRatesByFiatRateKey(state, fiatRateKey),
    );

    const handleShowDetails = () => {
        navigation.push(RootStackRoutes.TransactionDetail, {
            txid: utxo.txid,
            accountKey,
        });
    };

    const fiatTotalActualNumeric = pipe(
        convertCryptoToFiatAmount({
            amount: utxo.amount,
            symbol: 'btc',
            rate: currentRates?.rate,
        }),
        Number,
    );

    return (
        <Card noPadding borderColor={isSelected ? 'backgroundSecondaryDefault' : 'transparent'}>
            <VStack>
                <HStack
                    paddingTop="sp16"
                    paddingHorizontal="sp12"
                    justifyContent="space-between"
                    alignItems="center"
                >
                    <VStack>
                        <HStack alignItems="center">
                            <Text variant="highlight">
                                <CryptoAmountFormatter symbol="btc" value={utxo.amount} />{' '}
                            </Text>
                            <Text color="textSubdued">≈ </Text>
                            <FiatAmountFormatter
                                color="textSubdued"
                                variant="highlight"
                                symbol="btc"
                                value={String(fiatTotalActualNumeric)}
                            />
                        </HStack>

                        <Text variant="hint">{utxo.address}</Text>
                    </VStack>
                    <CheckBox isChecked={isSelected} onChange={() => onToggle(utxo)} />
                </HStack>
                <Divider />
                <HStack
                    justifyContent="space-between"
                    paddingBottom="sp12"
                    paddingHorizontal="sp12"
                >
                    {transactionBlockTime && (
                        <Text variant="hint">
                            <DateFormatter value={transactionBlockTime} />
                        </Text>
                    )}
                    <Button colorScheme="plain" onPress={handleShowDetails} size="tiny">
                        Show details
                    </Button>
                </HStack>
            </VStack>
        </Card>
    );
};
