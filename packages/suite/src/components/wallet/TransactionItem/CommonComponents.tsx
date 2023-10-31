import styled, { css } from 'styled-components';
import { variables } from '@trezor/components';
import { FormattedCryptoAmount, FormattedNftAmount, HiddenPlaceholder } from 'src/components/suite';
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

export const Description = styled(props => <HiddenPlaceholder {...props} />)`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.5;
    display: flex;
    justify-content: space-between;
    overflow: hidden;
    white-space: nowrap;
`;

export const NextRow = styled.div`
    display: flex;
    flex: 1;
    align-items: flex-start;
    margin-bottom: 6px;
`;

export const TargetsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    padding-right: 10px;
    margin-right: -10px;
`;

const amountStyle = css`
    width: 100%;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    white-space: nowrap;
`;

export const StyledFormattedCryptoAmount = styled(FormattedCryptoAmount)`
    ${amountStyle}
`;

export const StyledFormattedNftAmount = styled(FormattedNftAmount)`
    ${amountStyle}
`;
