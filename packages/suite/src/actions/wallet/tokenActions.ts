import { TokenInfo } from '@trezor/connect';
import { Account } from '@wallet-types';
import { Dispatch } from '@suite-types';
import * as accountUtils from '@suite-common/wallet-utils';
import * as notificationActions from '@suite-actions/notificationActions';
import { accountActions } from '@suite-common/wallet-core';

export const addToken = (account: Account, tokenInfo: TokenInfo[]) => (dispatch: Dispatch) => {
    dispatch(
        accountActions.updateAccount({
            ...account,
            tokens: (account.tokens || []).concat(accountUtils.enhanceTokens(tokenInfo)),
        }),
    );

    dispatch(
        notificationActions.addToast({
            type: 'add-token-success',
        }),
    );
};
