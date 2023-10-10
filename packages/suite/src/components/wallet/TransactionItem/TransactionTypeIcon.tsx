import styled, { useTheme } from 'styled-components';
import { WalletAccountTransaction } from 'src/types/wallet';
import { Icon, IconProps } from '@trezor/components';
import { getTxIcon } from '@suite-common/wallet-utils';

const IconsWrapper = styled.div<{ isJoint: boolean }>`
    position: relative;
    width: 24px;
    transform: ${({ isJoint }) => isJoint && 'translate(2px, 0)'};
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

    const isJoint = type === 'joint';

    return (
        <IconsWrapper isJoint={isJoint} {...rest}>
            <Icon
                icon={getTxIcon(type)}
                color={type === 'failed' ? theme.TYPE_RED : theme.TYPE_LIGHT_GREY}
                size={isJoint ? 20 : 24}
                {...rest}
            />

            {isPending && <ClockIcon icon="CLOCK_ACTIVE" size={12} color={theme.TYPE_ORANGE} />}
        </IconsWrapper>
    );
};
