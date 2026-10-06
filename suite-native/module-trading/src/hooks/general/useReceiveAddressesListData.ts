import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    type SuiteSyncDataRootState,
    selectSuiteSyncAddressLabels,
} from '@suite-common/suite-sync';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useTranslate } from '@suite-native/intl';
import { type CombinedLabelingState, selectIsLabellingAllowed } from '@suite-native/labeling';
import { type SectionListData } from '@suite-native/trading-atoms';
import { type ReceiveAccount } from '@suite-native/trading-types';

export type ReceiveAddressSection = 'unused' | 'used';

type UseReceiveAddressesListDataProps = {
    accountKey: AccountKey;
    searchQuery: string;
};

const EMPTY_ADDRESS_LABELS = [] as const;

export const useReceiveAddressesListData = ({
    accountKey,
    searchQuery,
}: UseReceiveAddressesListDataProps) => {
    const { translate } = useTranslate();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const isLabellingAllowed = useSelector((state: CombinedLabelingState) =>
        selectIsLabellingAllowed(state),
    );
    const addressLabels = useSelector((state: SuiteSyncDataRootState) =>
        account ? selectSuiteSyncAddressLabels(state, account.deviceState) : EMPTY_ADDRESS_LABELS,
    );

    return useMemo<SectionListData<ReceiveAccount, ReceiveAddressSection>>(() => {
        if (!account?.addresses) {
            return [];
        }

        const normalizedSearchQuery = searchQuery.trim().toLowerCase();
        const labelsByAddress = new Map(
            isLabellingAllowed
                ? addressLabels.map(({ address, label }) => [address, label] as const)
                : [],
        );
        const matchesSearchQuery = ({ address }: NonNullable<ReceiveAccount['address']>) => {
            if (!normalizedSearchQuery) {
                return true;
            }

            const label = labelsByAddress.get(address);

            return (
                address.toLowerCase().includes(normalizedSearchQuery) ||
                !!label?.toLowerCase().includes(normalizedSearchQuery)
            );
        };
        const mapAddressToReceiveAccount = (
            address: NonNullable<ReceiveAccount['address']>,
        ): ReceiveAccount => ({ account, address });

        const unusedAddresses = account.addresses.unused
            .slice(0, 1)
            .filter(matchesSearchQuery)
            .map(mapAddressToReceiveAccount);
        const usedAddresses = account.addresses.used
            .filter(matchesSearchQuery)
            .map(mapAddressToReceiveAccount);

        return [
            {
                key: 'unused',
                label: translate('moduleTrading.accountScreen.newAddress'),
                data: unusedAddresses,
                sectionData: 'unused' as const,
            },
            {
                key: 'used',
                label: translate('moduleTrading.accountScreen.usedAddresses'),
                data: usedAddresses,
                sectionData: 'used' as const,
            },
        ].filter(section => section.data.length > 0);
    }, [account, addressLabels, isLabellingAllowed, searchQuery, translate]);
};
