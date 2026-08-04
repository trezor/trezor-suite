import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import {
    EarnFlow,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol , selectNetworkConfigDeps } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

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
    const networkConfigDeps = useServices(selectNetworkConfigDeps);
    const { proceedToEarnFlow, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.Stake,
        onCancel,
        account,
        networkSymbol: account.symbol,
        yieldContext,
    });

    const displaySymbol = getNetworkDisplaySymbol(networkConfigDeps, account.symbol);
    const providerName = getEarnProviderName(provider);

    return (
        <EarnProviderConsentModalLayout
            heading={<Translation id="TR_EARN_STAKE_TOKEN" values={{ symbol: displaySymbol }} />}
            description={
                <Translation id="TR_EARN_YOUR_STAKED_FUNDS_MAINTAINED" values={{ providerName }} />
            }
            banners={
                <StakingProviderConsentBanners
                    networkType={account.networkType}
                    displaySymbol={displaySymbol}
                />
            }
            consentText={
                <Translation
                    id="TR_EARN_CONSENT_TO_STAKING_WITH_PROVIDER"
                    values={{ providerName }}
                />
            }
            onConfirm={proceedToEarnFlow}
            onCancel={onCancelClick}
            networkType={account.networkType}
        >
            <VotingDelegations account={account} />
        </EarnProviderConsentModalLayout>
    );
};
