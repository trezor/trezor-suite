import React from 'react';
import styled from 'styled-components/native';
import PropTypes from 'prop-types';
import Icon from '../Icon';

import icons from '../../config/icons';
import { Omit, IconShape } from '../../support/types';
import colors from '../../config/colors';

// TODO: Rewrite using Animated API
// const PulseAnimation = keyframes`
//     0% {
//         background-color: ${colors.GREEN_PRIMARY};
//         transform: scale(0);
//         opacity: 0;
//     }
//     25% {
//         background-color: ${colors.GREEN_PRIMARY};
//         transform: scale(0.75);
//         opacity: 0.2;
//     }
//     50% {
//         transform: scale(1.5);
//         opacity: 0.3;
//     }
//     100% {
//         opacity: 0;
//         transform: scale(4);
//     }
// `;

const IconWrapper = styled.View<Omit<Props, 'model'>>`
    position: relative;
    height: ${props => props.size}px;
    width: ${props => props.size}px;
`;

const Wrapper = styled.View`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
`;

const ContentWrapper = styled.View`
    max-width: 300px;
    color: ${colors.GREEN_PRIMARY};
    text-align: center;
    margin: 5px;
`;

const modelToIcon = (model: number) => {
    const mapping: { [key: number]: IconShape } = {
        1: icons.T1,
        2: icons.T2,
    };
    return mapping[model];
};
interface Props {
    model: number;
    size?: number;
    children?: React.ReactNode;
}

const Prompt = ({ model, size, children }: Props) => {
    return (
        <Wrapper>
            <IconWrapper size={size}>
                {/* <Pulse /> */}
                <Icon icon={modelToIcon(model)} size={size} color={colors.GREEN_PRIMARY} />
            </IconWrapper>
            <ContentWrapper>{children}</ContentWrapper>
        </Wrapper>
    );
};

Prompt.propTypes = {
    model: PropTypes.oneOf([1, 2]).isRequired,
    children: PropTypes.node.isRequired,
    size: PropTypes.number,
};

Prompt.defaultProps = {
    size: 32,
};

export default Prompt;
