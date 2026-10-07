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
import { BigNumber } from '@trezor/utils';

import type { RippleSendConfig } from './types';

export type ComposeRippleFeeLevelsDeps = GetTrezorConnectDep<'getAccountInfo'>;

export type ComposeRippleFeeLevelsParams = ComposeFeeLevelsParams & { config: RippleSendConfig };

export type ComposeRippleFeeLevels = (
    params: ComposeRippleFeeLevelsParams,
) => Promise<PrecomposedLevels>;

/**
 * XRP fee levels. Paying an account that does not exist yet must at least fund its reserve, which
 * the recipient's account info tells.
 */
export const createComposeRippleFeeLevels =
    (deps: ComposeRippleFeeLevelsDeps): ComposeRippleFeeLevels =>
    async ({ account, draft, context, config }) => {
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

        let requiredAmount: BigNumber | undefined;
        // additional check if recipient address is empty
        // it will set requiredAmount to recipient account reserve value
        if (address) {
            const accountResponse = await deps.getTrezorConnect().getAccountInfo({
                descriptor: address,
                coin: toCoinSymbol(account.symbol),
                suppressBackupWarning: true,
                stellarClassicTokens: undefined,
            });
            if (accountResponse.success && accountResponse.payload.empty) {
                requiredAmount = new BigNumber(accountResponse.payload.misc!.reserve!);
            }
        }

        return composeAccountTransferLevels({
            availableBalance: account.availableBalance,
            output,
            feeInfo: context.feeInfo,
            composeLevels: predefinedLevels,
            requiredAmount,
            token: tokenInfo,
            canLowerFee: true,
            decimals,
            coinDecimals: config.decimals,
            displaySymbol: config.displaySymbol,
        });
    };
