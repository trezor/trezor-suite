import { sendFormActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { setSendFormPrefill } from '#src/actions/suite/suiteActions';
import { type SendFormPrefill } from '#src/reducers/suite/sendFormPrefill';

import { useGoToWithAnalytics } from '../../useGoToWithAnalytics';
import { type GlobalSendTarget, type SendTargetNFT } from '../types';

const getAccountRouteParams = (account: Account) => ({
    symbol: account.symbol,
    accountIndex: account.index,
    accountType: account.accountType,
});

export const useStartSendReceiveWithAnalytics = () => {
    const { dispatch } = useServices(injectDispatch);
    const goToWithAnalytics = useGoToWithAnalytics();

    const goToSend = (account: Account, prefill: SendFormPrefill | undefined) => {
        dispatch(sendFormActions.removeDraft({ accountKey: account.key }));

        if (prefill !== undefined) {
            dispatch(setSendFormPrefill(prefill));
        }

        goToWithAnalytics({ routeName: 'wallet-send', params: getAccountRouteParams(account) });
    };

    const startSend = ({ account, contractAddress }: GlobalSendTarget) =>
        goToSend(
            account,
            contractAddress === undefined ? undefined : { type: 'token', contractAddress },
        );

    const startNFTSend = ({ account, contractAddress, tokenId }: SendTargetNFT) =>
        goToSend(account, { type: 'nft', contractAddress, tokenId });

    const startReceive = (account: Account) => {
        goToWithAnalytics({ routeName: 'wallet-receive', params: getAccountRouteParams(account) });
    };

    return { startSend, startNFTSend, startReceive };
};
