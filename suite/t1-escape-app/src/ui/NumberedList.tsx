import type { ReactNode } from 'react';

import { List } from '@trezor/components';

type NumberedListProps = {
    children: ReactNode;
};

/** Steps the user follows one after another, numbered in plain text. */
export const NumberedList = ({ children }: NumberedListProps) => (
    <List bulletAlignment="start" bulletGap={8}>
        {children}
    </List>
);

type NumberedListItemProps = {
    number: number;
    children: ReactNode;
};

const NumberedListItem = ({ number, children }: NumberedListItemProps) => (
    <List.Item bulletComponent={<span>{number}.</span>}>{children}</List.Item>
);

NumberedList.Item = NumberedListItem;
