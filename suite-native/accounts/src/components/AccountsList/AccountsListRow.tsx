import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { AccountsListItem } from './AccountsListItem';
import { type NativeAccountsRootState } from '../../selectors';
import { type OnSelectAccount } from '../../types';

const rowStyle = prepareNativeStyle<{
    isFirst: boolean;
    isLast: boolean;
    hasBottomSpacing: boolean;
}>((utils, { isFirst, isLast, hasBottomSpacing }) => ({
    backgroundColor: utils.colors.surfaceFillRaised,
    extend: [
        {
            condition: isFirst,
            style: {
                borderTopLeftRadius: utils.borders.radii.r16,
                borderTopRightRadius: utils.borders.radii.r16,
            },
        },
        {
            condition: isLast,
            style: {
                borderBottomLeftRadius: utils.borders.radii.r16,
                borderBottomRightRadius: utils.borders.radii.r16,
            },
        },
        {
            condition: hasBottomSpacing,
            style: {
                marginBottom: utils.spacings.sp16,
            },
        },
    ],
}));

type AccountsListRowProps = {
    accountKey: AccountKey;
    isFirst: boolean;
    isLast: boolean;
    hasBottomSpacing: boolean;
    onSelectAccount: OnSelectAccount;
};

export const AccountsListRow = ({
    accountKey,
    isFirst,
    isLast,
    hasBottomSpacing,
    onSelectAccount,
}: AccountsListRowProps) => {
    const account = useSelector((state: NativeAccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const { applyStyle } = useNativeStyles();

    if (!account) {
        return null;
    }

    return (
        <View style={applyStyle(rowStyle, { isFirst, isLast, hasBottomSpacing })}>
            <AccountsListItem account={account} onPress={onSelectAccount} />
        </View>
    );
};
