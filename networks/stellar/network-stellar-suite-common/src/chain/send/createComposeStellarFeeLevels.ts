import type { AccountInfo, TokenInfo } from '@trezor/blockchain-link-types';
import type { GetTrezorConnectDep } from '@trezor/connect-common';
import {
    ChainSendError,
    type ComposeFeeLevelsParams,
    type PrecomposedLevels,
    composeAccountTransferLevels,
    getExternalComposeOutput,
    getRequestedFeeLevels,
    toCoinSymbol,
} from '@trezor/network-module-suite-common-types';
import stellar from '@trezor/network-stellar/runtime';
import { BigNumber } from '@trezor/utils';

import { type StellarSendAppDeps, type StellarSendConfig, readStellarAccountMisc } from './types';

export type ComposeStellarFeeLevelsDeps = GetTrezorConnectDep<'getAccountInfo'> &
    Pick<StellarSendAppDeps, 'getStellarBackendUrl' | 'resolveStellarContractId'>;

export type ComposeStellarFeeLevelsParams = ComposeFeeLevelsParams & { config: StellarSendConfig };

export type ComposeStellarFeeLevels = (
    params: ComposeStellarFeeLevelsParams,
) => Promise<PrecomposedLevels>;

type StellarComposeError =
    'TR_STELLAR_SIMULATION_FAILED' | 'TR_STELLAR_RECIPIENT_MISSING_TRUSTLINE';

// Shown under the amount field; a rejected compose would only disable the button.
const stellarErrorLevels = (
    levels: { label: string }[],
    error: StellarComposeError,
    values: Record<string, string>,
): PrecomposedLevels => {
    const failed = { type: 'error', error, errorMessage: { id: error, values } } as const;

    return Object.fromEntries(levels.map(level => [level.label, failed]));
};

/**
 * Stellar fee levels. Paying an account that does not exist yet must fund its reserve, a token
 * needs the recipient's trustline, and a Soroban token transfer also owes a resource fee only a
 * simulation can tell.
 */
export const createComposeStellarFeeLevels = (
    deps: ComposeStellarFeeLevelsDeps,
): ComposeStellarFeeLevels => {
    /**
     * A classic asset can only be paid to an account holding its trustline, and so can its Stellar
     * Asset Contract; the sender cannot create the trustline. Its issuer holds no trustline to its
     * own asset and needs none: paying it back is how the asset is redeemed. A native SEP-41 token
     * needs no trustline at all, so an unresolvable contract id is left to the simulation.
     */
    const isRecipientMissingTrustline = async (recipient: AccountInfo, token: TokenInfo) => {
        const trustlines = recipient.tokens ?? [];
        const { computeSorobanAssetContractId, parseClassicAssetContract } = await stellar();
        const isIssuer = (asset?: { assetIssuer: string }) =>
            !!asset && asset.assetIssuer === recipient.descriptor;

        if (token.standard !== 'STELLAR-CONTRACT') {
            if (isIssuer(parseClassicAssetContract(token.contract))) {
                return false;
            }

            return (
                recipient.empty || !trustlines.some(({ contract }) => contract === token.contract)
            );
        }

        const heldSacIds = trustlines.flatMap(({ contract }) => {
            try {
                return [computeSorobanAssetContractId(contract).sorobanAssetContractId];
            } catch {
                return [];
            }
        });
        if (heldSacIds.includes(token.contract)) {
            return false;
        }

        const wrappedAsset = await deps.resolveStellarContractId(token.contract);

        return !!wrappedAsset && !isIssuer(wrappedAsset);
    };

    return async ({ account, draft, context, config }) => {
        const fail = (message: string) =>
            new ChainSendError('compose-failed', account.symbol, message);

        const composeOutputs = getExternalComposeOutput(draft, account, config);
        if (!composeOutputs) throw fail('Unable to compose output.');

        const { output, tokenInfo, decimals } = composeOutputs;
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const firstOutput: (typeof draft.outputs)[number] = draft.outputs[0];
        const { address } = firstOutput;

        const predefinedLevels = getRequestedFeeLevels(context.feeInfo, draft);

        // Fee info without any level cannot be composed, and the custom level fallback
        // reads the last predefined level, which would throw on an empty list.
        if (predefinedLevels.length === 0) throw fail('No fee levels available.');

        // A Soroban transfer also owes a resource fee that only a simulation can tell, and it is
        // priced in the Soroban lane rather than the classic one `feeInfo` carries.
        let resourceFee: string | undefined;
        let sorobanInclusionFee: string | undefined;
        const isContractTokenTransfer = tokenInfo?.standard === 'STELLAR-CONTRACT';
        if (isContractTokenTransfer) {
            // The output amount is already in base units; the balance is kept in units.
            const amountToSend =
                output.type === 'send-max' || output.type === 'send-max-noaddress'
                    ? new BigNumber(tokenInfo.balance ?? '0')
                          .shiftedBy(tokenInfo.decimals)
                          .toFixed()
                    : output.amount;

            const backendUrl = deps.getStellarBackendUrl(account.symbol);

            // Simulating needs a recipient; until then only the inclusion half can be priced.
            if (address && backendUrl && new BigNumber(amountToSend).isGreaterThan(0)) {
                const { prepareContractTokenTransfer } = await stellar();

                try {
                    ({ resourceFee, inclusionFee: sorobanInclusionFee } =
                        await prepareContractTokenTransfer({
                            backendUrl,
                            descriptor: account.descriptor,
                            sequence: readStellarAccountMisc(account).stellarSequence,
                            contract: tokenInfo.contract,
                            destination: address,
                            amount: amountToSend,
                            isTestnet: config.isTestnet,
                        }));
                } catch (error) {
                    const [reason = 'Simulation failed.'] = (
                        error instanceof Error ? error.message : String(error)
                    ).split('\n');

                    return stellarErrorLevels(predefinedLevels, 'TR_STELLAR_SIMULATION_FAILED', {
                        reason: reason.slice(0, 200),
                    });
                }
            } else if (backendUrl) {
                const { getStellarRpcServer, readSorobanInclusionFee } = await stellar();

                // A placeholder priced in the wrong market is still worth avoiding.
                sorobanInclusionFee = await readSorobanInclusionFee(
                    getStellarRpcServer(backendUrl),
                ).catch(() => undefined);
            }
        }

        // The envelope has to be built with the fee the user approved, so a level the backend
        // priced classically is repriced. A custom level is the user's own bid.
        const composeLevels =
            sorobanInclusionFee === undefined
                ? predefinedLevels
                : predefinedLevels.map(level =>
                      level.label === 'custom'
                          ? level
                          : { ...level, feePerUnit: sorobanInclusionFee },
                  );

        let requiredAmount: BigNumber | undefined;
        // additional check if recipient address is empty
        // it will set requiredAmount to recipient account reserve value
        if (address) {
            const accountResponse = await deps.getTrezorConnect().getAccountInfo({
                descriptor: address,
                coin: toCoinSymbol(account.symbol),
                suppressBackupWarning: true,
                stellarClassicTokens:
                    tokenInfo?.standard === 'STELLAR-CLASSIC' ? [tokenInfo.contract] : undefined,
            });
            if (accountResponse.success) {
                if (tokenInfo) {
                    if (await isRecipientMissingTrustline(accountResponse.payload, tokenInfo)) {
                        return stellarErrorLevels(
                            predefinedLevels,
                            'TR_STELLAR_RECIPIENT_MISSING_TRUSTLINE',
                            { symbol: tokenInfo.symbol ?? tokenInfo.contract },
                        );
                    }
                } else if (accountResponse.payload.empty) {
                    requiredAmount = new BigNumber(accountResponse.payload.misc!.reserve!);
                }
            }
        }

        return composeAccountTransferLevels({
            availableBalance: account.availableBalance,
            output,
            feeInfo: context.feeInfo,
            composeLevels,
            requiredAmount,
            token: tokenInfo,
            resourceFee,
            // The ladder walks the inclusion fee down a stroop at a time, while the resource fee
            // it cannot touch is orders of magnitude larger.
            canLowerFee: !isContractTokenTransfer,
            decimals,
            coinDecimals: config.decimals,
            displaySymbol: config.displaySymbol,
        });
    };
};
