import { Translation } from '@suite/intl';
import {
    EarnFlow,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getEarnOpportunityKey, selectIsEarnOnboardingConfirmed } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';

import { EarnProviderConsentModalLayout } from './components/EarnProviderConsentModalLayout';
import { StakingProviderConsentBanners } from './components/StakingProviderConsentBanners';
import { useEarnProviderConsentActions } from './hooks/useEarnProviderConsentActions';
import { getEarnProviderName } from '../../utils/getEarnProviderName';
import { VotingDelegations } from '../shared/VotingDelegations/VotingDelegations';

interface StakingEarnProviderConsentModalProps {
    account: Account;
    onCancel: () => void;
    provider: EarnProvider;
    yieldContext?: EarnYieldContext;
}

export const StakingEarnProviderConsentModal = ({
    account,
    onCancel,
    provider,
    yieldContext,
}: StakingEarnProviderConsentModalProps) => {
    const { proceedToEarnFlow, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.Stake,
        onCancel,
        provider,
        account,
        networkSymbol: account.symbol,
        yieldContext,
    });

    const isConfirmed = useSelector(state =>
        selectIsEarnOnboardingConfirmed(
            state,
            account.key,
            getEarnOpportunityKey({ type: 'staking', provider }),
        ),
    );

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const providerName = getEarnProviderName(provider);

    return (
        <EarnProviderConsentModalLayout
            requiresAcknowledgement={!isConfirmed}
            heading={<Translation id="TR_EARN_STAKE_TOKEN" values={{ symbol: displaySymbol }} />}
            description={
                !isConfirmed && (
                    <Translation
                        id="TR_EARN_YOUR_STAKED_FUNDS_MAINTAINED"
                        values={{ providerName }}
                    />
                )
            }
            banners={
                !isConfirmed && (
                    <StakingProviderConsentBanners
                        networkType={account.networkType}
                        displaySymbol={displaySymbol}
                    />
                )
            }
            consentText={
                !isConfirmed && (
                    <Translation
                        id="TR_EARN_CONSENT_TO_STAKING_WITH_PROVIDER"
                        values={{ providerName }}
                    />
                )
            }
            onConfirm={proceedToEarnFlow}
            onCancel={onCancelClick}
            account={account}
        >
            <VotingDelegations account={account} />
        </EarnProviderConsentModalLayout>
    );
};
