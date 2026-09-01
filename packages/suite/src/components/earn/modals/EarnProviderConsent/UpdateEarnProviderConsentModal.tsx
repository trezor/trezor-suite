import { Translation } from '@suite/intl';
import {
    EarnFlow,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';

import { EarnProviderConsentModalLayout } from './components/EarnProviderConsentModalLayout';
import { StakingProviderConsentBanners } from './components/StakingProviderConsentBanners';
import { useEarnProviderConsentActions } from './hooks/useEarnProviderConsentActions';
import { getEarnProviderName } from '../../utils/getEarnProviderName';
import { VotingDelegations } from '../shared/VotingDelegations/VotingDelegations';

interface UpdateEarnProviderConsentModalProps {
    account: Account;
    onCancel: () => void;
    provider: EarnProvider;
    yieldContext?: EarnYieldContext;
}

export const UpdateEarnProviderConsentModal = ({
    account,
    onCancel,
    provider,
    yieldContext,
}: UpdateEarnProviderConsentModalProps) => {
    const { proceedToEarnFlow, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.UpdateProvider,
        onCancel,
        includeVotingDelegation: true,
        account,
        networkSymbol: account.symbol,
        yieldContext,
    });

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const providerName = getEarnProviderName(provider);

    return (
        <EarnProviderConsentModalLayout
            heading={<Translation id="TR_EARN_UPDATE_PROVIDER" />}
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
            account={account}
        >
            <VotingDelegations account={account} />
        </EarnProviderConsentModalLayout>
    );
};
