import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { ok } from '@trezor/type-utils';
import { bufferUtils } from '@trezor/utils';
import { Transaction, address as addressUtils } from '@trezor/utxo-lib';

import type { MockWallet } from './mockWallet';
import { BITCOIN_NETWORK } from '../src/bitcoin/bitcoinNetwork';
import type { TransportCall, TransportCallParams } from '../src/device/deviceSession';

type RecordedInput = {
    prev_hash: string;
    prev_index: number;
    sequence?: number;
    script_type?: string;
};

type RecordedOutput = {
    address?: string;
    address_n?: number[];
    amount: string | number;
    script_type?: string;
};

type RecordedPreviousOutput = {
    amount: string | number;
    script_pubkey: string;
};

export type MockDeviceParams = {
    /** Wallets by passphrase. The empty passphrase selects the standard wallet. */
    wallets: Record<string, MockWallet>;
    /** Matrix positions of the correct PIN. Without it the device has no PIN. */
    pin?: string;
    hasPassphraseProtection?: boolean;
    /** Makes the device answer the output confirmation as if the user pressed "cancel". */
    isOutputRejected?: boolean;
    /** Makes the device return a transaction paying one satoshi less than it was told to. */
    isSignedAmountAltered?: boolean;
    features?: Partial<PROTO.Features>;
};

const response = <T extends PROTO.MessageKey>(type: T, message: PROTO.MessagePayload<T>) =>
    Promise.resolve(ok({ type, message } as PROTO.MessageResponse));

const failure = (code: PROTO.FailureType, message: string) =>
    response('Failure', { code, message });

/**
 * Imitates the parts of old Trezor One firmware the migration talks to: the PIN and passphrase
 * prompts, `GetPublicKey`, and the request-driven transaction signing including the streaming
 * of previous transactions. It does not produce real signatures.
 */
export const mockDevice = ({
    wallets,
    pin,
    hasPassphraseProtection = false,
    isOutputRejected = false,
    isSignedAmountAltered = false,
    features,
}: MockDeviceParams) => {
    const calls: TransportCallParams[] = [];
    const streamedPreviousOutputs: RecordedPreviousOutput[] = [];

    let isPinCached = pin === undefined;
    let cachedPassphrase: string | undefined = hasPassphraseProtection ? undefined : '';
    let pendingCall: TransportCallParams | undefined;

    let signing:
        | {
              inputsCount: number;
              outputsCount: number;
              inputs: RecordedInput[];
              outputs: RecordedOutput[];
              previous?: { hash: string; inputsCount: number; outputsCount: number };
              isTransactionConfirmed: boolean;
          }
        | undefined;

    const requestTransactionData = (
        request_type: PROTO.TxRequest['request_type'],
        request_index: number,
        tx_hash?: string,
    ) => response('TxRequest', { request_type, details: { request_index, tx_hash } });

    const finishSigning = () => {
        if (!signing) return failure('Failure_UnexpectedMessage', 'Not in signing mode');

        const transaction = new Transaction({ network: BITCOIN_NETWORK });
        signing.inputs.forEach(input => {
            const isLegacy = input.script_type === 'SPENDADDRESS';
            transaction.ins.push({
                hash: bufferUtils.reverseBuffer(Buffer.from(input.prev_hash, 'hex')),
                index: input.prev_index,
                script: isLegacy ? Buffer.alloc(107, 0x30) : Buffer.alloc(0),
                sequence: input.sequence ?? 0xffffffff,
                witness: isLegacy ? [] : [Buffer.alloc(72, 0x30), Buffer.alloc(33, 0x02)],
            });
        });
        signing.outputs.forEach(output => {
            transaction.outs.push({
                script: addressUtils.toOutputScript(output.address ?? '', BITCOIN_NETWORK),
                value: (BigInt(output.amount) - (isSignedAmountAltered ? 1n : 0n)).toString(),
            });
        });
        signing = undefined;

        return response('TxRequest', {
            request_type: 'TXFINISHED',
            serialized: { serialized_tx: transaction.toHex() },
        });
    };

    const continueAfterInput = () => {
        if (!signing) return failure('Failure_UnexpectedMessage', 'Not in signing mode');

        return signing.inputs.length < signing.inputsCount
            ? requestTransactionData('TXINPUT', signing.inputs.length)
            : requestTransactionData('TXOUTPUT', 0);
    };

    const handleSigning = ({ name, data }: TransportCallParams) => {
        if (!signing) return failure('Failure_UnexpectedMessage', 'Not in signing mode');

        const transaction = (data.tx ?? {}) as Record<string, unknown>;

        switch (name) {
            case 'TxAckInput': {
                const input = transaction.input as RecordedInput;
                signing.inputs.push(input);

                return requestTransactionData('TXMETA', 0, input.prev_hash);
            }
            case 'TxAckPrevMeta': {
                const hash = signing.inputs.at(-1)?.prev_hash ?? '';
                signing.previous = {
                    hash,
                    inputsCount: transaction.inputs_count as number,
                    outputsCount: transaction.outputs_count as number,
                };

                return requestTransactionData('TXINPUT', 0, hash);
            }
            case 'TxAckPrevInput': {
                const { previous } = signing;
                if (!previous) return failure('Failure_ProcessError', 'No previous transaction');

                previous.inputsCount -= 1;

                return previous.inputsCount > 0
                    ? requestTransactionData('TXINPUT', 1, previous.hash)
                    : requestTransactionData('TXOUTPUT', 0, previous.hash);
            }
            case 'TxAckPrevOutput': {
                const { previous } = signing;
                if (!previous) return failure('Failure_ProcessError', 'No previous transaction');

                streamedPreviousOutputs.push(transaction.output as RecordedPreviousOutput);
                previous.outputsCount -= 1;

                return previous.outputsCount > 0
                    ? requestTransactionData('TXOUTPUT', 1, previous.hash)
                    : continueAfterInput();
            }
            case 'TxAckOutput':
                signing.outputs.push(transaction.output as RecordedOutput);

                return response('ButtonRequest', { code: 'ButtonRequest_ConfirmOutput' });
            case 'ButtonAck': {
                if (isOutputRejected) {
                    signing = undefined;

                    return failure('Failure_ActionCancelled', 'Signing cancelled by user');
                }

                if (signing.outputs.length < signing.outputsCount) {
                    return requestTransactionData('TXOUTPUT', signing.outputs.length);
                }

                if (!signing.isTransactionConfirmed) {
                    signing.isTransactionConfirmed = true;

                    return response('ButtonRequest', { code: 'ButtonRequest_SignTx' });
                }

                return finishSigning();
            }
            default:
                signing = undefined;

                return failure('Failure_UnexpectedMessage', 'Unknown message');
        }
    };

    const handleUnlocked = (call: TransportCallParams) => {
        const wallet = wallets[cachedPassphrase ?? ''];
        if (!wallet) return failure('Failure_ProcessError', 'Unknown wallet');

        switch (call.name) {
            case 'GetPublicKey':
                return response('PublicKey', wallet.getPublicKey(call.data.address_n as number[]));
            case 'SignTx':
                signing = {
                    inputsCount: call.data.inputs_count as number,
                    outputsCount: call.data.outputs_count as number,
                    inputs: [],
                    outputs: [],
                    isTransactionConfirmed: false,
                };

                return requestTransactionData('TXINPUT', 0);
            default:
                return failure('Failure_UnexpectedMessage', 'Unknown message');
        }
    };

    const transportCall: TransportCall = call => {
        calls.push(call);
        const { name, data } = call;

        switch (name) {
            case 'Initialize':
                // Old firmware forgets the passphrase on Initialize but keeps the PIN.
                signing = undefined;
                pendingCall = undefined;
                if (hasPassphraseProtection) cachedPassphrase = undefined;

                return response('Features', {
                    vendor: 'bitcointrezor.com',
                    major_version: 1,
                    minor_version: 6,
                    patch_version: 3,
                    device_id: null,
                    model: '1',
                    capabilities: [],
                    internal_model: 'T1B1' as PROTO.Features['internal_model'],
                    initialized: true,
                    pin_protection: pin !== undefined,
                    passphrase_protection: hasPassphraseProtection,
                    ...features,
                });
            case 'LockDevice':
                isPinCached = pin === undefined;
                if (hasPassphraseProtection) cachedPassphrase = undefined;

                return response('Success', { message: 'Session cleared' });
            case 'Cancel':
                signing = undefined;
                pendingCall = undefined;

                return failure('Failure_ActionCancelled', 'Cancelled');
            case 'PinMatrixAck':
                if (data.pin !== pin) {
                    pendingCall = undefined;

                    return failure('Failure_PinInvalid', 'Invalid PIN');
                }
                isPinCached = true;
                break;
            case 'PassphraseAck':
                cachedPassphrase = data.passphrase as string;
                break;
            default:
                if (signing) return handleSigning(call);
                pendingCall = call;
        }

        if (!pendingCall) return failure('Failure_UnexpectedMessage', 'Unknown message');

        if (!isPinCached) {
            return response('PinMatrixRequest', { type: 'PinMatrixRequestType_Current' });
        }

        if (cachedPassphrase === undefined) return response('PassphraseRequest', {});

        const unlockedCall = pendingCall;
        pendingCall = undefined;

        return handleUnlocked(unlockedCall);
    };

    return {
        transportCall,
        /** Every message the host sent, in order. */
        calls,
        streamedPreviousOutputs,
        countCalls: (name: string) => calls.filter(call => call.name === name).length,
    };
};

export type MockDevice = ReturnType<typeof mockDevice>;
