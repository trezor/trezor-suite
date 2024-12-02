import styled from 'styled-components';

import { variables } from '@trezor/components';
import { typography } from '@trezor/theme';

import { HiddenPlaceholder } from 'src/components/suite';

import { MIN_ROW_HEIGHT } from './TransactionTargetLayout';

export const TxTypeIconWrapper = styled.div`
    padding-right: 24px;
    margin-top: 8px;
    cursor: pointer;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        display: none;
    }
`;

export const TimestampWrapper = styled.div`
    cursor: pointer;
    display: flex;
    height: ${MIN_ROW_HEIGHT};
    align-items: center;
`;

export const Content = styled.div`
    display: flex;
    flex: 1;
    overflow: hidden;
    flex-direction: column;
    font-variant-numeric: tabular-nums;

    /* workarounds for nice blur effect without cutoffs even inside parent with overflow: hidden */
    padding-left: 10px;
    margin-left: -10px;
    padding-right: 10px;
    margin-right: -10px;
    margin-top: -10px;
    padding-top: 10px;
`;

export const Description = styled(HiddenPlaceholder)`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.body};
    line-height: 1.5;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    white-space: nowrap;
`;
