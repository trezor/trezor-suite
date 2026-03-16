import { type Account, type ExcludedUtxos } from '@suite-common/wallet-types';
import { getUtxoOutpoint } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export interface GetExcludedUtxosProps {
    utxos?: Account['utxo'];
    anonymitySet?: NonNullable<Account['addresses']>['anonymitySet'];
    dustLimit?: number;
    targetAnonymity?: number;
}

export const getExcludedUtxos = ({
    utxos,
    anonymitySet,
    dustLimit,
    targetAnonymity,
}: GetExcludedUtxosProps) => {
    // exclude utxos from default composeTransaction process (see sendFormBitcoinActions)
    // utxos are stored as dictionary where:
    // `key` is an outpoint (string combination of utxo.txid + utxo.vout)
    // `value` is the reason
    // utxos might be spent using CoinControl feature
    const excludedUtxos: ExcludedUtxos = {};
    utxos?.forEach(utxo => {
        const outpoint = getUtxoOutpoint(utxo);
        const anonymity = (anonymitySet && anonymitySet[utxo.address]) || 1;
        if (new BigNumber(utxo.amount).lt(Number(dustLimit))) {
            // is lower than dust limit
            excludedUtxos[outpoint] = 'dust';
        } else if (anonymity < (targetAnonymity || 1)) {
            // didn't reach desired anonymity (coinjoin account)
            excludedUtxos[outpoint] = 'low-anonymity';
        }
    });

    return excludedUtxos;
};
