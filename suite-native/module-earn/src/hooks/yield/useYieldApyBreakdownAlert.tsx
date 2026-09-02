import { useCallback } from 'react';

import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';

import { YieldApyBreakdown } from '../../components/yield/YieldApyBreakdown';

interface UseYieldApyBreakdownAlertProps {
    account?: Account | null;
    vault?: YieldDtoV2 | null;
}

export const useYieldApyBreakdownAlert = ({ account, vault }: UseYieldApyBreakdownAlertProps) => {
    const { showAlert } = useAlert();
    const { analytics } = useServices(selectNativeAnalyticsDep);

    const show = useCallback(() => {
        if (!account || !vault?.outputToken?.name) return;

        analytics.report({
            type: events.yieldInteractionEvent.name,
            payload: {
                element: 'apy-tooltip',
                networkSymbol: account.symbol,
                vaultId: vault.id,
            },
        });

        showAlert({
            title: vault.outputToken.name,
            appendix: (
                <YieldApyBreakdown
                    networkSymbol={account.symbol}
                    rewards={vault.rewardRate.components}
                    underlyingToken={vault.token}
                    tokenSymbol={vault.token.symbol}
                />
            ),
            textAlign: 'center',
            titleSpacing: 'sp4',
            primaryButtonTitle: <Translation id="generic.buttons.close" />,
            isClosableByOutsidePress: true,
        });
    }, [account, vault, analytics, showAlert]);

    return { show };
};
