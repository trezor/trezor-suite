import {
    CONFIDENTIAL_QUERY_META,
    type QueryFunctionContext,
    chainQueryKeys,
    queryOptions,
    skipToken,
    useQuery,
} from '@suite-common/react-query';
import type {
    ChainComposeContext,
    ChainNetwork,
    ChainSendAccount,
    ChainSendDraft,
} from '@trezor/network-module-suite-common-types';

// Fee levels for a draft are worth keeping only while the user might return to the same draft.
const COMPOSE_GC_TIME_MS = 30_000;

export type ChainComposeFeeLevelsQueryParams = {
    network: ChainNetwork;
    account: ChainSendAccount;
    draft: ChainSendDraft;
    context: ChainComposeContext;
};

/**
 * One draft's fee levels, composed by the account's network. Composing problems the user can fix
 * come back as error levels, not as errors.
 */
export const getChainComposeFeeLevelsQueryOptions = ({
    network,
    account,
    draft,
    context,
}: ChainComposeFeeLevelsQueryParams) => {
    const { send } = network;

    return queryOptions({
        queryKey: chainQueryKeys.composeFeeLevels(
            network.symbol,
            network.backendType,
            account.descriptor,
            // The account's balances and UTXOs are inputs too; the key never leaves memory.
            JSON.stringify([account, draft, context]),
        ),
        queryFn: send
            ? ({ signal }: QueryFunctionContext) =>
                  send.composeFeeLevels({ account, draft, context, signal })
            : skipToken,
        staleTime: 0,
        gcTime: COMPOSE_GC_TIME_MS,
        retry: false,
        refetchOnWindowFocus: false,
        meta: CONFIDENTIAL_QUERY_META,
    });
};

export type UseChainComposeFeeLevelsParams = {
    /** `undefined` while the account's network is not selected. */
    network: ChainNetwork | undefined;
    account: ChainSendAccount | undefined;

    /** `undefined` while there is nothing to compose, e.g. while the user is still typing. */
    draft: ChainSendDraft | undefined;
    context: ChainComposeContext | undefined;
    enabled: boolean;
};

/**
 * Fee levels for a send draft. Each draft is its own query, so a newer draft supersedes an older
 * one instead of racing it, and returning to a draft reuses its levels.
 */
export const useChainComposeFeeLevels = ({
    network,
    account,
    draft,
    context,
    enabled,
}: UseChainComposeFeeLevelsParams) => {
    const isEnabled = enabled && !!network?.send && !!account && !!draft && !!context;

    return useQuery(
        isEnabled && network && account && draft && context
            ? getChainComposeFeeLevelsQueryOptions({ network, account, draft, context })
            : { queryKey: chainQueryKeys.all('uncovered'), queryFn: skipToken },
    );
};
