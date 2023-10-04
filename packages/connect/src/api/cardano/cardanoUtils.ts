import { coinSelection, types } from '@fivebinaries/coin-selection';

import { AccountUtxo, CardanoCertificate } from '../../types';
import { PROTO } from '../../constants';

const CARDANO_DEFAULT_TTL_OFFSET = 7200;

export const transformUtxos = (utxos: AccountUtxo[]): types.Utxo[] => {
    const result: types.Utxo[] = [];
    utxos?.forEach(utxo => {
        const foundItem = result.find(
            res => res.txHash === utxo.txid && res.outputIndex === utxo.vout,
        );

        if (utxo.cardanoSpecific) {
            if (!foundItem) {
                // path: utxo.path,
                result.push({
                    // path: utxo.path,
                    address: utxo.address,
                    txHash: utxo.txid,
                    outputIndex: utxo.vout,
                    amount: [{ quantity: utxo.amount, unit: utxo.cardanoSpecific.unit }],
                });
            } else {
                foundItem.amount.push({ quantity: utxo.amount, unit: utxo.cardanoSpecific.unit });
            }
        }
    });

    return result;
};

export const prepareCertificates = (certs: CardanoCertificate[]) => {
    // convert @trezor/connect certificate format to cardano coin-selection lib format
    const convertedCerts: types.Certificate[] = [];
    certs.forEach(cert => {
        switch (cert.type) {
            case PROTO.CardanoCertificateType.STAKE_DELEGATION:
                convertedCerts.push({
                    type: cert.type,
                    pool: cert.pool!,
                });
                break;
            case PROTO.CardanoCertificateType.STAKE_REGISTRATION:
            case PROTO.CardanoCertificateType.STAKE_DEREGISTRATION:
                convertedCerts.push({
                    type: cert.type,
                });
                break;
            // no default
        }
    });
    return convertedCerts;
};

export const getTtl = (testnet: boolean) => {
    // Time-to-live (TTL) in cardano represents a slot, or deadline by which a transaction must be submitted.
    // Suite doesn't store information about current slot number.
    // In order to correctly calculate current slot (and TTL) we start from a point from which we know that
    // 1 slot = 1 second (which was not always the case)
    // https://cardano.stackexchange.com/questions/491/calculate-timestamp-from-slot/494#494
    const shelleySlot = testnet ? 6192449 : 4924800;
    const shelleyTimestamp = testnet ? 1672848449 : 1596491091;
    const currentTimestamp = Math.floor(new Date().getTime() / 1000);
    const currentSlot = shelleySlot + currentTimestamp - shelleyTimestamp;
    return currentSlot + CARDANO_DEFAULT_TTL_OFFSET;
};

export const composeTxPlan = (
    descriptor: string,
    utxo: AccountUtxo[],
    outputs: types.UserOutput[],
    certificates: CardanoCertificate[],
    withdrawals: types.Withdrawal[],
    changeAddress: string,
    isTestnet: boolean,
    options?: types.Options,
) =>
    coinSelection(
        {
            utxos: transformUtxos(utxo),
            outputs,
            changeAddress,
            certificates: prepareCertificates(certificates),
            withdrawals,
            accountPubKey: descriptor,
            ttl: getTtl(isTestnet),
        },
        options,
    );

export const hexStringByteLength = (s: string) => s.length / 2;

export const sendChunkedHexString = async (
    typedCall: any,
    data: string,
    chunkSize: number,
    messageType: string,
) => {
    let processedSize = 0;
    while (processedSize < data.length) {
        const chunk = data.slice(processedSize, processedSize + chunkSize);
        await typedCall(messageType, 'CardanoTxItemAck', {
            data: chunk,
        });
        processedSize += chunkSize;
    }
};
