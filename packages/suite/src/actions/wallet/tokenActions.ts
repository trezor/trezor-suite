import TrezorConnect, { AccountInfo, TokenInfo } from '@trezor/connect';
import { Account } from '@wallet-types';
import { Dispatch } from '@suite-types';
import * as accountUtils from '@suite-common/wallet-utils';
import * as notificationActions from '@suite-actions/notificationActions';
import * as accountActions from '@wallet-actions/accountActions';

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

export const fetchAccountTokens = async (
    account: Account,
    payloadTokens: AccountInfo['tokens'],
) => {
    const tokens: TokenInfo[] = [];
    // get list of tokens that are not included in default response, their balances need to be fetched
    const customTokens =
        account.tokens?.filter(t => !payloadTokens?.find(p => p.address === t.address)) ?? [];

    const promises = customTokens.map(t =>
        TrezorConnect.getAccountInfo({
            coin: account.symbol,
            descriptor: account.descriptor,
            details: 'tokenBalances',
            contractFilter: t.address,
        }),
    );

    const results = await Promise.all(promises);

    results.forEach(res => {
        if (res.success && res.payload.tokens) {
            tokens.push(...res.payload.tokens);
        }
    });

    return tokens;
};
