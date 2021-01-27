import React from 'react';
import styled from 'styled-components';
import { WalletAccountTransaction } from '@wallet-types';
import { Icon, useTheme, IconProps } from '@trezor/components';

const IconsWrapper = styled.div`
    position: relative;
`;

const ClockIcon = styled(Icon)`
    position: absolute;
    top: 0;
    right: 1px;
`;

interface Props extends Omit<IconProps, 'icon'> {
    type: WalletAccountTransaction['type'];
    isPending: boolean;
}

const TransactionTypeIcon = ({ type, isPending, ...rest }: Props) => {
    const theme = useTheme();
    let icon = null;
    if (type === 'sent' || type === 'self') {
        icon = <Icon icon="SEND" color={theme.TYPE_LIGHT_GREY} size={24} {...rest} />;
    } else if (type === 'recv') {
        icon = <Icon icon="RECEIVE" color={theme.TYPE_LIGHT_GREY} size={24} {...rest} />;
    } else {
        icon = <Icon icon="QUESTION" color={theme.TYPE_LIGHT_GREY} size={24} {...rest} />;
    }

    if (isPending) {
        return (
            <IconsWrapper {...rest}>
                {icon}
                <ClockIcon icon="CLOCK" size={12} color={theme.TYPE_ORANGE} />
            </IconsWrapper>
        );
    }
    return icon;
};

export default TransactionTypeIcon;
