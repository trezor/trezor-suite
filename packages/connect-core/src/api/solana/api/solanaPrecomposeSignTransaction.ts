import type { TokenInfo } from '@trezor/connect-common';
import { SolanaSignTransaction as SolanaSignTransactionSchema } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import solana from '@trezor/network-solana/runtime';
import { Assert } from '@trezor/schema-utils';
import { BigNumber } from '@trezor/utils';

import type { MethodMessage } from '../../../core/AbstractMethod';
import { AbstractMethod } from '../../../core/AbstractMethod';

export default class SolanaPrecomposeSignTransaction extends AbstractMethod<
    'solanaPrecomposeSignTransaction',
    SolanaSignTransactionSchema
> {
    constructor(message: MethodMessage<'solanaPrecomposeSignTransaction'>) {
        const { payload } = message;

        Assert(SolanaSignTransactionSchema, payload);

        super(message, payload);
        this.useDevice = false;
    }

    get requiredPermissions() {
        return [];
    }

    async run() {
        const { getDecompiledMessage } = await solana();
        const decompiledMessage = getDecompiledMessage(
            this.params.serializedTx,
            !!this.params.serialize,
        );
        if (!decompiledMessage) {
            throw ERRORS.TypedError('Runtime', 'Message not decoded');
        }

        const { message, baseFee, priorityFee, instructions } = decompiledMessage;
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
                    const tokenInfo = this.params.additionalInfo?.tokenAccountsInfos?.find(
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
                        standard: 'SPL',
                        contract: parsed.accounts.mint.address,
                        decimals: parsed.data.decimals,
                        symbol: tokenInfo?.symbol,
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

        const fee = baseFee.plus(priorityFee ?? feePerUnit.multipliedBy(feeLimit).dividedBy(1e6));
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
    }
}
