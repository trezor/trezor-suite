import { useEffect, useRef } from 'react';

import { events } from '@suite/analytics';
import { KNOWN_VAULTS } from '@suite-common/suite-constants';
import { parseCryptoId, toTokenCryptoId } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';
import { getAssetLogoUrl } from '@trezor/asset-utils';
import { exhaustive } from '@trezor/type-utils';

import { ApproveModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/ApproveModal';
import { RevokeModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/RevokeModal';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';
import { useAnalytics } from 'src/support/useAnalytics';

export type YieldApproveModalProps = {
    amount: string;
    contractAddress: string;
    account: Account;
    spender: string;
    preapprovedAmount?: string;
    txType: 'approve' | 'revoke' | 'revoke-only';
    onCancel: () => void;
    onSuccess: (txid: string) => void;
};

export const YieldApproveModal = ({
    amount,
    contractAddress,
    account,
    spender,
    preapprovedAmount,
    txType,
    onCancel,
    onSuccess,
}: YieldApproveModalProps) => {
    const analytics = useAnalytics();

    const {
        state: { isApproveModalOpen, isRevokeModalOpen, openApproveModal, openRevokeModal },
        tx: { approvalTxid, setApprovalTxid },
    } = useAllowanceContext();
    const handledTxidRef = useRef<string | null>(null);
    const cryptoId = toTokenCryptoId(account.symbol, contractAddress);
    const { networkId, contractAddress: parsedContract } = parseCryptoId(cryptoId);
    const vaultName = KNOWN_VAULTS[spender.toLowerCase()];

    const provider = {
        name: vaultName,
        companyName: vaultName,
        logo: getAssetLogoUrl({
            coingeckoId: networkId,
            contractAddress: parsedContract,
            size: 80,
        }),
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

    const handleOnApproveConfirm = () => {
        analytics.report({
            type: events.yieldSupplyEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'continue',
                networkSymbol: account.symbol,
                contractAddress,
            },
        });
    };

    const handleOnApproveCancel = () => {
        analytics.report({
            type: events.yieldSupplyEvent.name,
            payload: {
                type: 'approve-modal',
                action: 'cancel',
                networkSymbol: account.symbol,
                contractAddress,
            },
        });

        onCancel();
    };

    const handleOnRevokeConfirm = () => {
        analytics.report({
            type: events.yieldSupplyEvent.name,
            payload: {
                type: 'revoke-modal',
                action: 'continue',
                networkSymbol: account.symbol,
                contractAddress,
            },
        });
    };

    const handleOnRevokeCancel = () => {
        analytics.report({
            type: events.yieldSupplyEvent.name,
            payload: {
                type: 'revoke-modal',
                action: 'cancel',
                networkSymbol: account.symbol,
                contractAddress,
            },
        });

        onCancel();
    };

    if (txType === 'approve' && isApproveModalOpen) {
        return (
            <ApproveModal
                amount={amount}
                cryptoId={cryptoId}
                account={account}
                provider={provider}
                spender={spender}
                logoSourceType="url"
                onCancel={handleOnApproveCancel}
                onConfirm={handleOnApproveConfirm}
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
                onCancel={handleOnRevokeCancel}
                onConfirm={handleOnRevokeConfirm}
            />
        );
    }

    return null;
};
