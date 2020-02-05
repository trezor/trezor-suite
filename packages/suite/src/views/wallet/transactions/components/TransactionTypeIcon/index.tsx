import React from 'react';
import { WalletAccountTransaction } from '@wallet-reducers/transactionReducer';
import { Icon, colors, IconProps } from '@trezor/components-v2';

interface Props extends Omit<IconProps, 'icon'> {
    type: WalletAccountTransaction['type'];
}

const TransactionTypeIcon = ({ type, ...rest }: Props) => {
    if (type === 'sent') {
        return <Icon icon="SEND" color={colors.RED} size={12} {...rest} />;
    }
    if (type === 'recv') {
        return <Icon icon="RECEIVE" color={colors.GREEN} size={12} {...rest} />;
    }
    return <Icon icon="QUESTION" color={colors.BLACK50} size={12} {...rest} />;
};

export default TransactionTypeIcon;
