import {
    SolanaSignTransaction as SolanaSignTransactionSchema,
    SolanaTxAdditionalInfo,
} from '@trezor/connect-common';
import type { PROTO, PermissionRequest } from '@trezor/connect-common';
import solana from '@trezor/network-solana/runtime';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { getDefinitionsVersion } from '../../../utils/definitionsUtils';
import { validatePath } from '../../../utils/pathUtils';
import {
    PAYMENT_REQUEST_AMOUNT_BYTES,
    encodePaymentRequestAmount,
} from '../../../utils/paymentRequest';
import { getSolanaTokenDefinition } from '../solanaDefinitions';

type Params = { proto: PROTO.SolanaSignTx; serialize: boolean; symbols?: (string | undefined)[] };

// A v1 transaction (SIMD-0385) starts with the version byte, also when serialized: v1 puts the
// signatures after the message. The Solana runtime loads asynchronously, but the constructor must
// set the required firmware capabilities, so the byte is compared directly.
const isV1Transaction = (serializedTx: string) => serializedTx.slice(0, 2).toLowerCase() === '81';

export default class SolanaSignTransaction extends AbstractMethod<'solanaSignTransaction', Params> {
    constructor(message: MethodMessage<'solanaSignTransaction'>) {
        const { payload } = message;

        // validate bundle type
        Assert(SolanaSignTransactionSchema, payload);

        const path = validatePath(payload.path, 2);

        let additional_info;
        let symbols;

        if (payload.additionalInfo) {
            Assert(SolanaTxAdditionalInfo, payload.additionalInfo);

            const token_accounts_infos =
                payload.additionalInfo.tokenAccountsInfos?.map(tokenAccountInfo => ({
                    base_address: tokenAccountInfo.baseAddress,
                    token_program: tokenAccountInfo.tokenProgram,
                    token_mint: tokenAccountInfo.tokenMint,
                    token_account: tokenAccountInfo.tokenAccount,
                })) ?? [];

            symbols =
                payload.additionalInfo.tokenAccountsInfos?.map(
                    tokenAccountInfo => tokenAccountInfo.symbol,
                ) ?? [];

            additional_info = { token_accounts_infos };
        }

        const proto = {
            address_n: path,
            serialized_tx: payload.serializedTx,
            additional_info,
            payment_req: payload.payment_req
                ? encodePaymentRequestAmount(
                      payload.payment_req,
                      PAYMENT_REQUEST_AMOUNT_BYTES.DEFAULT,
                  )
                : undefined,
            chunkify: typeof payload.chunkify === 'boolean' ? payload.chunkify : false,
        };

        const params = { proto, serialize: !!payload.serialize, symbols };

        super(message, params);

        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.requiredFirmwareCoins = [getMiscNetwork('sol')];
        if (isV1Transaction(payload.serializedTx)) {
            this.requiredFirmwareCapabilities = ['solanaV1Transaction'];
        }
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('sign', this.requiredFirmwareCoins);
    }

    // The definition version depends on the device firmware, so it is fetched in run(), once the
    // device is known.
    private async setTokenDefinition() {
        const additionalInfo = this.params.proto.additional_info;
        const token = additionalInfo?.token_accounts_infos?.[0];
        if (!additionalInfo || !token) return;

        const tokenDefinition = await getSolanaTokenDefinition({
            mintAddress: token.token_mint,
            version: getDefinitionsVersion(this.getDevice()),
        });
        if (!tokenDefinition) return;

        additionalInfo.encoded_token = tokenDefinition;
    }

    async run() {
        await this.setTokenDefinition();

        const cmd = this.getDevice().getCommands();

        if (this.params.serialize) {
            const { createTransactionShimFromHex } = await solana();
            const tx = createTransactionShimFromHex(this.params.proto.serialized_tx);

            const addressCall = await cmd.typedCall('SolanaGetAddress', 'SolanaAddress', {
                address_n: this.params.proto.address_n,
                show_display: false,
                chunkify: false,
            });
            const { address } = addressCall.message;
            const { message } = await cmd.typedCall('SolanaSignTx', 'SolanaTxSignature', {
                ...this.params.proto,
                serialized_tx: tx.serializeMessage(),
            });

            tx.addSignature(address, message.signature);
            const signedSerializedTx = tx.serialize();

            return { signature: message.signature, serializedTx: signedSerializedTx };
        }

        const { message } = await cmd.typedCall(
            'SolanaSignTx',
            'SolanaTxSignature',
            this.params.proto,
        );

        return { signature: message.signature };
    }
}
