import React from 'react';
import { ITEMS } from '@wallet-config/menu';
import { Account } from '@wallet-types';
import AppNavigation from '@suite/components/suite/AppNavigation';

interface Props {
    account: Account;
}

export default (props: Props) => {
    const { account } = props;

    // collect all items suitable for current networkType
    const items = ITEMS.filter(item => !item.isHidden(account)).map(item => ({
        ...item,
        'data-test': `@wallet/menu/${item.route}`,
    }));

    // TODO: Do we still need hidden items?
    // const gotHiddenItems = items.length > VISIBLE_ITEMS_LIMIT + 1;
    // const visibleItems = gotHiddenItems ? items.slice(0, VISIBLE_ITEMS_LIMIT) : items;
    // const hiddenItems = gotHiddenItems ? items.slice(VISIBLE_ITEMS_LIMIT) : [];
    // const isHiddenItemSelected = !!hiddenItems.find(item => item.props.active);
    // const isOpened = expanded || isHiddenItemSelected;
    // const showMoreStyles = isHiddenItemSelected ? { opacity: 0.4, cursor: 'default' } : {};

    return <AppNavigation items={items} />;
};
