import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { convertCryptoToFiatAmount, useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import {
    FiatRatesRootState,
    TransactionsRootState,
    selectFiatRatesByFiatRateKey,
    selectLocalCurrency,
    selectTransactionBlockTimeById,
} from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import { Card, CheckBox, Divider, HStack, Text, TextButton, VStack } from '@suite-native/atoms';
import {
    AccountAddressFormatter,
    CryptoAmountFormatter,
    FiatAmountFormatter,
} from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { Utxo } from '@trezor/blockchain-link-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const AccountAddressFormatterStyle = prepareNativeStyle(() => ({
    maxWidth: '80%',
}));

export type Props = {
    utxo: Utxo;
    onToggle: (utxo: Utxo) => void;
    accountKey: AccountKey;
    symbol: NetworkSymbol;
    isSelected?: boolean;
};

type TransactionDetailNavigation = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TransactionDetail
>;

export const UtxoCard = ({ utxo, onToggle, accountKey, symbol, isSelected = false }: Props) => {
    const { DateFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();
    const navigation = useNavigation<TransactionDetailNavigation>();

    const transactionBlockTime = useSelector((state: TransactionsRootState) =>
        selectTransactionBlockTimeById(state, accountKey, utxo.txid),
    );

    const fiatCurrencyCode = useSelector(selectLocalCurrency);
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
                            <CryptoAmountFormatter
                                color="textDefault"
                                variant="highlight"
                                value={utxo.amount}
                                isBalance={false}
                                symbol={symbol}
                            />
                            <Text color="textSubdued">≈</Text>
                            <FiatAmountFormatter
                                color="textSubdued"
                                variant="highlight"
                                symbol={symbol}
                                value={fiatAmount}
                            />
                        </HStack>

                        <AccountAddressFormatter
                            style={applyStyle(AccountAddressFormatterStyle)}
                            value={utxo.address}
                            variant="hint"
                            color="textSubdued"
                        />
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
                    <TextButton variant="tertiary" onPress={handleShowDetails} size="small">
                        <Translation id="moduleSend.coinControl.utxos.showDetails" />
                    </TextButton>
                </HStack>
            </VStack>
        </Card>
    );
};
