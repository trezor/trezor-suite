import {
    CONFIDENTIAL_QUERY_META,
    type QueryFunctionContext,
    chainQueryKeys,
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
 * Fee levels for a send draft, composed by the account's network. Each draft is its own query, so
 * a newer draft supersedes an older one instead of racing it, and returning to a draft reuses its
 * levels. Composing problems the user can fix come back as error levels, not as errors.
 */
export const useChainComposeFeeLevels = ({
    network,
    account,
    draft,
    context,
    enabled,
}: UseChainComposeFeeLevelsParams) => {
    const send = network?.send;
    const isEnabled = enabled && !!send && !!account && !!draft && !!context;

    return useQuery({
        queryKey:
            network && account
                ? chainQueryKeys.composeFeeLevels(
                      network.symbol,
                      network.backendType,
                      account.descriptor,
                      JSON.stringify([draft, context]),
                  )
                : chainQueryKeys.all('uncovered'),
        queryFn:
            isEnabled && send
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
