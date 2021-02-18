import React from 'react';
import styled from 'styled-components';
import { WalletAccountTransaction } from '@wallet-types';
import { Icon, useTheme, IconProps } from '@trezor/components';
import { getTxIcon } from '@wallet-utils/transactionUtils';

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
    const icon = (
        <Icon
            icon={getTxIcon(type)}
            color={type === 'failed' ? theme.TYPE_RED : theme.TYPE_LIGHT_GREY}
            size={24}
            {...rest}
        />
    );

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
