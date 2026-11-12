// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/GetAccountInfo.js

import type {
    AccountUtxo,
    CoinInfo,
    GetAccountInfo as GetAccountInfoParams,
    PermissionRequest,
} from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/constants';
import { toCanonicalDescriptor } from '@trezor/utils';

import { assertBackendSupported, initBlockchain } from '../backend/BlockchainLink';
import type { MethodContext, MethodMessage } from '../core/AbstractMethod';
import { AbstractMethod } from '../core/AbstractMethod';
import { getCoinInfoOrThrow } from '../data/coinInfo';
import { validateParams } from './common/paramsValidator';
import { isUtxoBased } from '../utils/accountUtils';
import { getLabel } from '../utils/pathUtils';

type Params = GetAccountInfoParams & { descriptor: string; coinInfo: CoinInfo };

export default class GetAccountInfo extends AbstractMethod<'getAccountInfo', Params> {
    constructor(message: MethodMessage<'getAccountInfo'>) {
        const { payload } = message;

        // Deriving the descriptor on the device and bundles are left to Trezor Suite.
        if (payload.bundle || payload.path) {
            throw ERRORS.TypedError(
                'Method_NotAllowed',
                'GetAccountInfo: path and bundle are available only through Trezor Suite',
            );
        }

        validateParams(payload, [
            { name: 'coin', type: 'string', required: true },
            { name: 'identity', type: 'string' },
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

        const coinInfo = getCoinInfoOrThrow(payload.coin);
        assertBackendSupported(coinInfo);

        super(message, { ...payload, descriptor: payload.descriptor!, coinInfo });

        this.useDevice = false;
        this.useDeviceState = false;
    }

    get requiredPermissions(): PermissionRequest[] {
        return [this.coinPerm('read_account_info', this.params.coinInfo)];
    }

    get info() {
        return getLabel('Export #NETWORK account info', this.params.coinInfo);
    }

    async run(context: MethodContext) {
        const { coinInfo, descriptor, identity, details } = this.params;
        const blockchain = await initBlockchain(coinInfo, context.sendCoreMessage, identity);

        // Blockbook rejects taproot descriptors that use `h` for hardened parts, so the backend
        // receives the canonical form. The response keeps the caller's original `descriptor` below,
        // so the API returns the same format it was given.
        const canonicalDescriptor = toCanonicalDescriptor(descriptor);

        const info = await blockchain.getAccountInfo({
            descriptor: canonicalDescriptor,
            details,
            tokens: this.params.tokens,
            page: this.params.page,
            pageSize: this.params.pageSize,
            pageCursor: this.params.pageCursor,
            from: this.params.from,
            to: this.params.to,
            contractFilter: this.params.contractFilter,
            gap: this.params.gap,
            marker: this.params.marker,
            tokenAccountsPubKeys: this.params.tokenAccountsPubKeys,
            stellarContractTokens: this.params.stellarContractTokens,
            protocols: this.params.protocols,
            confirmedNonce: this.params.confirmedNonce,
            privatePending: this.params.privatePending,
        });

        let utxo: AccountUtxo[] | undefined;
        if (isUtxoBased(coinInfo) && typeof details === 'string' && details !== 'basic') {
            utxo = await blockchain.getAccountUtxo(canonicalDescriptor);
        }

        // EVM descriptors may be names (.eth and other TLDs) which the backend resolved to hex
        const isNamedEvmDescriptor = coinInfo.type === 'ethereum' && descriptor.includes('.');

        return {
            ...info,
            // override descriptor (otherwise eth checksum is lost)
            descriptor: isNamedEvmDescriptor ? info.descriptor : descriptor,
            utxo,
        };
    }
}
