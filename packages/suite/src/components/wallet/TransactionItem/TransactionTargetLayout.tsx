import { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { HiddenPlaceholder } from 'src/components/suite';
import { motionAnimation } from '@trezor/components';
import { borders, spacingsPx, typography } from '@trezor/theme';

export const MIN_ROW_HEIGHT = '23px';

const FiatAmount = styled.span`
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
`;

const TargetWrapper = styled(motion.div)`
    display: flex;

    /* position: relative; */
    flex: 1;
    justify-content: space-between;
`;

const TargetAmountsWrapper = styled.div<{ paddingBottom?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    align-self: center;
    padding-right: 10px;
    margin-right: -10px;

    padding-top: 10px;
    margin-top: -10px;
    margin-bottom: -10px;
    padding-bottom: ${({ paddingBottom }) => (paddingBottom ? '30px' : '10px')};
`;

const StyledHiddenPlaceholder = styled(props => <HiddenPlaceholder {...props} />)`
    /* padding: 8px 0px; row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

const TargetAddress = styled(motion.div)`
    display: flex;
    flex: 1;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums slashed-zero;
    margin-right: ${spacingsPx.xxs};
    padding-left: 10px;
    margin-left: -10px;
    line-height: 26px;

    /* start of css to prevent hidden labeling button (23px height) to expand the target row */
    align-items: center;
    min-height: ${MIN_ROW_HEIGHT};
    align-self: baseline;

    /* end of css to prevent hidden labeling button to expand the target row */
`;

const TimelineDotWrapper = styled.div`
    margin: 0 ${spacingsPx.xs};
    min-width: ${spacingsPx.xs};
    display: flex;
    align-items: center;
    flex-direction: column;
`;

const TimelineDot = styled.div`
    width: 3px;
    height: 3px;
    border-radius: ${borders.radii.full};
    background: ${({ theme }) => theme.iconSubdued};
`;

const TimelineLine = styled.div<{ show: boolean; top?: boolean }>`
    width: 1px;
    background: ${({ show, theme }) => (show ? theme.borderDashed : 'transparent')};

    ${({ top }) =>
        top
            ? css`
                  height: ${spacingsPx.sm};
              `
            : css`
                  flex: 1;
              `}
`;

interface TransactionTargetLayoutProps {
    addressLabel: ReactNode;
    amount?: ReactNode;
    fiatAmount?: ReactNode;
    useAnimation?: boolean;
    singleRowLayout?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
}

export const TransactionTargetLayout = ({
    addressLabel,
    amount,
    fiatAmount,
    useAnimation,
    singleRowLayout,
    isFirst,
    isLast,
    ...rest
}: TransactionTargetLayoutProps) => {
    const animation = useAnimation ? motionAnimation.expand : {};

    return (
        <TargetWrapper {...animation} {...rest}>
            <TimelineDotWrapper>
                <TimelineLine top show={!singleRowLayout && !isFirst} />
                <TimelineDot />
                <TimelineLine show={!singleRowLayout && !isLast} />
            </TimelineDotWrapper>

            <TargetAddress>
                <StyledHiddenPlaceholder>{addressLabel}</StyledHiddenPlaceholder>
            </TargetAddress>

            <TargetAmountsWrapper paddingBottom={!isLast}>
                {amount && !singleRowLayout && amount}
                {fiatAmount && <FiatAmount>{fiatAmount}</FiatAmount>}
            </TargetAmountsWrapper>
        </TargetWrapper>
    );
};
