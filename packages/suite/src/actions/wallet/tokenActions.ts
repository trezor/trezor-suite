import { TokenInfo } from '@trezor/connect';
import { Account } from 'src/types/wallet';
import { Dispatch } from 'src/types/suite';
import * as accountUtils from '@suite-common/wallet-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { accountsActions } from '@suite-common/wallet-core';

export const addToken = (account: Account, tokenInfo: TokenInfo[]) => (dispatch: Dispatch) => {
    dispatch(
        accountsActions.updateAccount({
            ...account,
            tokens: (account.tokens || []).concat(accountUtils.enhanceTokens(tokenInfo)),
        }),
    );

    dispatch(
        notificationsActions.addToast({
            type: 'add-token-success',
        }),
    );
};
