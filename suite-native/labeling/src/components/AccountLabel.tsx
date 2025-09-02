import { useSelector } from 'react-redux';

import { WithLabelingState, selectAccountLabel } from '@suite-common/local-first-storage';
import { AccountKey, WalletDescriptor } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';

import { useIsLabelingEnabled } from './useIsLabelingEnabled';

type AccountLabelProps = {
    walletDescriptor: WalletDescriptor;
    accountKey: AccountKey;
    /** @deprecated this shall be removed once Evolu labeling is rolled out and account.accountLabel data migrated */
    fallbackLabel: string | undefined;
};

export const AccountLabel = ({
    accountKey,
    walletDescriptor,
    fallbackLabel,
}: AccountLabelProps) => {
    const isLabelingEnabled = useIsLabelingEnabled();

    const label = useSelector((state: WithLabelingState) =>
        selectAccountLabel({ state, walletDescriptor, accountKey }),
    );

    return <Text>{!isLabelingEnabled || label === null ? fallbackLabel : label}</Text>;
};
