import styled, { css } from 'styled-components';
import React from 'react';
import PropTypes from 'prop-types';

import { colors, variables } from '@trezor/components';

interface Props {
    hasBorder: boolean;
    textLeft: React.ReactNode;
    textRight: React.ReactNode;
    className?: string;
    testId: string;
}

const Wrapper = styled.div<Pick<Props, 'hasBorder'>>`
    display: flex;
    justify-content: space-between;
    padding: 8px 28px 8px 24px;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
    background: ${colors.LANDING};
    ${props =>
        props.hasBorder &&
        css`
            border-top: 1px solid ${colors.BODY};
            border-bottom: 1px solid ${colors.BODY};
        `}
`;

const TextLeft = styled.div`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const TextRight = styled.div``;

const Divider = ({ textLeft, textRight, hasBorder = false, className, testId }: Props) => (
    <Wrapper data-test={testId} hasBorder={hasBorder} className={className}>
        <TextLeft>{textLeft}</TextLeft>
        {textRight && <TextRight>{textRight}</TextRight>}
    </Wrapper>
);

Divider.propTypes = {
    className: PropTypes.string,
    textLeft: PropTypes.node,
    textRight: PropTypes.node,
    hasBorder: PropTypes.bool,
    testId: PropTypes.string,
};

export default Divider;
