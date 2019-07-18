import React from 'react';
import PropTypes from 'prop-types';
import { Linking } from 'react-native';
import styled from 'styled-components/native';
import colors from '../../config/colors';
import { Omit } from '../../support/types';

const A = styled.Text<Omit<Props, 'href'>>`
    color: ${props => (props.isGray ? colors.TEXT_SECONDARY : colors.GREEN_PRIMARY)};
`;

interface Props {
    children?: React.ReactNode;
    isGray?: boolean;
    isGreen?: boolean;
    href: string;
}

const Link = ({ children, isGray, isGreen, href, ...rest }: Props) => {
    return (
        <A
            onPress={() => {
                Linking.openURL(href);
            }}
            {...rest}
        >
            {children}
        </A>
    );
};

Link.propTypes = {
    children: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object,
        PropTypes.array,
        PropTypes.node,
    ]).isRequired,
    isGray: PropTypes.bool,
    isGreen: PropTypes.bool,
    href: PropTypes.string,
};

export default Link;
