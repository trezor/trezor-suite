import { selectDesktopAnalyticsDep } from '@suite/analytics';
import { TrezorLink } from '@suite/external-links';
import { Translation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { useSelector } from '@suite-common/redux-utils';
import {
    EarnFlow,
    type EarnProvider,
    type EarnYieldContext,
} from '@suite-common/suite-types/src/staking';
import { selectTradingCoinSymbolByCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { MORPHO_DISCLAIMER_URL, TREZOR_SUITE_TOS_URL } from '@trezor/urls';

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
    const { analytics } = useServices(selectDesktopAnalyticsDep);

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
    const { proceedToEarnFlow, onCancelClick } = useEarnProviderConsentActions({
        flow: EarnFlow.Yield,
        onCancel,
        account,
        networkSymbol: account.symbol,
        yieldContext,
    });
    const displaySymbol = getNetworkDisplaySymbol(account.symbol);
    const depositSymbol = isWrappedNativeToken(account.symbol, normalizedTokenContractAddress)
        ? displaySymbol
        : (tokenSymbolFromAccount ?? tokenSymbolFromTrading ?? displaySymbol);
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

    return (
        <EarnProviderConsentModalLayout
            heading={<Translation id="TR_EARN_DEPOSIT_TOKEN" values={{ symbol: depositSymbol }} />}
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
            networkType={account.networkType}
        >
            <VotingDelegations account={account} />
        </EarnProviderConsentModalLayout>
    );
};
