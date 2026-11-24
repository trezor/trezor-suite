import { AssetSymbol } from '@suite/assets';
import { Translation } from '@suite/intl';
import { createAssetId } from '@suite-common/assets';
import {
    EarnFlow,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { getEarnOpportunityKey, selectIsEarnOnboardingConfirmed } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from '#src/hooks/suite/useSelector';

import { EarnProviderConsentModalLayout } from './components/EarnProviderConsentModalLayout';
import { StakingProviderConsentBanners } from './components/StakingProviderConsentBanners';
import { useEarnProviderConsentActions } from './hooks/useEarnProviderConsentActions';
import { getEarnProviderName } from '../../utils/getEarnProviderName';

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

    const providerName = getEarnProviderName(provider);

    return (
        <EarnProviderConsentModalLayout
            requiresAcknowledgement={!isConfirmed}
            heading={
                <Translation
                    id="TR_EARN_STAKE_TOKEN"
                    values={{
                        symbol: (
                            <AssetSymbol
                                assetId={createAssetId({ networkSymbol: account.symbol })}
                            />
                        ),
                    }}
                />
            }
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
                    <StakingProviderConsentBanners account={account} flow={EarnFlow.Stake} />
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
        />
    );
};
