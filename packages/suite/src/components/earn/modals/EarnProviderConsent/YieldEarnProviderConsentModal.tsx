import { Translation } from '@suite/intl';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';

import { useSelector } from 'src/hooks/suite';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';

import { EarnProviderConsentModalLayout } from './components/EarnProviderConsentModalLayout';
import { YieldProviderConsentBanners } from './components/YieldProviderConsentBanners';
import { useEarnProviderConsentActions } from './hooks/useEarnProviderConsentActions';
import { getEarnProviderName } from './utils/earnProviderConsentUtils';
import { VotingDelegations } from '../../VotingDelegations/VotingDelegations';

interface YieldEarnProviderConsentModalProps {
    onCancel: () => void;
    provider: EarnProvider;
}

export const YieldEarnProviderConsentModal = ({
    onCancel,
    provider,
}: YieldEarnProviderConsentModalProps) => {
    const account = useSelector(selectSelectedAccount);
    const { proceedToStaking, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.Yield,
        onCancel,
    });

    if (!account) return null;

    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const providerName = getEarnProviderName(provider);

    return (
        <EarnProviderConsentModalLayout
            heading={<Translation id="TR_EARN_SUPPLY_TOKEN" values={{ symbol: displaySymbol }} />}
            description={
                <Translation
                    id="TR_EARN_YOUR_SUPPLIED_FUNDS_MAINTAINED"
                    values={{ providerName }}
                />
            }
            banners={
                <YieldProviderConsentBanners
                    networkType={account.networkType}
                    displaySymbol={displaySymbol}
                    providerName={providerName}
                />
            }
            consentText={
                <Translation
                    id="TR_EARN_CONSENT_TO_SUPPLY_WITH_PROVIDER"
                    values={{ providerName }}
                />
            }
            onConfirm={proceedToStaking}
            onCancel={onCancelClick}
        >
            <VotingDelegations />
        </EarnProviderConsentModalLayout>
    );
};
