import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { VStack } from '@suite-native/atoms';

import { UtxoCard } from './UtxoCard';
import { useUtxoSelection } from '../hooks/useUxtoSelection';

export const UtxoList = ({ accountKey }: { accountKey: string }) => {
    const { handleUtxoSelection } = useUtxoSelection();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const utxos = account?.utxo || [];

    return (
        <VStack>
            {utxos.map(utxo => (
                <UtxoCard
                    onToggle={handleUtxoSelection}
                    accountKey={accountKey}
                    key={utxo.txid}
                    utxo={utxo}
                />
            ))}
        </VStack>
    );
};
