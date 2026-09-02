import { useSelector } from 'react-redux';

import { Box, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import {
    type NativeAccountsRootState,
    selectIsAccountsListNetworkFilterVisible,
} from '../selectors';

type AccountsListFooterProps = {
    isSendFlow?: boolean;
    activeFilterCount: number;
    onClearFilters: () => void;
};

export const AccountsListFooter = ({
    isSendFlow,
    activeFilterCount,
    onClearFilters,
}: AccountsListFooterProps) => {
    const isNetworkFilterVisible = useSelector((state: NativeAccountsRootState) =>
        selectIsAccountsListNetworkFilterVisible(state, isSendFlow),
    );

    if (!isNetworkFilterVisible || activeFilterCount === 0) {
        return null;
    }

    return (
        <Box alignItems="center" paddingTop="sp16">
            <Button size="medium" intent="neutral" priority="secondary" onPress={onClearFilters}>
                <Translation id="moduleAccountManagement.accountsScreen.networkFilter.showAllButton" />
            </Button>
        </Box>
    );
};
