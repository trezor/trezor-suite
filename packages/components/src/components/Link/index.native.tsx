import React from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/native';
import colors from '../../config/colors';

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

export { Link, Props as LinkProps };
