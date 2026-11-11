import { injectDesktopAnalytics } from '@suite/analytics';
import { events } from '@suite-common/analytics';
import { useYieldOpportunity } from '@suite-common/earn-stablecoin-api';
import { type NetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';
import {
    type Account,
    type AllowanceLimitType,
    type AllowanceTransactionType,
} from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { useServices } from '@trezor/dependency-injection';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { exhaustive } from '@trezor/type-utils';

import { type AllowanceProvider } from '#src/components/wallet/Allowance/AllowanceProviderInfo';
import { ApproveModal } from '#src/components/wallet/Allowance/ApproveModal';
import { RevokeModal } from '#src/components/wallet/Allowance/RevokeModal';

export type YieldApproveModalProps = {
    amount: string;
    contractAddress: string;
    account: Account;
    vaultId: string;
    spender: string;
    preapprovedAmount?: string;
    txType: AllowanceTransactionType;
    onCancel: () => void;
    onSuccess: (txid: string) => void;
};

const ANALYTICS_APPROVAL_TYPE = {
    minimal: 'MINIMAL',
    unlimited: 'INFINITE',
} as const satisfies Record<AllowanceLimitType, 'INFINITE' | 'MINIMAL'>;

type GetVaultTokenLogoParams = {
    networkSymbol: NetworkSymbol;
    contractAddress: string;
};

const getVaultTokenLogo = ({
    networkSymbol,
    contractAddress,
}: GetVaultTokenLogoParams): AllowanceProvider['logo'] => {
    if (isWrappedNativeToken(networkSymbol, contractAddress)) {
        return {
            networkSymbol,
            size: 20,
            showNetworkIcon: true,
            wrappedTokenIcon: 'network',
        };
    }

    const coingeckoId = getCoingeckoId(networkSymbol);

    if (!coingeckoId) {
        return undefined;
    }

    return getAssetLogoUrl({
        coingeckoId,
        contractAddress: getContractAddressForNetworkSymbol(networkSymbol, contractAddress),
        size: 80,
    });
};

export const YieldApproveModal = ({
    amount,
    contractAddress,
    account,
    vaultId,
    spender,
    preapprovedAmount,
    txType,
    onCancel,
    onSuccess,
}: YieldApproveModalProps) => {
    const { analytics } = useServices(injectDesktopAnalytics);

    const { data: vaultName } = useYieldOpportunity(vaultId, {
        select: yieldOpportunity => yieldOpportunity.metadata.name,
    });

    const provider: AllowanceProvider = {
        name: vaultName,
        companyName: vaultName,
        logo: getVaultTokenLogo({ networkSymbol: account.symbol, contractAddress }),
        label: 'TR_EARN_YIELD_VAULT',
        kind: 'vault',
    };

    const handleOnApproveConfirm = (limitType: AllowanceLimitType) => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'continue',
                networkSymbol: account.symbol,
                vaultId,
                approvalType: ANALYTICS_APPROVAL_TYPE[limitType],
            },
        });
    };

    const handleOnApproveCancel = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'cancel',
                networkSymbol: account.symbol,
                vaultId,
            },
        });

        onCancel();
    };

    const handleOnRevokeConfirm = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'revoke-modal',
                action: 'continue',
                networkSymbol: account.symbol,
                vaultId,
            },
        });
    };

    const handleOnRevokeCancel = () => {
        analytics.report({
            type: events.yieldDepositEvent.name,
            payload: {
                type: 'revoke-modal',
                action: 'cancel',
                networkSymbol: account.symbol,
                vaultId,
            },
        });

        onCancel();
    };

    switch (txType) {
        case 'approve':
            return (
                <ApproveModal
                    amount={amount}
                    account={account}
                    tokenContractAddress={contractAddress}
                    provider={provider}
                    spender={spender}
                    showSpender
                    preapprovedAmount={preapprovedAmount}
                    heading="TR_APPROVAL_APPROVE_TOKEN_SPENDING"
                    description="TR_EARN_YIELD_APPROVE_TOKEN_SPENDING_DESCRIPTION"
                    onCancel={handleOnApproveCancel}
                    onConfirm={handleOnApproveConfirm}
                    onSent={onSuccess}
                />
            );
        case 'revoke':
            return (
                <RevokeModal
                    account={account}
                    tokenContractAddress={contractAddress}
                    provider={provider}
                    spender={spender}
                    showSpender
                    preapprovedAmount={preapprovedAmount}
                    approveAmount={amount}
                    followedByApproval={false}
                    heading="TR_APPROVAL_REVOKE_TOKEN_SPENDING"
                    description="TR_EARN_YIELD_REVOKE_TOKEN_SPENDING_DESCRIPTION"
                    onCancel={handleOnRevokeCancel}
                    onConfirm={handleOnRevokeConfirm}
                    onSent={onSuccess}
                />
            );
        default:
            return exhaustive(txType);
    }
};
