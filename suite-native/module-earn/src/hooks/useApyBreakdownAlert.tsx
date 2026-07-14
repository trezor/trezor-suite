import { useCallback } from 'react';

import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-api';
import { type Account } from '@suite-common/wallet-types';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { StablecoinYieldApyBreakdown } from '../components/StablecoinYieldApyBreakdown';

interface UseApyBreakdownAlertProps {
    account?: Account | null;
    vault?: YieldDtoV2 | null;
    apy: number | null;
}

export const useApyBreakdownAlert = ({ account, vault, apy }: UseApyBreakdownAlertProps) => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    const apyValue = apy && isApyAvailable(apy) ? `~${apy.toFixed(2)}%` : null;

    const onPress = useCallback(() => {
        if (!account || !vault) {
            return;
        }

        showAlert({
            title: vault.outputToken?.name ?? '',
            description: translate(
                'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.apyLabel',
                { apy: apyValue },
            ),
            appendix: (
                <StablecoinYieldApyBreakdown
                    networkSymbol={account.symbol}
                    rewards={vault.rewardRate.components}
                    underlyingToken={vault.token}
                    tokenSymbol={vault.token.symbol}
                />
            ),
            textAlign: 'center',
            titleSpacing: 'sp4',
            primaryButtonTitle: translate('generic.buttons.close'),
        });
    }, [account, vault, showAlert, translate, apyValue]);

    return { onPress };
};
