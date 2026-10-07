import type { ERRORS, GetTrezorConnectDep } from '@trezor/connect-common';
import {
    ChainSendError,
    type ChainSignedTransaction,
    type SignChainTransactionParams,
    toCoinSymbol,
} from '@trezor/network-module-suite-common-types';
import stellar from '@trezor/network-stellar/runtime';
import type { StellarTransaction } from '@trezor/network-stellar/types';

import { type StellarSendAppDeps, type StellarSendConfig, readStellarAccountMisc } from './types';

export type SignStellarTransactionDeps = GetTrezorConnectDep<
    'getAccountInfo' | 'stellarSignTransaction'
> &
    Pick<StellarSendAppDeps, 'getStellarBackendUrl'>;

export type SignStellarTransactionParams = SignChainTransactionParams & {
    config: StellarSendConfig;
};

export type SignStellarTransaction = (
    params: SignStellarTransactionParams,
) => Promise<ChainSignedTransaction>;

// `PROTO.StellarAssetType` by value, without Connect's protobuf runtime.
const NATIVE_ASSET = 0;
const ALPHANUM4_ASSET = 1;
const ALPHANUM12_ASSET = 2;

/**
 * Builds the payment, or prepares a Soroban token transfer against the backend, and signs it on
 * the device. The result is the envelope the backend accepts.
 */
export const createSignStellarTransaction =
    (deps: SignStellarTransactionDeps): SignStellarTransaction =>
    async ({ account, draft, precomposed, options, config }) => {
        const { symbol } = account;
        const connect = deps.getTrezorConnect();
        const { stellarSequence } = readStellarAccountMisc(account);
        const fail = (message: string, connectErrorCode?: ERRORS.ErrorCode) =>
            new ChainSendError('sign-failed', symbol, message, connectErrorCode);

        const { outputs: signOutputs } = draft;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstSignOutput: (typeof signOutputs)[number] = signOutputs[0];

        const { token: sentToken } = precomposed;

        if (sentToken?.standard === 'STELLAR-CONTRACT') {
            const backendUrl = deps.getStellarBackendUrl(symbol);
            if (!backendUrl) {
                throw fail('Not connected to a Stellar backend.');
            }

            // Composing already put the amount in the token's base units; converting the form
            // value again would have to repeat that conversion with the same decimals.
            const [composedOutput] = precomposed.outputs;
            if (!composedOutput) {
                throw fail('Nothing composed to sign.');
            }

            const { prepareContractTokenTransfer, serializeSignedTransaction } = await stellar();

            let prepared: StellarTransaction;
            try {
                ({ transaction: prepared } = await prepareContractTokenTransfer({
                    backendUrl,
                    descriptor: account.descriptor,
                    sequence: stellarSequence,
                    // What composing priced and the user approved: inclusion only, since
                    // preparing adds back the resource fee the displayed `fee` already carries.
                    inclusionFee: precomposed.feePerByte,
                    contract: sentToken.contract,
                    destination: firstSignOutput.address,
                    amount: String(composedOutput.amount),
                    isTestnet: config.isTestnet,
                }));
            } catch (error) {
                // Nothing worth asking the user to approve on the device.
                throw fail(error instanceof Error ? error.message : 'Simulation failed.');
            }

            const contractResponse = await connect.stellarSignTransaction({
                device: options.device,
                payment_req: options.paymentRequests?.[0],
                path: account.path,
                xdrBase64: prepared.toXdr(),
                testnet: config.isTestnet,
            });

            if (!contractResponse.success) {
                throw fail(contractResponse.error.message, contractResponse.error.code);
            }

            return {
                serializedTx: serializeSignedTransaction(
                    prepared,
                    account.descriptor,
                    contractResponse.payload.signature,
                ),
            };
        }

        const destinationAccount = await connect.getAccountInfo({
            descriptor: firstSignOutput.address,
            coin: toCoinSymbol(symbol),
            suppressBackupWarning: true,
        });

        const destinationActivated =
            destinationAccount.success && !destinationAccount.payload.empty;

        const { token } = precomposed;
        let asset: { type: 0 | 1 | 2; code?: string; issuer?: string };
        if (token) {
            const tokenContractParts = token.contract.split('-');
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const code: string = tokenContractParts[0];
            // @ts-expect-error: indexing with noUncheckedIndexedAccess
            const issuer: string = tokenContractParts[1];
            asset = {
                type: code.length <= 4 ? ALPHANUM4_ASSET : ALPHANUM12_ASSET,
                code,
                issuer,
            };
        } else {
            asset = { type: NATIVE_ASSET };
        }

        const { buildSendTransaction } = await stellar();

        const transaction = buildSendTransaction({
            descriptor: account.descriptor,
            sequence: stellarSequence,
            fee: precomposed.feePerByte,
            destinationActivated,
            destination: firstSignOutput.address,
            amount: firstSignOutput.amount,
            asset,
            memo: draft.destinationTag,
            isTestnet: config.isTestnet,
        });

        const response = await connect.stellarSignTransaction({
            device: options.device,
            payment_req: options.paymentRequests?.[0],
            path: account.path,
            xdrBase64: transaction.toXdr(),
            testnet: config.isTestnet,
        });

        if (!response.success) {
            throw fail(response.error.message, response.error.code);
        }

        const signature = Buffer.from(response.payload.signature, 'hex').toString('base64');
        transaction.addSignature(account.descriptor, signature);

        return { serializedTx: transaction.toEnvelope().toXdr('hex') };
    };
