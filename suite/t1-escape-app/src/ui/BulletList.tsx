import type { ReactNode } from 'react';

import { List } from '@trezor/components';

type BulletListProps = {
    children: ReactNode;
};

/** A list with plain text bullets. */
export const BulletList = ({ children }: BulletListProps) => (
    <List
        bulletComponent={<span aria-hidden>{'\u2022'}</span>}
        bulletAlignment="start"
        bulletGap={8}
    >
        {children}
    </List>
);

BulletList.Item = List.Item;
