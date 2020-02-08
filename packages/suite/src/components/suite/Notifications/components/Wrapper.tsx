import React from 'react';
import styled from 'styled-components';
import { Icon, colors } from '@trezor/components-v2';

const getBgColor = (variant: Props['variant']) => {
    switch (variant) {
        case 'info':
            return colors.BLUE_INFO;
        case 'warning':
            return colors.RED_ERROR;
        default:
            return 'transparent';
    }
};

const getIcon = (variant: Props['variant']) => {
    switch (variant) {
        case 'info':
            return <Icon icon="INFO" size={16} color={colors.WHITE} />;
        case 'warning':
            return <Icon icon="WARNING" size={16} color={colors.WHITE} />;
        default:
            return null;
    }
};

const Wrapper = styled.div<{ variant: Props['variant'] }>`
    display: flex;
    background: ${props => getBgColor(props.variant)};
    color: ${colors.WHITE};
    & + & {
        border-top: 1px solid ${colors.WHITE};
    }
`;

const MaxWithWrapper = styled.div`
    max-width: 1024px;
    display: flex;
    flex: 1;
    padding: 16px;
    padding-right: 32px;
`;

const IconWrapper = styled.div`
    margin-right: 8px;
`;

const Body = styled.div`
    display: flex;
    justify-content: space-between;
    width: 100%;
`;

interface Props {
    children: React.ReactNode;
    variant: 'info' | 'warning';
}

export default ({ variant, children }: Props) => {
    const iconElement = getIcon(variant);
    return (
        <Wrapper variant={variant}>
            <MaxWithWrapper>
                {iconElement && <IconWrapper>{iconElement}</IconWrapper>}
                <Body>{children}</Body>
            </MaxWithWrapper>
        </Wrapper>
    );
};
