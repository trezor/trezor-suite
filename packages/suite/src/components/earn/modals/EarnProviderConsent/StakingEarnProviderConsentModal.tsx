import { Translation } from '@suite/intl';
import { EarnAccountRef, EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { EarnProviderConsentModalLayout } from './components/EarnProviderConsentModalLayout';
import { StakingProviderConsentBanners } from './components/StakingProviderConsentBanners';
import { useEarnProviderConsentActions } from './hooks/useEarnProviderConsentActions';
import { getEarnProviderName } from './utils/earnProviderConsentUtils';
import { VotingDelegations } from '../../VotingDelegations/VotingDelegations';

interface StakingEarnProviderConsentModalProps {
    onCancel: () => void;
    provider: EarnProvider;
    accountRef?: EarnAccountRef;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const StakingEarnProviderConsentModal = ({
    onCancel,
    provider,
    accountRef,
    yieldId,
    tokenContractAddress,
}: StakingEarnProviderConsentModalProps) => {
    const selectedAccount = useSelector(selectSelectedAccount);
    const { proceedToSupply, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.Stake,
        onCancel,
        accountRef,
        yieldId,
        tokenContractAddress,
    });

    if (!selectedAccount) return null;

    const displaySymbol = getNetworkDisplaySymbol(selectedAccount.symbol);
    const providerName = getEarnProviderName(provider);

    return (
        <EarnProviderConsentModalLayout
            heading={<Translation id="TR_EARN_STAKE_TOKEN" values={{ symbol: displaySymbol }} />}
            description={
                <Translation id="TR_EARN_YOUR_STAKED_FUNDS_MAINTAINED" values={{ providerName }} />
            }
            banners={
                <StakingProviderConsentBanners
                    networkType={selectedAccount.networkType}
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
        >
            <VotingDelegations />
        </EarnProviderConsentModalLayout>
    );
};
