import { useCallback } from 'react';

import { FlashList } from '@shopify/flash-list';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isSameUtxo } from '@suite-common/wallet-utils';
import { Box } from '@suite-native/atoms';
import { type Utxo } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/connect';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { UtxoCard } from './UtxoCard';

const UtxoListStyle = prepareNativeStyle(utils => ({ paddingBottom: utils.spacings.sp16 }));

const spacerStyle = prepareNativeStyle(utils => ({
    height: utils.spacings.sp16,
}));

type UtxoListProps = {
    deviceStaticSessionId: StaticSessionId;
    accountKey: AccountKey;
    utxos: Utxo[];
    selectedUtxos: Utxo[];
    onUtxoToggle: (utxo: Utxo) => void;
    symbol: NetworkSymbol;
};

export const UtxoList = ({
    deviceStaticSessionId,
    accountKey,
    utxos,
    selectedUtxos,
    onUtxoToggle,
    symbol,
}: UtxoListProps) => {
    const { applyStyle } = useNativeStyles();

    const isSelected = useCallback(
        (utxo: Utxo) => selectedUtxos.some(selected => isSameUtxo(selected, utxo)),
        [selectedUtxos],
    );

    const renderItem = useCallback(
        ({ item }: { item: Utxo }) => (
            <UtxoCard
                isSelected={isSelected(item)}
                onToggle={onUtxoToggle}
                accountKey={accountKey}
                utxo={item}
                symbol={symbol}
                deviceStaticSessionId={deviceStaticSessionId}
            />
        ),
        [accountKey, onUtxoToggle, symbol, isSelected, deviceStaticSessionId],
    );

    const rowSeparator = useCallback(() => <Box style={applyStyle(spacerStyle)} />, [applyStyle]);

    return (
        <FlashList
            data={utxos}
            extraData={selectedUtxos}
            keyExtractor={utxo => `${utxo.txid}-${utxo.vout}`}
            renderItem={renderItem}
            contentContainerStyle={applyStyle(UtxoListStyle)}
            ItemSeparatorComponent={rowSeparator}
        />
    );
};
