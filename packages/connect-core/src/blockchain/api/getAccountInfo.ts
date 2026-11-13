// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import type { PostMessage } from '@trezor/blockchain-core/src/backend/Blockchain';
import { initCoinBackend } from '@trezor/blockchain-core/src/backend/BlockchainLink';
import { getBackendCoinInfo } from '@trezor/blockchain-core/src/data/coinInfo';
import type { AccountInfo, Utxo } from '@trezor/blockchain-link-types';
import type { GetAccountInfo } from '@trezor/connect-common';
import { toCanonicalDescriptor } from '@trezor/utils';

import { COIN_PARAMS, validateParams } from '../utils/validateParams';

export type GetAccountInfoParams = Omit<GetAccountInfo, 'path' | 'derivationType'> & {
    descriptor: string;
};

const isUtxoBased = ({ type, shortcut }: { type: string; shortcut: string }) =>
    type === 'bitcoin' || shortcut === 'ADA' || shortcut === 'tADA';

export const getAccountInfo = async (
    params: GetAccountInfoParams,
    postMessage: PostMessage,
): Promise<AccountInfo & { utxo?: Utxo[] }> => {
    validateParams(params, [
        ...COIN_PARAMS,
        { name: 'descriptor', type: 'string', required: true },
        { name: 'details', type: 'string' },
        { name: 'tokens', type: 'string' },
        { name: 'page', type: 'number' },
        { name: 'pageSize', type: 'number' },
        { name: 'from', type: 'number' },
        { name: 'to', type: 'number' },
        { name: 'contractFilter', type: 'string' },
        { name: 'gap', type: 'number' },
        { name: 'marker', type: 'object' },
        { name: 'protocols', type: 'array' },
        // An empty list is meaningful: the account watches no contract tokens yet.
        { name: 'stellarContractTokens', type: 'array', allowEmpty: true },
        { name: 'confirmedNonce', type: 'boolean' },
        { name: 'privatePending', type: 'object' },
    ]);
    const { descriptor, details } = params;
    const coinInfo = getBackendCoinInfo(params.coin);
    const blockchain = await initCoinBackend(params, postMessage);

    // Blockbook rejects taproot descriptors that use `h` for hardened parts, so the backend
    // receives the canonical form. The response keeps the caller's original `descriptor` below,
    // so the API returns the same format it was given.
    const canonicalDescriptor = toCanonicalDescriptor(descriptor);

    const info = await blockchain.getAccountInfo({
        descriptor: canonicalDescriptor,
        details,
        tokens: params.tokens,
        page: params.page,
        pageSize: params.pageSize,
        pageCursor: params.pageCursor,
        from: params.from,
        to: params.to,
        contractFilter: params.contractFilter,
        gap: params.gap,
        marker: params.marker,
        tokenAccountsPubKeys: params.tokenAccountsPubKeys,
        stellarContractTokens: params.stellarContractTokens,
        protocols: params.protocols,
        confirmedNonce: params.confirmedNonce,
        privatePending: params.privatePending,
    });

    let utxo: Utxo[] | undefined;
    if (isUtxoBased(coinInfo) && typeof details === 'string' && details !== 'basic') {
        utxo = info.empty ? [] : await blockchain.getAccountUtxo(canonicalDescriptor);
    }

    // EVM descriptors may be names (.eth and other TLDs) which the backend resolved to hex
    const isNamedEvmDescriptor = coinInfo.type === 'ethereum' && descriptor.includes('.');

    return {
        ...info,
        // override descriptor (otherwise eth checksum is lost)
        descriptor: isNamedEvmDescriptor ? info.descriptor : descriptor,
        utxo,
    };
};
