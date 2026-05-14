import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type TextInput } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useFilteredUtxos } from '@suite-common/transaction-search';
import {
    type AccountsRootState,
    fetchUtxoTransactionsForAccountThunk,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { isSameUtxo } from '@suite-common/wallet-utils';
import { BaseSearchInput, SearchInputWithCancel, Text, VStack } from '@suite-native/atoms';
import { useTranslate } from '@suite-native/intl';
import {
    Screen,
    type SendStackParamList,
    type SendStackRoutes,
    type StackProps,
} from '@suite-native/navigation';
import { type Utxo } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import { SendUtxoScreenFooter } from '../components/CoinControl/SendUtxoScreenFooter';
import { SendUtxoScreenHeader } from '../components/CoinControl/SendUtxoScreenHeader';
import { UtxoList } from '../components/CoinControl/UtxoList';
import { useUtxoSelection } from '../hooks/useUtxoSelection';

export const SendUtxoScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendUtxo>) => {
    const { accountKey, amount } = params;
    const dispatch = useDispatch();

    const { translate } = useTranslate();
    const navigation = useNavigation();

    const searchInputRef = useRef<TextInput>(null);

    const { selectedUtxos, setSelectedUtxos } = useUtxoSelection(accountKey);
    const [searchQuery, setSearchQuery] = useState<string>('');

    const [tempSelectedUtxos, setTempSelectedUtxos] = useState<Utxo[]>(selectedUtxos ?? []);

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const filteredUtxos = useFilteredUtxos(account?.utxo ?? [], searchQuery);

    // we need to fetch all transactions for the account to have the additional UTXOs data available
    useEffect(() => {
        const promise = dispatch(
            fetchUtxoTransactionsForAccountThunk({
                accountKey,
            }),
        );

        return () => {
            promise.abort();
        };
    }, [accountKey, dispatch]);

    const handleUtxoSelect = (utxo: Utxo) => {
        const exists = tempSelectedUtxos.some(selected => isSameUtxo(selected, utxo));
        if (exists) {
            setTempSelectedUtxos(
                tempSelectedUtxos.filter(
                    selected => !(isSameUtxo(selected, utxo) ? selected : null),
                ),
            );
        } else {
            setTempSelectedUtxos([...tempSelectedUtxos, utxo]);
        }
    };

    const totalTempSelectedUtxos = useMemo(
        () =>
            tempSelectedUtxos
                .reduce((total, utxo) => BigNumber(utxo.amount).plus(total), BigNumber(0))
                .toString(),
        [tempSelectedUtxos],
    );

    const onSelectionSubmit = () => {
        setSelectedUtxos(
            account?.utxo?.filter(u =>
                tempSelectedUtxos.some(tempUtxo => isSameUtxo(u, tempUtxo)),
            ) ?? [],
        );
        setTempSelectedUtxos([]);
        navigation.goBack();
    };

    const onSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
    }, []);
    if (account === null) return null;

    return (
        <Screen
            isScrollable={false}
            header={
                <SendUtxoScreenHeader
                    accountKey={accountKey}
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
            <VStack flex={1} spacing="sp24">
                <SearchInputWithCancel
                    onChange={onSearchChange}
                    placeholder={translate('moduleSend.coinControl.search.placeholder')}
                    SearchComponent={BaseSearchInput}
                    value={searchQuery}
                    searchRef={searchInputRef}
                />

                {filteredUtxos.length > 0 ? (
                    <UtxoList
                        deviceStaticSessionId={account.deviceState}
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
                            <Text variant="body-sm">
                                {translate('moduleSend.coinControl.search.message')}
                            </Text>
                        </VStack>
                    </VStack>
                )}
            </VStack>
        </Screen>
    );
};
