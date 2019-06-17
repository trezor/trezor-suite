import React from 'react';
import { Linking } from 'react-native';
import styled from 'styled-components/native';
import colors from '../../config/colors';
import { Omit } from '../../support/types';

const A = styled.Text<Omit<Props, 'href'>>`
    color: ${props => (props.isGray ? colors.TEXT_SECONDARY : colors.GREEN_PRIMARY)};
`;

interface Props {
    isGray?: boolean;
    isGreen?: boolean;
    href: string;
    children?: React.ReactNode;
}

const Link = ({ isGray, isGreen, href, children, ...rest }: Props) => {
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

export default Link;
