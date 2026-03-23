import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { convertCryptoToFiatAmount, useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type FiatRatesRootState,
    type TransactionsRootState,
    selectBaseCurrency,
    selectFiatRatesByFiatRateKey,
    selectTransactionBlockTimeById,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';
import {
    Card,
    CheckBox,
    Divider,
    HStack,
    PressableOpacity,
    Text,
    TextButton,
    VStack,
} from '@suite-native/atoms';
import { BaseCurrencyAmountFormatter, CryptoAmountFormatter } from '@suite-native/formatters';
import { Translation } from '@suite-native/intl';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
    type TransactionDetailStackParamList,
    TransactionDetailStackRoutes,
} from '@suite-native/navigation';
import { type Utxo } from '@trezor/blockchain-link-types';
import type { StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { UtxoCoinControlLabel } from './UtxoCoinControlLabel';

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

type TransactionDetailNavigation = StackToStackCompositeNavigationProps<
    RootStackParamList,
    TransactionDetailStackRoutes.TransactionDetail,
    TransactionDetailStackParamList
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
        navigation.push(RootStackRoutes.TransactionDetailStack, {
            screen: TransactionDetailStackRoutes.TransactionDetail,
            params: {
                txid: utxo.txid,
                accountKey,
            },
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
                <PressableOpacity onPress={handleToggle}>
                    <HStack
                        paddingTop="sp16"
                        paddingHorizontal="sp12"
                        justifyContent="space-between"
                        alignItems="center"
                    >
                        <VStack flex={1}>
                            <HStack alignItems="center">
                                <CryptoAmountFormatter
                                    color="textDefault"
                                    variant="body-md-strong"
                                    value={utxo.amount}
                                    isBalance={false}
                                    symbol={symbol}
                                    isDiscreetText={false}
                                />
                                {fiatAmount && (
                                    <>
                                        <Text color="textSubdued">≈</Text>
                                        <BaseCurrencyAmountFormatter
                                            color="textSubdued"
                                            symbol={symbol}
                                            value={fiatAmount}
                                            isDiscreetText={false}
                                        />
                                    </>
                                )}
                            </HStack>

                            <UtxoCoinControlLabel
                                address={utxo.address}
                                txId={utxo.txid}
                                outputIndex={`${utxo.vout}`}
                                deviceStaticSessionId={deviceStaticSessionId}
                            />
                        </VStack>
                        <CheckBox isChecked={isSelected} onChange={handleToggle} />
                    </HStack>
                </PressableOpacity>
                <Divider />
                <HStack
                    justifyContent="space-between"
                    paddingBottom="sp12"
                    paddingHorizontal="sp12"
                >
                    {transactionBlockTime && (
                        <Text color="textSubdued" variant="body-sm">
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
