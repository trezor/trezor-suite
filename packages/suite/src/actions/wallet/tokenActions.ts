import { notificationsActions } from '@suite-common/toast-notifications';
import { accountsActions } from '@suite-common/wallet-core';
import * as accountUtils from '@suite-common/wallet-utils';
import { type TokenInfo } from '@trezor/connect';

import { type Dispatch } from 'src/types/suite';
import { type Account } from 'src/types/wallet';

export const addToken =
    (account: Account, tokenInfo: TokenInfo[], options?: { showSuccessToast?: boolean }) =>
    (dispatch: Dispatch) => {
        dispatch(
            accountsActions.updateAccount({
                ...account,
                tokens: (account.tokens || []).concat(accountUtils.enhanceTokens(tokenInfo)),
            }),
        );

        // Auto-tracking flows (e.g. wrapping a native token) add a token as a side effect and show
        // their own toast, so the generic success toast can be suppressed to avoid double toasts.
        if (options?.showSuccessToast ?? true) {
            dispatch(
                notificationsActions.addToast({
                    type: 'add-token-success',
                }),
            );
        }
    };
