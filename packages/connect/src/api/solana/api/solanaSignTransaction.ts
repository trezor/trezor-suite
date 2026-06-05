import solana from '@trezor/coins-solana/runtime';
import {
    SolanaSignTransaction as SolanaSignTransactionSchema,
    SolanaTxAdditionalInfo,
} from '@trezor/connect-common';
import type { PROTO, PermissionRequest, TokenInfo } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { Assert } from '@trezor/schema-utils';
import { BigNumber } from '@trezor/utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { validatePath } from '../../../utils/pathUtils';
import {
    PAYMENT_REQUEST_AMOUNT_BYTES,
    encodePaymentRequestAmount,
} from '../../../utils/paymentRequest';
import { getSolanaTokenDefinition } from '../solanaDefinitions';

type Params = { proto: PROTO.SolanaSignTx; serialize: boolean; symbols?: (string | undefined)[] };

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
        };

        const params = { proto, serialize: !!payload.serialize, symbols };

        super(message, params);

        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.requiredFirmwareCoins = [getMiscNetwork('Solana')];
    }

    get requiredPermissions(): PermissionRequest[] {
        return this.coinPerms('sign', this.requiredFirmwareCoins);
    }

    async initAsync(): Promise<void> {
        const token = this.params.proto.additional_info?.token_accounts_infos?.[0];

        if (token) {
            const tokenDefinition = await getSolanaTokenDefinition({
                mintAddress: token.token_mint,
            });

            if (!tokenDefinition) return;

            this.params.proto.additional_info!.encoded_token = tokenDefinition;
        }
    }

    get info() {
        return 'Sign Solana transaction';
    }

    async payloadToPrecomposed() {
        try {
            const { getDecompiledMessage } = await solana();
            const { message, baseFee, instructions } = getDecompiledMessage(
                this.params.proto.serialized_tx,
                this.params.serialize,
            );
            const outputs = [];
            let feePerUnit = new BigNumber(0);
            let feeLimit = new BigNumber(0);
            let rent = new BigNumber(0);
            let sendAmount = new BigNumber(0);
            let token: TokenInfo | undefined;
            for (const instruction of instructions) {
                const { type, parsed } = instruction;

                switch (type) {
                    case 'unit-price': {
                        feePerUnit = new BigNumber(parsed.data.microLamports.toString());
                        break;
                    }
                    case 'unit-limit': {
                        feeLimit = new BigNumber(parsed.data.units.toString());
                        break;
                    }
                    case 'transfer-sol': {
                        outputs.push({
                            address: parsed.accounts.destination.address,
                            amount: parsed.data.amount.toString(),
                            script_type: 'PAYTOADDRESS' as const,
                        });
                        sendAmount = sendAmount.plus(parsed.data.amount.toString());
                        break;
                    }
                    case 'create-account': {
                        outputs.push({
                            address: parsed.accounts.newAccount.address,
                            amount: parsed.data.lamports.toString(),
                            script_type: 'PAYTOADDRESS' as const,
                        });
                        rent = rent.plus(parsed.data.lamports.toString());
                        break;
                    }
                    case 'transfer-checked': {
                        const destinationATA = parsed.accounts.destination.address;
                        const tokenAccountInfos =
                            this.params.proto.additional_info?.token_accounts_infos ?? [];
                        const tokenInfoIndex = tokenAccountInfos.findIndex(
                            t =>
                                t.token_account === destinationATA &&
                                t.token_mint === parsed.accounts.mint.address,
                        );
                        const tokenInfo = tokenAccountInfos[tokenInfoIndex];
                        if (!sendAmount.isZero()) {
                            throw ERRORS.TypedError(
                                'Runtime',
                                'Multiple token transfers in a single transaction are not supported',
                            );
                        }
                        outputs.push({
                            address: tokenInfo?.base_address || destinationATA,
                            amount: parsed.data.amount.toString(),
                            script_type: 'PAYTOADDRESS' as const,
                        });
                        sendAmount = new BigNumber(parsed.data.amount.toString());
                        token = {
                            standard: 'SPL',
                            contract: parsed.accounts.mint.address,
                            decimals: parsed.data.decimals,
                            symbol: this.params.symbols?.[tokenInfoIndex],
                        };
                        break;
                    }
                    case 'other':
                    default:
                        break;
                }
            }
            if (outputs.length === 0) {
                throw ERRORS.TypedError('Runtime', 'No outputs decoded');
            }

            const fee = baseFee.plus(feePerUnit.multipliedBy(feeLimit).dividedBy(1e6));
            const totalSpent = sendAmount.plus(rent).plus(fee);

            return {
                type: 'final' as const,
                inputs: [],
                outputsPermutation: [0],
                outputs,
                totalSpent: token ? sendAmount.toString() : totalSpent.toString(),
                fee: fee.toString(),
                feePerByte: feePerUnit.toString(),
                feeLimit: feeLimit.toString(),
                bytes: 0,
                max: undefined,
                isTokenKnown: false,
                token,
                // Countdown for blockhash-constrained transactions
                createdTimestamp:
                    'blockhash' in message.lifetimeConstraint ? new Date().getTime() : undefined,
            };
        } catch (e) {
            // Don't throw errors from this method
            console.error('Error in payloadToPrecomposed', e);
        }
    }

    async run() {
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
