import type { MessageTypes } from '@trezor/blockchain-link-types';
import solana from '@trezor/network-solana/runtime';
import type {
    ParsedTransactionWithMeta,
    Signature,
    SolanaAPI,
    SolanaValidParsedTxWithMeta,
} from '@trezor/network-solana/types';
import { isNotNullOrUndefined } from '@trezor/utils';

import type { SignatureWithSlot } from './types';

export const getAllSignatures = async (
    api: SolanaAPI,
    descriptor: MessageTypes.GetAccountInfo['payload']['descriptor'],
    fullHistory = false,
) => {
    const { address } = await solana();
    let lastSignature: SignatureWithSlot | undefined;
    let keepFetching = true;
    let allSignatures: SignatureWithSlot[] = [];

    const defaultValueLimit = 100; // default value of getSignaturesForAddress
    while (keepFetching) {
        const signaturesInfos = await api.rpc
            .getSignaturesForAddress(address(descriptor), {
                before: lastSignature?.signature,
                limit: defaultValueLimit,
            })
            .send();

        const signatures = signaturesInfos.map(info => ({
            signature: info.signature,
            slot: info.slot,
        }));
        lastSignature = signatures[signatures.length - 1];
        keepFetching = signatures.length === defaultValueLimit && fullHistory;
        allSignatures = [...allSignatures, ...signatures];
    }

    return allSignatures;
};

export const fetchTransactionPage = async (
    api: SolanaAPI,
    signatures: Signature[],
): Promise<ParsedTransactionWithMeta[]> =>
    (
        await Promise.all(
            signatures.map(signature =>
                api.rpc
                    .getTransaction(signature, {
                        encoding: 'jsonParsed',
                        maxSupportedTransactionVersion: 0,
                        commitment: 'confirmed',
                    })
                    .send(),
            ),
        )
    ).filter(isNotNullOrUndefined);

export const isValidTransaction = (
    tx: ParsedTransactionWithMeta,
): tx is SolanaValidParsedTxWithMeta => !!(tx?.meta && tx.transaction && tx.blockTime);
