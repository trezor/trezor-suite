import { Translation } from '@suite/intl';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

import { EarnProviderConsentModalLayout } from './components/EarnProviderConsentModalLayout';
import { StakingProviderConsentBanners } from './components/StakingProviderConsentBanners';
import { useEarnProviderConsentActions } from './hooks/useEarnProviderConsentActions';
import { VotingDelegations } from '../../VotingDelegations/VotingDelegations';
import { getEarnProviderName } from '../../utils/getEarnProviderName';

interface UpdateEarnProviderConsentModalProps {
    account: Account;
    onCancel: () => void;
    provider: EarnProvider;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const UpdateEarnProviderConsentModal = ({
    account,
    onCancel,
    provider,
    yieldId,
    tokenContractAddress,
}: UpdateEarnProviderConsentModalProps) => {
    const { proceedToSupply, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.UpdateProvider,
        onCancel,
        includeVotingDelegation: true,
        account,
        networkSymbol: account.symbol,
        yieldId,
        tokenContractAddress,
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
            onConfirm={proceedToSupply}
            onCancel={onCancelClick}
            networkType={account.networkType}
        >
            <VotingDelegations account={account} />
        </EarnProviderConsentModalLayout>
    );
};
