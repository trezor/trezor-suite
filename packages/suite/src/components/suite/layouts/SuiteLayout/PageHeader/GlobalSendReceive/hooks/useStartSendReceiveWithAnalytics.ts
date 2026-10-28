import { sendFormActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { setSendFormPrefill } from 'src/actions/suite/suiteActions';

import { useGoToWithAnalytics } from '../../useGoToWithAnalytics';
import { type GlobalSendTarget } from '../types';

const getAccountRouteParams = (account: Account) => ({
    symbol: account.symbol,
    accountIndex: account.index,
    accountType: account.accountType,
});

export const useStartSendReceiveWithAnalytics = () => {
    const { dispatch } = useServices(injectDispatch);
    const goToWithAnalytics = useGoToWithAnalytics();

    const startSend = ({ account, contractAddress }: GlobalSendTarget) => {
        dispatch(sendFormActions.removeDraft({ accountKey: account.key }));

        if (contractAddress !== undefined) {
            dispatch(setSendFormPrefill({ contractAddress }));
        }

        goToWithAnalytics({ routeName: 'wallet-send', params: getAccountRouteParams(account) });
    };

    const startReceive = (account: Account) => {
        goToWithAnalytics({ routeName: 'wallet-receive', params: getAccountRouteParams(account) });
    };

    return { startSend, startReceive };
};
