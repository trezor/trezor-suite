import { Translation } from '@suite/intl';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types/src/staking';
import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

import { EarnProviderConsentModalLayout } from './components/EarnProviderConsentModalLayout';
import { YieldProviderConsentBanners } from './components/YieldProviderConsentBanners';
import { useEarnProviderConsentActions } from './hooks/useEarnProviderConsentActions';
import { VotingDelegations } from '../../VotingDelegations/VotingDelegations';
import { getEarnProviderName } from '../../utils/getEarnProviderName';

interface YieldEarnProviderConsentModalProps {
    account: Account;
    onCancel: () => void;
    provider: EarnProvider;
    yieldId?: string;
    tokenContractAddress?: string;
}

export const YieldEarnProviderConsentModal = ({
    account,
    onCancel,
    provider,
    yieldId,
    tokenContractAddress,
}: YieldEarnProviderConsentModalProps) => {
    const normalizedTokenContractAddress = tokenContractAddress
        ? getContractAddressForNetworkSymbol(account.symbol, tokenContractAddress)
        : undefined;

    const tokenSymbolFromAccount = account.tokens?.find(
        token =>
            normalizedTokenContractAddress !== undefined &&
            token.contract !== undefined &&
            getContractAddressForNetworkSymbol(account.symbol, token.contract) ===
                normalizedTokenContractAddress,
    )?.symbol;

    const tokenCryptoId = normalizedTokenContractAddress
        ? toTokenCryptoId(account.symbol, normalizedTokenContractAddress)
        : undefined;

    const tokenSymbolFromTrading = useSelector(state =>
        selectTradingCoinSymbolByCryptoId(state, tokenCryptoId),
    );
    const { proceedToSupply, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.Yield,
        onCancel,
        account,
        networkSymbol: account.symbol,
        yieldId,
        tokenContractAddress,
    });
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
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
            onConfirm={proceedToSupply}
            onCancel={onCancelClick}
            networkType={account.networkType}
        >
            <VotingDelegations account={account} />
        </EarnProviderConsentModalLayout>
    );
};
