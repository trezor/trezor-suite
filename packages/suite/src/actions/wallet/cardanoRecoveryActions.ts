import { selectSelectedDevice } from '@suite-common/device';
import { createThunk } from '@suite-common/redux-utils';
import { addFakePendingCardanoTxThunk, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    getAddressParameters,
    getDerivationType,
    getNetworkId,
    getProtocolMagic,
    getUnusedChangeAddress,
    isTestnet,
} from '@suite-common/wallet-utils';
import { type Utxo as AccountUtxo } from '@trezor/blockchain-link-types';
import TrezorConnect, { PROTO, type PrecomposedTransactionFinalCardano } from '@trezor/connect';

const RECOVERY_PREFIX = '@suite/cardano-recovery';

// Account-level base address path that received funds outside the standard receive/change chains.
export const getCardanoAccountLevelPath = (accountIndex: number) =>
    `m/1852'/1815'/${accountIndex}'`;

// The Blockfrost backend only accepts an xpub for account queries, so a single account-level
// address cannot be scanned. The UTXO to sweep is entered manually (read from a block explorer).
type CardanoRecoveryUtxo = {
    txid: string;
    vout: number;
    amount: string;
};

type CardanoRecoverySignArgs = {
    accountKey: AccountKey;
    sourceAddress: string;
    utxo: CardanoRecoveryUtxo;
    accountLevelPath: string;
};

export const cardanoRecoverySignThunk = createThunk<
    { txid: string },
    CardanoRecoverySignArgs,
    { rejectValue: string }
>(
    `${RECOVERY_PREFIX}/sign`,
    async (
        { accountKey, sourceAddress, utxo: sourceUtxo, accountLevelPath },
        { dispatch, getState, rejectWithValue },
    ) => {
        const account = selectAccountByKey(getState(), accountKey);
        const device = selectSelectedDevice(getState());

        if (account?.networkType !== 'cardano') {
            return rejectWithValue('Target account is not a Cardano account.');
        }

        if (!device) {
            return rejectWithValue('No device selected.');
        }

        const changeAddress = getUnusedChangeAddress(account);
        const destinationAddress =
            account.addresses?.unused[0]?.address ?? account.addresses?.used[0]?.address;

        if (!changeAddress || !destinationAddress) {
            return rejectWithValue('Target account has no usable addresses.');
        }

        // Inject the account-level path so coin-selection re-attaches it to the composed inputs.
        const utxo: AccountUtxo[] = [
            {
                txid: sourceUtxo.txid,
                vout: sourceUtxo.vout,
                amount: sourceUtxo.amount,
                address: sourceAddress,
                path: accountLevelPath,
                blockHeight: 0,
                confirmations: 0,
                cardanoSpecific: { unit: 'lovelace' },
            },
        ];

        const composeResponse = await TrezorConnect.cardanoComposeTransaction({
            account: { descriptor: account.descriptor, utxo },
            outputs: [{ address: destinationAddress, setMax: true, assets: [] }],
            changeAddress,
            addressParameters: getAddressParameters(account, changeAddress.path),
            testnet: isTestnet(account.symbol),
        });

        if (!composeResponse.success) {
            return rejectWithValue(composeResponse.error.message);
        }

        const finalTx = composeResponse.payload.find(
            (tx): tx is PrecomposedTransactionFinalCardano => tx.type === 'final',
        );

        if (!finalTx) {
            const errorTx = composeResponse.payload.find(tx => tx.type === 'error');
            const reason =
                errorTx && 'error' in errorTx
                    ? errorTx.error
                    : 'Failed to compose recovery transaction.';

            return rejectWithValue(reason);
        }

        const signResponse = await TrezorConnect.cardanoSignTransaction({
            signingMode: PROTO.CardanoTxSigningMode.ORDINARY_TRANSACTION,
            device: {
                path: device.path,
                instance: device.instance,
                state: device.state,
                useEmptyPassphrase: device.useEmptyPassphrase,
            },
            inputs: finalTx.inputs,
            outputs: finalTx.outputs,
            unsignedTx: finalTx.unsignedTx,
            tagCborSets: true,
            testnet: isTestnet(account.symbol),
            protocolMagic: getProtocolMagic(account.symbol),
            networkId: getNetworkId(),
            fee: finalTx.fee,
            ttl: finalTx.ttl?.toString(),
            derivationType: getDerivationType(account.accountType),
        });

        if (!signResponse.success) {
            return rejectWithValue(signResponse.error.message);
        }

        const pushResponse = await TrezorConnect.pushTransaction({
            tx: signResponse.payload.serializedTx,
            coin: account.symbol,
        });

        if (!pushResponse.success) {
            return rejectWithValue(pushResponse.error.message);
        }

        const { txid } = pushResponse.payload;

        dispatch(addFakePendingCardanoTxThunk({ precomposedTransaction: finalTx, txid, account }));

        return { txid };
    },
);
