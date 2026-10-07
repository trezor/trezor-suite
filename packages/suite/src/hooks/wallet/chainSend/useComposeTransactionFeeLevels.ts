import { useCallback } from 'react';

import { isFulfilled } from '@reduxjs/toolkit';

import { getChainComposeFeeLevelsQueryOptions } from '@suite-common/chain-data';
import { useServices } from '@suite-common/dependency-injection';
import { useQueryClient } from '@suite-common/react-query';
import { injectDispatch, injectGetState } from '@suite-common/redux-utils';
import {
    composeSendFormTransactionFeeLevelsThunk,
    notifyChainComposeFailure,
    notifyChainComposeLevels,
    selectWalletChainComposeContext,
} from '@suite-common/wallet-core';
import {
    type ComposeActionContext,
    type FormState,
    type PrecomposedLevels,
    type PrecomposedLevelsCardano,
} from '@suite-common/wallet-types';
import { ChainSendError } from '@trezor/network-module-suite-common-types';

import { type AppState } from 'src/types/suite';

import { useGetSendChainNetwork } from './useGetSendChainNetwork';

/**
 * Composes a form's fee levels: `undefined` when composing failed outright, which was reported to
 * the user where it should be.
 *
 * With the `queryChainData` flag on, the account's chain network composes through the query cache,
 * so the same draft is composed once while it is in flight. Otherwise the wallet's thunk composes.
 */
export const useComposeTransactionFeeLevels = () => {
    const { dispatch, getState } = useServices(injectDispatch, injectGetState);
    const queryClient = useQueryClient();
    const getSendChainNetwork = useGetSendChainNetwork();

    return useCallback(
        async (
            formState: FormState,
            composeContext: ComposeActionContext,
        ): Promise<PrecomposedLevels | PrecomposedLevelsCardano | undefined> => {
            const { account } = composeContext;
            const network = getSendChainNetwork(account);

            if (!network) {
                const result = await dispatch(
                    composeSendFormTransactionFeeLevelsThunk({ formState, composeContext }),
                );

                return isFulfilled(result) ? result.payload : undefined;
            }

            try {
                const levels = await queryClient.fetchQuery(
                    getChainComposeFeeLevelsQueryOptions({
                        network,
                        account,
                        draft: formState,
                        context: selectWalletChainComposeContext(
                            getState() as AppState,
                            composeContext,
                        ),
                    }),
                );
                notifyChainComposeLevels(dispatch, account, levels);

                return levels;
            } catch (error) {
                if (error instanceof ChainSendError) {
                    notifyChainComposeFailure(dispatch, account, error);
                }

                return undefined;
            }
        },
        [dispatch, getState, getSendChainNetwork, queryClient],
    );
};
