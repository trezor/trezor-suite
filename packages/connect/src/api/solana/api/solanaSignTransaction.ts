import {
    decompileTransactionMessage,
    getBase16Encoder,
    getCompiledTransactionMessageDecoder,
    getTransactionDecoder,
    pipe,
} from '@solana/kit';
import {
    COMPUTE_BUDGET_PROGRAM_ADDRESS,
    ComputeBudgetInstruction,
    identifyComputeBudgetInstruction,
    parseSetComputeUnitLimitInstruction,
    parseSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';
import {
    SYSTEM_PROGRAM_ADDRESS,
    SystemInstruction,
    identifySystemInstruction,
    parseCreateAccountInstruction,
    parseTransferSolInstruction,
} from '@solana-program/system';
import {
    TOKEN_PROGRAM_ADDRESS,
    TokenInstruction,
    identifyTokenInstruction,
    parseTransferCheckedInstruction,
} from '@solana-program/token';

import { TokenInfo } from '@trezor/blockchain-link-types';
import { AssertWeak } from '@trezor/schema-utils';
import { BigNumber } from '@trezor/utils';

import { ERRORS, PROTO } from '../../../constants';
import { AbstractMethod } from '../../../core/AbstractMethod';
import { getMiscNetwork } from '../../../data/coinInfo';
import { SolanaSignTransaction as SolanaSignTransactionSchema } from '../../../types/api/solana';
import { validatePath } from '../../../utils/pathUtils';
import { getFirmwareRange } from '../../common/paramsValidator';
import { transformAdditionalInfo } from '../additionalInfo';
import { getSolanaTokenDefinition } from '../solanaDefinitions';
import { SOLANA_BASE_FEE, createTransactionShimFromHex } from '../solanaUtils';

type Params = PROTO.SolanaSignTx & { serialize: boolean };

export default class SolanaSignTransaction extends AbstractMethod<'solanaSignTransaction', Params> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.requiredDeviceCapabilities = ['Capability_Solana'];
        this.firmwareRange = getFirmwareRange(
            this.name,
            getMiscNetwork('Solana'),
            this.firmwareRange,
        );

        const { payload } = this;

        // validate bundle type
        // TODO: weak assert for compatibility purposes (issue #10841)
        AssertWeak(SolanaSignTransactionSchema, payload);

        const path = validatePath(payload.path, 2);

        this.params = {
            address_n: path,
            serialized_tx: payload.serializedTx,
            additional_info: transformAdditionalInfo(payload.additionalInfo),
            serialize: !!payload.serialize,
        };
    }

    async initAsync(): Promise<void> {
        const token = this.params.additional_info?.token_accounts_infos?.[0];

        if (token) {
            const tokenDefinition = await getSolanaTokenDefinition({
                mintAddress: token.token_mint,
            });

            if (!tokenDefinition) return;

            this.params.additional_info!.encoded_token = tokenDefinition;
        }
    }

    get info() {
        return 'Sign Solana transaction';
    }

    payloadToPrecomposed() {
        try {
            let messageBytes;
            if (this.payload.serialize) {
                const transaction = pipe(
                    this.payload.serializedTx,
                    getBase16Encoder().encode,
                    getTransactionDecoder().decode,
                );
                messageBytes = transaction.messageBytes;
            } else {
                messageBytes = getBase16Encoder().encode(this.payload.serializedTx);
            }
            const compiledMessage = pipe(
                messageBytes,
                getCompiledTransactionMessageDecoder().decode,
            );
            const message = decompileTransactionMessage(compiledMessage);
            const baseFee = new BigNumber(SOLANA_BASE_FEE).multipliedBy(
                compiledMessage.header.numSignerAccounts,
            );
            const outputs = [];
            let feePerUnit = new BigNumber(0);
            let feeLimit = new BigNumber(0);
            let rent = new BigNumber(0);
            let sendAmount = new BigNumber(0);
            let token: TokenInfo | undefined;
            for (const instruction of message.instructions) {
                // Fee decoding
                if (
                    instruction.programAddress === COMPUTE_BUDGET_PROGRAM_ADDRESS &&
                    instruction.data
                ) {
                    const data = instruction.data as Uint8Array;
                    const type = identifyComputeBudgetInstruction({ data });
                    if (type === ComputeBudgetInstruction.SetComputeUnitPrice) {
                        const parsed = parseSetComputeUnitPriceInstruction({
                            data,
                            programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
                        });
                        feePerUnit = new BigNumber(parsed.data.microLamports.toString());
                    }
                    if (type === ComputeBudgetInstruction.SetComputeUnitLimit) {
                        const parsed = parseSetComputeUnitLimitInstruction({
                            data,
                            programAddress: COMPUTE_BUDGET_PROGRAM_ADDRESS,
                        });
                        feeLimit = new BigNumber(parsed.data.units.toString());
                    }
                }
                // Transfer instruction decoding
                if (
                    instruction.programAddress === SYSTEM_PROGRAM_ADDRESS &&
                    instruction.data &&
                    instruction.accounts
                ) {
                    const instructionSafe = {
                        ...instruction,
                        data: instruction.data as Uint8Array,
                        accounts: instruction.accounts,
                    };
                    const type = identifySystemInstruction(instructionSafe);
                    if (type === SystemInstruction.TransferSol) {
                        const parsed = parseTransferSolInstruction(instructionSafe);
                        outputs.push({
                            address: parsed.accounts.destination.address,
                            amount: parsed.data.amount.toString(),
                            script_type: 'PAYTOADDRESS' as const,
                        });
                        sendAmount = sendAmount.plus(parsed.data.amount.toString());
                    } else if (type === SystemInstruction.CreateAccount) {
                        const parsed = parseCreateAccountInstruction(instructionSafe);
                        outputs.push({
                            address: parsed.accounts.newAccount.address,
                            amount: parsed.data.lamports.toString(),
                            script_type: 'PAYTOADDRESS' as const,
                        });
                        rent = rent.plus(parsed.data.lamports.toString());
                    }
                }
                // Tokens
                if (
                    instruction.programAddress === TOKEN_PROGRAM_ADDRESS &&
                    instruction.data &&
                    instruction.accounts
                ) {
                    const instructionSafe = {
                        ...instruction,
                        data: instruction.data as Uint8Array,
                        accounts: instruction.accounts,
                    };
                    const type = identifyTokenInstruction(instructionSafe);
                    if (type === TokenInstruction.TransferChecked) {
                        const parsed = parseTransferCheckedInstruction(instructionSafe);
                        const destinationATA = parsed.accounts.destination.address;
                        const tokenInfo = this.payload.additionalInfo?.tokenAccountsInfos?.find(
                            t =>
                                t.tokenAccount === destinationATA &&
                                t.tokenMint === parsed.accounts.mint.address,
                        );
                        if (!sendAmount.isZero()) {
                            throw ERRORS.TypedError(
                                'Runtime',
                                'Multiple token transfers in a single transaction are not supported',
                            );
                        }
                        outputs.push({
                            address: tokenInfo?.baseAddress || destinationATA,
                            amount: parsed.data.amount.toString(),
                            script_type: 'PAYTOADDRESS' as const,
                        });
                        sendAmount = new BigNumber(parsed.data.amount.toString());
                        token = {
                            type: 'SPL',
                            standard: 'SPL',
                            contract: parsed.accounts.mint.address,
                            decimals: parsed.data.decimals,
                            symbol: tokenInfo?.symbol,
                        };
                    }
                }
            }
            if (outputs.length === 0) {
                throw ERRORS.TypedError('Runtime', 'No outputs decoded');
            }

            const fee = baseFee.plus(feePerUnit.multipliedBy(feeLimit).dividedBy(1e6));
            const totalSpent = sendAmount.plus(rent).plus(fee);

            return Promise.resolve({
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
            });
        } catch (e) {
            // Don't throw errors from this method
            console.error('Error in payloadToPrecomposed', e);

            return Promise.resolve(undefined);
        }
    }

    async run() {
        const cmd = this.device.getCommands();

        if (this.params.serialize) {
            const tx = await createTransactionShimFromHex(this.params.serialized_tx);

            const { message } = await cmd.typedCall('SolanaSignTx', 'SolanaTxSignature', {
                ...this.params,
                serialized_tx: tx.serializeMessage(),
            });

            const addressCall = await cmd.typedCall('SolanaGetAddress', 'SolanaAddress', {
                address_n: this.params.address_n,
                show_display: false,
                chunkify: false,
            });
            const { address } = addressCall.message;

            tx.addSignature(address, message.signature);
            const signedSerializedTx = tx.serialize();

            return { signature: message.signature, serializedTx: signedSerializedTx };
        }

        const { message } = await cmd.typedCall('SolanaSignTx', 'SolanaTxSignature', this.params);

        return { signature: message.signature };
    }
}
