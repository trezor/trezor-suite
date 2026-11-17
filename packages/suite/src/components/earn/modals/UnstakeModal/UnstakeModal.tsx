import { useSelector } from 'react-redux';

import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { UnstakeModalContent } from './UnstakeModalContent';

type UnstakeModalProps = {
    onCancel?: () => void;
    accountKey: AccountKey;
};

export const UnstakeModal = ({ onCancel, accountKey }: UnstakeModalProps) => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;

    return <UnstakeModalContent onCancel={onCancel} account={account} />;
};
