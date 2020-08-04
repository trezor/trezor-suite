import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { HiddenPlaceholder } from '@suite-components';
import { variables, colors } from '@trezor/components';

const CryptoAmount = styled.span`
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    /* line-height: 1.5; */
    text-transform: uppercase;
    white-space: nowrap;
`;

const FiatAmount = styled.span`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    line-height: 1.57;
`;

const TargetWrapper = styled(motion.div)`
    display: flex;
    flex: 1;
    justify-content: space-between;
    /* align-items: flex-start; */

    & + & {
        /* padding-top: 20px; */
    }
`;

const TargetAmountsWrapper = styled.div<{ paddingBottom?: boolean }>`
    display: flex;
    flex-direction: column;
    align-items: flex-end;
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
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-variant-numeric: tabular-nums slashed-zero;
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
    background: ${colors.NEUE_TYPE_LIGHT_GREY};
`;
const TimelineLine = styled.div<{ show: boolean; top?: boolean }>`
    width: 1px;
    background: ${props => (props.show ? colors.NEUE_STROKE_GREY : 'transparent')};

    ${props =>
        props.top
            ? css`
                  height: 8px;
              `
            : css`
                  flex: 1;
              `}
`;

const ANIMATION = {
    variants: {
        initial: {
            overflow: 'hidden',
            height: 0,
        },
        visible: {
            height: 'auto',
        },
    },
    initial: 'initial',
    animate: 'visible',
    exit: 'initial',
    transition: { duration: 0.24, ease: 'easeInOut' },
};

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
    const animation = useAnimation ? ANIMATION : {};
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
