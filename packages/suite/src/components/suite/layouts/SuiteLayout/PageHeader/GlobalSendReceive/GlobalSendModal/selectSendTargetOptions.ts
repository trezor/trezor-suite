import {
    type FiatRatesRootState,
    type WalletSettingsRootState,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { enhanceTokensWithRates } from '../../../../../../../utils/wallet/tokenUtils';
import { type AccountWithTokensOption } from '../../../../../asset-picker/types';
import { createAccountOption, createTokenOption } from '../../../../../asset-picker/utils';
import { type GlobalSendTarget } from '../types';

export type SendTargetOptionsState = FiatRatesRootState & WalletSettingsRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SendTargetOptionsState>();

export const selectSendTargetOptions = createMemoizedSelector(
    [
        selectCurrentFiatRates,
        selectBaseCurrency,
        (_state: SendTargetOptionsState, targets: readonly GlobalSendTarget[] | undefined) =>
            targets,
    ],
    (fiatRates, baseCurrencyCode, targets): AccountWithTokensOption[] | undefined =>
        targets?.flatMap(({ account, contractAddress }): AccountWithTokensOption[] => {
            if (contractAddress === undefined) {
                return [createAccountOption(account)];
            }

            const heldTokens = account.tokens?.filter(token => token.contract === contractAddress);

            return enhanceTokensWithRates(
                heldTokens,
                baseCurrencyCode,
                account.symbol,
                fiatRates,
            ).map(tokenWithRates => createTokenOption(account, tokenWithRates));
        }),
);
