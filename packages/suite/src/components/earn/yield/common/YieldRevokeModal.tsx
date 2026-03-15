import type { CryptoId } from 'invity-api';

import type { Account } from '@suite-common/wallet-types';

import { RevokeModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/RevokeModal';
import type { AllowanceProvider } from 'src/components/suite/modals/ReduxModal/UserContextModal/AllowanceModals/types';
import { useAllowanceContext } from 'src/hooks/wallet/allowance';

type YieldRevokeModalProps = {
    account: Account;
    provider: AllowanceProvider;
    cryptoId: CryptoId | null;
    spender: string | null;
};

export const YieldRevokeModal = ({
    account,
    provider,
    cryptoId,
    spender,
}: YieldRevokeModalProps) => {
    const { state } = useAllowanceContext();

    if (!state.isRevokeModalOpen || !cryptoId || !spender) {
        return null;
    }

    return (
        <RevokeModal cryptoId={cryptoId} account={account} provider={provider} spender={spender} />
    );
};
