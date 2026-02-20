import { Translation } from '@suite/intl';
import { EarnAccountRef, EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

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
    accountRef?: EarnAccountRef;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const YieldEarnProviderConsentModal = ({
    onCancel,
    provider,
    accountRef,
    yieldId,
    tokenContractAddress,
}: YieldEarnProviderConsentModalProps) => {
    const selectedAccount = useSelector(selectSelectedAccount);

    const normalizedTokenContractAddress =
        selectedAccount && tokenContractAddress
            ? getContractAddressForNetworkSymbol(selectedAccount.symbol, tokenContractAddress)
            : undefined;

    const tokenSymbolFromAccount = selectedAccount?.tokens?.find(
        token =>
            normalizedTokenContractAddress !== undefined &&
            token.contract !== undefined &&
            getContractAddressForNetworkSymbol(selectedAccount.symbol, token.contract) ===
                normalizedTokenContractAddress,
    )?.symbol;

    const tokenCryptoId =
        selectedAccount && normalizedTokenContractAddress
            ? toTokenCryptoId(selectedAccount.symbol, normalizedTokenContractAddress)
            : undefined;

    const tokenSymbolFromTrading = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, tokenCryptoId),
    );
    const { proceedToSupply, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.Yield,
        onCancel,
        accountRef,
        yieldId,
        tokenContractAddress,
    });

    if (!selectedAccount) return null;

    const displaySymbol = getNetworkDisplaySymbol(selectedAccount.symbol);
    const supplySymbol = tokenSymbolFromAccount ?? tokenSymbolFromTrading ?? displaySymbol;
    const providerName = getEarnProviderName(provider);

    return (
        <EarnProviderConsentModalLayout
            heading={<Translation id="TR_EARN_SUPPLY_TOKEN" values={{ symbol: supplySymbol }} />}
            description={
                <Translation
                    id="TR_EARN_YOUR_SUPPLIED_FUNDS_MAINTAINED"
                    values={{ providerName }}
                />
            }
            banners={
                <YieldProviderConsentBanners
                    networkType={selectedAccount.networkType}
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
            onConfirm={proceedToSupply}
            onCancel={onCancelClick}
        >
            <VotingDelegations />
        </EarnProviderConsentModalLayout>
    );
};
