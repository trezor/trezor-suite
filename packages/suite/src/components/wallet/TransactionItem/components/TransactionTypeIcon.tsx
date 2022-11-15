import React from 'react';
import styled from 'styled-components';
import { WalletAccountTransaction } from '@wallet-types';
import { Icon, useTheme, IconProps } from '@trezor/components';
import { getTxIcon } from '@suite-common/wallet-utils';

const IconsWrapper = styled.div`
    position: relative;
    width: 24px;
`;

const ClockIcon = styled(Icon)`
    position: absolute;
    top: -2px;
    right: 0;
    background: ${({ theme }) => theme.BG_WHITE};
    border-radius: 50%;
`;

interface TransactionTypeIconProps extends Omit<IconProps, 'icon'> {
    type: WalletAccountTransaction['type'];
    isPending: boolean;
}

export const TransactionTypeIcon = ({ type, isPending, ...rest }: TransactionTypeIconProps) => {
    const theme = useTheme();

    return (
        <IconsWrapper {...rest}>
            <Icon
                icon={getTxIcon(type)}
                color={type === 'failed' ? theme.TYPE_RED : theme.TYPE_LIGHT_GREY}
                size={type === 'joint' ? 20 : 24}
                {...rest}
            />

            {isPending && <ClockIcon icon="CLOCK" size={12} color={theme.TYPE_ORANGE} />}
        </IconsWrapper>
    );
};
