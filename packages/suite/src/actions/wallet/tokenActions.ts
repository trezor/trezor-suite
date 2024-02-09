import { TokenInfo } from '@trezor/connect';
import { Account } from 'src/types/wallet';
import { Dispatch } from 'src/types/suite';
import * as accountUtils from '@suite-common/wallet-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { accountsActions, updateFiatRatesThunk } from '@suite-common/wallet-core';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';
import { FiatCurrencyCode } from '@suite-common/suite-config';

export const addToken =
    (account: Account, tokenInfo: TokenInfo[], localCurrency: FiatCurrencyCode) =>
    (dispatch: Dispatch) => {
        dispatch(
            accountsActions.updateAccount({
                ...account,
                tokens: (account.tokens || []).concat(accountUtils.enhanceTokens(tokenInfo)),
            }),
        );

        dispatch(
            updateFiatRatesThunk({
                ticker: {
                    symbol: account.symbol,
                    tokenAddress: tokenInfo[0].contract as TokenAddress,
                },
                localCurrency,
                rateType: 'current',
                lastSuccessfulFetchTimestamp: Date.now() as Timestamp,
                forceFetchToken: true,
            }),
        );

        dispatch(
            notificationsActions.addToast({
                type: 'add-token-success',
            }),
        );
    };
