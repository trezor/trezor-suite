import { useSelector } from 'react-redux';

import { Box, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import {
    type NativeAccountsWithNetworksRootState,
    selectIsAccountsListNetworkFilterVisible,
} from '../selectors';
import { type NetworkFilterType } from '../types';

type AccountsListFooterProps = {
    networkFilterType: NetworkFilterType;
    activeFilterCount: number;
    onClearFilters: () => void;
};

export const AccountsListFooter = ({
    networkFilterType,
    activeFilterCount,
    onClearFilters,
}: AccountsListFooterProps) => {
    const isNetworkFilterVisible = useSelector((state: NativeAccountsWithNetworksRootState) =>
        selectIsAccountsListNetworkFilterVisible(state, networkFilterType),
    );

    if (!isNetworkFilterVisible || activeFilterCount === 0) {
        return null;
    }

    return (
        <Box alignItems="center" paddingBottom="sp16">
            <Button size="medium" intent="neutral" priority="secondary" onPress={onClearFilters}>
                <Translation id="moduleAccountManagement.accountsScreen.networkFilter.showAllButton" />
            </Button>
        </Box>
    );
};
