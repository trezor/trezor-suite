import { useCallback, useMemo, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { useFilteredUtxos } from '@suite-common/wallet-utils';
import { BaseSearchInput, SearchInputWithCancel, Text, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import { Screen, SendStackParamList, SendStackRoutes, StackProps } from '@suite-native/navigation';
import { Utxo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { SendUtxoScreenFooter } from '../components/CoinControl/SendUtxoScreenFooter';
import { SendUtxoScreenHeader } from '../components/CoinControl/SendUtxoScreenHeader';
import { UtxoList } from '../components/CoinControl/UtxoList';
import { useUtxoSelection } from '../hooks/useUtxoSelection';

export const SendUtxoScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendUtxo>) => {
    const { accountKey, amount } = params;

    const { translate } = useTranslate();
    const navigation = useNavigation();

    const searchInputRef = useRef<TextInput>(null);

    const { selectedUtxos, setSelectedUtxos } = useUtxoSelection();
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [tempSelectedUtxos, setTempSelectedUtxos] = useState<Utxo[]>(selectedUtxos ?? []);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const filteredUtxos = useFilteredUtxos(account?.utxo ?? [], searchQuery);

    const handleUtxoSelect = (utxo: Utxo) =>
        tempSelectedUtxos.includes(utxo)
            ? setTempSelectedUtxos(tempSelectedUtxos.filter(txid => txid !== utxo))
            : setTempSelectedUtxos([...tempSelectedUtxos, utxo]);

    const totalTempSelectedUtxos = useMemo(
        () =>
            tempSelectedUtxos
                .reduce((total, utxo) => BigNumber(utxo.amount).plus(total), BigNumber(0))
                .toString(),
        [tempSelectedUtxos],
    );

    const onSelectionSubmit = () => {
        setSelectedUtxos(account?.utxo?.filter(u => tempSelectedUtxos.includes(u)) ?? []);
        setTempSelectedUtxos([]);
        navigation.goBack();
    };

    const onSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);
    if (!account) return null;

    return (
        <Screen
            isScrollable={false}
            header={
                <SendUtxoScreenHeader
                    onDelete={() => {
                        navigation.goBack();
                    }}
                />
            }
            footer={
                <SendUtxoScreenFooter
                    amount={amount}
                    onSubmit={onSelectionSubmit}
                    selectedTotal={totalTempSelectedUtxos}
                    symbol={account.symbol}
                />
            }
            noBottomPadding
        >
            <VStack flex={1}>
                <SearchInputWithCancel
                    onChange={onSearchChange}
                    placeholder={translate('moduleSend.coinControl.search.placeholder')}
                    SearchComponent={BaseSearchInput}
                    value={searchQuery}
                    searchRef={searchInputRef}
                />

                {filteredUtxos.length > 0 ? (
                    <UtxoList
                        utxos={filteredUtxos}
                        selectedUtxos={tempSelectedUtxos}
                        onUtxoToggle={handleUtxoSelect}
                        accountKey={accountKey}
                        symbol={account.symbol}
                    />
                ) : (
                    <VStack alignContent="center" spacing="sp8" justifyContent="center" flex={1}>
                        <VStack alignItems="center" spacing="sp12" justifyContent="center">
                            <Text>{translate('moduleSend.coinControl.search.noCoins')}</Text>
                            <Text variant="hint">
                                {translate('moduleSend.coinControl.search.message')}
                            </Text>
                        </VStack>
                    </VStack>
                )}
            </VStack>
        </Screen>
    );
};
