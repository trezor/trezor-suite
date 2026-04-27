import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import {
    EarnFlow,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { EarnProviderConsentModalLayout } from './components/EarnProviderConsentModalLayout';
import { YieldProviderConsentBanners } from './components/YieldProviderConsentBanners';
import { useEarnProviderConsentActions } from './hooks/useEarnProviderConsentActions';
import { getEarnProviderName } from '../../utils/getEarnProviderName';
import { VotingDelegations } from '../shared/VotingDelegations/VotingDelegations';

interface YieldEarnProviderConsentModalProps {
    account: Account;
    onCancel: () => void;
    provider: EarnProvider;
    yieldContext?: EarnYieldContext;
}

export const YieldEarnProviderConsentModal = ({
    account,
    onCancel,
    provider,
    yieldContext,
}: YieldEarnProviderConsentModalProps) => {
    const analytics = useAnalytics();

    const tokenContractAddress = yieldContext?.tokenContractAddress;
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
        yieldContext,
    });
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const supplySymbol = tokenSymbolFromAccount ?? tokenSymbolFromTrading ?? displaySymbol;
    const providerName = getEarnProviderName(provider);

    const handleOnConfirm = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'supply-morpho-modal',
                to: 'supply-form',
                networkSymbol: account.symbol,
                contractAddress: yieldContext?.tokenContractAddress,
            },
        });

        proceedToSupply();
    };

    const handleOnCancel = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'cancel',
                from: 'supply-morpho-modal',
                to: 'supply-morpho-modal',
                networkSymbol: account.symbol,
                contractAddress: yieldContext?.tokenContractAddress,
            },
        });

        onCancelClick();
    };

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
                    displaySymbol={supplySymbol}
                    providerName={providerName}
                />
            }
            consentText={
                <Translation
                    id="TR_EARN_CONSENT_TO_SUPPLY_WITH_PROVIDER"
                    values={{ providerName }}
                />
            }
            onConfirm={handleOnConfirm}
            onCancel={handleOnCancel}
            networkType={account.networkType}
        >
            <VotingDelegations account={account} />
        </EarnProviderConsentModalLayout>
    );
};
