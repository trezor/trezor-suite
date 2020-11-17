import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { HiddenPlaceholder } from '@suite-components';
import { variables } from '@trezor/components';
import { ANIMATION } from '@suite-config';

export const MIN_ROW_HEIGHT = '23px';

const CryptoAmount = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /* line-height: 1.5; */
    text-transform: uppercase;
    white-space: nowrap;
`;

const FiatAmount = styled.span`
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.57;
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
    padding-bottom: ${props => (props.paddingBottom ? '20px' : '0px')};
`;

const StyledHiddenPlaceholder = styled(HiddenPlaceholder)`
    /* padding: 8px 0px; row padding */
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
`;

const TargetAddress = styled(motion.div)`
    display: flex;
    flex: 1;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums slashed-zero;
    margin-right: 4px;
    padding-left: 10px;
    margin-left: -10px;

    /* start of css to prevent hidden labeling button (23px height) to expand the target row */
    align-items: center;
    min-height: ${MIN_ROW_HEIGHT};
    align-self: baseline;
    /* end of css to prevent hidden labeling button to expand the target row*/
`;

const TimelineDotWrapper = styled.div`
    margin-right: 8px;
    width: 8px;
    display: flex;
    align-items: center;
    flex-direction: column;
`;

const TimelineDot = styled.div`
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: ${props => props.theme.TYPE_LIGHT_GREY};
`;
const TimelineLine = styled.div<{ show: boolean; top?: boolean }>`
    width: 1px;
    background: ${props => (props.show ? props.theme.STROKE_GREY : 'transparent')};

    ${props =>
        props.top
            ? css`
                  height: 10px;
              `
            : css`
                  flex: 1;
              `}
`;

interface BaseTargetLayoutProps {
    addressLabel: React.ReactNode;
    amount?: React.ReactNode;
    fiatAmount?: React.ReactNode;
    useAnimation?: boolean;
    singleRowLayout?: boolean;
    isFirst?: boolean;
    isLast?: boolean;
    className?: string;
}

const BaseTargetLayout = ({
    addressLabel,
    amount,
    fiatAmount,
    useAnimation,
    singleRowLayout,
    isFirst,
    isLast,
    ...rest
}: BaseTargetLayoutProps) => {
    const animation = useAnimation ? ANIMATION.EXPAND : {};
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
                {amount && !singleRowLayout && <CryptoAmount>{amount}</CryptoAmount>}
                {fiatAmount && <FiatAmount>{fiatAmount}</FiatAmount>}
            </TargetAmountsWrapper>
        </TargetWrapper>
    );
};

export default BaseTargetLayout;
