import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Box } from '@suite-native/atoms';
import { Utxo } from '@trezor/blockchain-link-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { UtxoCard } from './UtxoCard';

const UtxoListStyle = prepareNativeStyle(utils => ({ paddingBottom: utils.spacings.sp16 }));

const spacerStyle = prepareNativeStyle(utils => ({
    height: utils.spacings.sp16,
}));

type UtxoListProps = {
    accountKey: string;
    utxos: Utxo[];
    selectedUtxos: Utxo[];
    onUtxoToggle: (utxo: Utxo) => void;
    symbol: NetworkSymbol;
};

export const UtxoList = ({
    utxos,
    accountKey,
    selectedUtxos: tempSelectedUtxos,
    onUtxoToggle,
    symbol,
}: UtxoListProps) => {
    const { applyStyle } = useNativeStyles();

    const isSelected = useCallback(
        (utxo: Utxo) =>
            tempSelectedUtxos.some(
                selected => selected.txid === utxo.txid && selected.vout === utxo.vout,
            ),
        [tempSelectedUtxos],
    );

    const renderItem = useCallback(
        ({ item }: { item: Utxo }) => (
            <UtxoCard
                isSelected={isSelected(item)}
                onToggle={onUtxoToggle}
                accountKey={accountKey}
                utxo={item}
                symbol={symbol}
            />
        ),
        [accountKey, onUtxoToggle, symbol, isSelected],
    );

    const rowSeparator = useCallback(() => <Box style={applyStyle(spacerStyle)} />, [applyStyle]);

    return (
        <FlashList
            data={utxos}
            extraData={tempSelectedUtxos}
            keyExtractor={utxo => `${utxo.txid}-${utxo.vout}`}
            renderItem={renderItem}
            contentContainerStyle={applyStyle(UtxoListStyle)}
            ItemSeparatorComponent={rowSeparator}
            estimatedItemSize={120}
        />
    );
};
