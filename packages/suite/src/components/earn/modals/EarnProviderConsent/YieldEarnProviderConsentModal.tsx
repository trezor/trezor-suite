import { injectDesktopAnalytics } from '@suite/analytics';
import { AssetSymbol } from '@suite/assets';
import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import {
    EarnFlow,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { toTokenAddress } from '@suite-common/tokens';
import { TradingTokenMetadataProvider } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { MORPHO_DISCLAIMER_URL, TREZOR_SUITE_TOS_URL } from '@trezor/urls';

import { EarnProviderConsentModalLayout } from './components/EarnProviderConsentModalLayout';
import { YieldProviderConsentBanners } from './components/YieldProviderConsentBanners';
import { useEarnProviderConsentActions } from './hooks/useEarnProviderConsentActions';
import { getEarnProviderName } from '../../utils/getEarnProviderName';

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
    const { analytics } = useServices(injectDesktopAnalytics);

    const tokenContractAddress = yieldContext?.tokenContractAddress;
    const normalizedTokenContractAddress = tokenContractAddress
        ? getContractAddressForNetworkSymbol(account.symbol, tokenContractAddress)
        : undefined;

    const { proceedToEarnFlow, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.Yield,
        onCancel,
        provider,
        account,
        networkSymbol: account.symbol,
        yieldContext,
    });
    // A wrapped-native vault (e.g. WETH in an ETH vault) is presented as its native asset (#29881).
    const depositSymbol = (
        <AssetSymbol
            networkSymbol={account.symbol}
            contractAddress={
                normalizedTokenContractAddress
                    ? toTokenAddress(normalizedTokenContractAddress)
                    : undefined
            }
            isWrappedNativeShownAsNative
        />
    );
    const providerName = getEarnProviderName(provider);

    const handleOnConfirm = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'deposit-legal-modal',
                to: 'deposit-form',
                networkSymbol: account.symbol,
                vaultId: yieldContext?.id,
            },
        });

        proceedToEarnFlow();
    };

    const handleOnCancel = () => {
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action: 'cancel',
                from: 'deposit-legal-modal',
                to: 'deposit-legal-modal',
                networkSymbol: account.symbol,
                vaultId: yieldContext?.id,
            },
        });

        onCancelClick();
    };

    // The trading catalog names a deposit token the account does not hold yet.
    return (
        <TradingTokenMetadataProvider>
            <EarnProviderConsentModalLayout
                heading={
                    <Translation id="TR_EARN_DEPOSIT_TOKEN" values={{ symbol: depositSymbol }} />
                }
                banners={
                    <YieldProviderConsentBanners
                        networkType={account.networkType}
                        providerName={providerName}
                    />
                }
                consentText={
                    <Translation
                        id="TR_EARN_CONSENT_PROTOCOL_TERMS_AND_DISCLAIMER"
                        values={{
                            providerName,
                            tos: chunks => (
                                <TrezorLink href={TREZOR_SUITE_TOS_URL}>{chunks}</TrezorLink>
                            ),
                            disclaimer: chunks => (
                                <TrezorLink href={MORPHO_DISCLAIMER_URL}>{chunks}</TrezorLink>
                            ),
                        }}
                    />
                }
                onConfirm={handleOnConfirm}
                onCancel={handleOnCancel}
            />
        </TradingTokenMetadataProvider>
    );
};
