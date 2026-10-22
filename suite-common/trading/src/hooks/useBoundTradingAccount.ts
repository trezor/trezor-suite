import { useEffect, useState } from 'react';

import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { tradingActions } from '../reducers/tradingCommonReducer';
import { type TradingType } from '../types';

type BoundTradingAccount = {
    type: TradingType;
    accountKey: Account['key'];
};

export const useBoundTradingAccount = (type: TradingType, account: Account) => {
    const [bound, setBound] = useState<BoundTradingAccount>();
    const { dispatch } = useServices(injectDispatch);
    const accountKey = account.key;

    useEffect(() => {
        dispatch(tradingActions.bindTradingAccount({ type, accountKey }));
        setBound({ type, accountKey });
    }, [accountKey, dispatch, type]);

    return bound?.type === type && bound.accountKey === accountKey;
};
