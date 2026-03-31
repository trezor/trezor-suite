import { useEffect, useRef } from 'react';

import { useGetYieldProvider } from '@suite-common/earn-stablecoin-api';
import { toTokenCryptoId } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { exhaustive } from '@trezor/type-utils';

import { ApproveModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/ApproveModal';
import { RevokeModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/RevokeModal';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';

import { type EarnProviderId, earnProviderMetadata } from '../../providers/providerMetadata';

export type YieldApproveModalProps = {
    amount: string;
    contractAddress: string;
    account: Account;
    spender: string;
    providerId?: string;
    preapprovedAmount?: string;
    txType: 'approve' | 'revoke' | 'revoke-only';
    onCancel: () => void;
    onSuccess: (txid: string) => void;
};

const getDefaultProviderName = (providerId?: string) => {
    if (providerId && providerId in earnProviderMetadata) {
        return earnProviderMetadata[providerId as EarnProviderId].name;
    }

    return providerId ?? earnProviderMetadata.morpho.name;
};

export const YieldApproveModal = ({
    amount,
    contractAddress,
    account,
    spender,
    providerId,
    preapprovedAmount,
    txType,
    onCancel,
    onSuccess,
}: YieldApproveModalProps) => {
    const {
        state: { isApproveModalOpen, isRevokeModalOpen, openApproveModal, openRevokeModal },
        tx: { approvalTxid, setApprovalTxid },
    } = useAllowanceContext();
    const handledTxidRef = useRef<string | null>(null);
    const defaultProviderName = getDefaultProviderName(providerId);
    const cryptoId = toTokenCryptoId(account.symbol, contractAddress);
    const providerQuery = useGetYieldProvider(providerId);
    const providerName = providerQuery.data?.data.name ?? defaultProviderName;
    const provider = {
        name: providerName,
        companyName: providerName,
        logo: providerQuery.data?.data.logoURI ?? '',
        isActive: true,
    };

    useEffect(() => {
        switch (txType) {
            case 'approve':
                openApproveModal();

                break;
            case 'revoke':
            case 'revoke-only':
                openRevokeModal();

                break;
            default:
                exhaustive(txType);
        }
    }, [openApproveModal, openRevokeModal, txType]);

    useEffect(() => {
        if (!approvalTxid || handledTxidRef.current === approvalTxid) {
            return;
        }

        handledTxidRef.current = approvalTxid;

        onSuccess(approvalTxid);
        setApprovalTxid(null);
    }, [approvalTxid, onSuccess, setApprovalTxid]);

    if (txType === 'approve' && isApproveModalOpen) {
        return (
            <ApproveModal
                amount={amount}
                cryptoId={cryptoId}
                account={account}
                provider={provider}
                spender={spender}
                logoSourceType="url"
                onCancel={onCancel}
            />
        );
    }

    if ((txType === 'revoke' || txType === 'revoke-only') && isRevokeModalOpen) {
        return (
            <RevokeModal
                cryptoId={cryptoId}
                account={account}
                provider={provider}
                spender={spender}
                logoSourceType="url"
                preapprovedAmount={preapprovedAmount}
                onCancel={onCancel}
            />
        );
    }

    return null;
};
