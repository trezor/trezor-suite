import { type ReactNode } from 'react';

import { type AddCoinFlowType, type CloseActionType } from '@suite-native/navigation';

import { SearchableAccountsListHeader } from './SearchableAccountsListHeader';

type AccountsListHeaderProps = {
    title: ReactNode;
    isSearchActive: boolean;
    flowType?: AddCoinFlowType;
    closeActionType?: CloseActionType;
    closeAction?: () => void;
    onAddAccount?: () => void;
    activeFilterCount: number;
    children?: ReactNode;
    onSearchInputChange: (value: string) => void;
    onSearchActiveChange: (value: boolean) => void;
    onFilterPress?: () => void;
};

export const AccountsListHeader = ({
    title,
    isSearchActive,
    flowType,
    closeActionType,
    closeAction,
    onAddAccount,
    activeFilterCount,
    children,
    onSearchInputChange,
    onSearchActiveChange,
    onFilterPress,
}: AccountsListHeaderProps) => (
    <>
        <SearchableAccountsListHeader
            title={title}
            onSearchInputChange={onSearchInputChange}
            isSearchActive={isSearchActive}
            onSearchActiveChange={onSearchActiveChange}
            flowType={flowType}
            closeActionType={closeActionType}
            closeAction={closeAction}
            onAddAccount={onAddAccount}
            onFilterPress={onFilterPress}
            activeFilterCount={activeFilterCount}
        />
        {children}
    </>
);
