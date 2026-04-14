import { type ReactNode } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { TOOLTIP_DELAY_NONE, TOOLTIP_DELAY_NORMAL, Tooltip } from '@trezor/components';
import { mediaQueries } from '@trezor/styles';

import { useDispatch } from 'src/hooks/suite';

const Container = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    margin: -2px -12px;
    padding: 2px 12px;
    border-radius: 6px;
    transition: background 0.1s ease-in;
    cursor: pointer;
    ${mediaQueries.hover} {
        :hover {
            background: ${({ theme }) => theme.legacyBackgroundNeutralBoldInverted};
        }
    }
`;

interface StakeAmountWrapperProps {
    children: ReactNode;
}

export const StakeAmountWrapper = ({ children }: StakeAmountWrapperProps) => {
    const dispatch = useDispatch();
    const goToStakingTab = () =>
        dispatch(goto({ routeName: 'wallet-staking', preserveParams: true }));

    return (
        <Tooltip
            cursor="default"
            maxWidth={200}
            delayShow={TOOLTIP_DELAY_NORMAL}
            delayHide={TOOLTIP_DELAY_NONE}
            placement="bottom"
            content={<Translation id="TR_STAKE_STAKED_AMOUNT" />}
        >
            <Container onClick={goToStakingTab}>{children}</Container>
        </Tooltip>
    );
};
