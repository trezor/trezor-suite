import { type PropsWithChildren } from 'react';

import {
    SearchableAccountsListHeader,
    type SearchableAccountsListHeaderProps,
} from './SearchableAccountsListHeader';

type AccountsListHeaderProps = PropsWithChildren<SearchableAccountsListHeaderProps>;

export const AccountsListHeader = ({
    children,
    ...searchableAccountsListHeaderProps
}: AccountsListHeaderProps) => (
    <>
        <SearchableAccountsListHeader {...searchableAccountsListHeaderProps} />
        {children}
    </>
);
