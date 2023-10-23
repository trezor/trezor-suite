import { ReactNode, ReactElement } from 'react';
import styled, { useTheme } from 'styled-components';
import { Card, variables, P, Icon, IconType } from '@trezor/components';

const Wrapper = styled.div`
    margin-bottom: 40px;
`;

const Header = styled.div`
    padding: 4px 12px 12px 0;
    margin-bottom: 12px;
`;

const Title = styled.div`
    display: flex;
    align-items: center;
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledIcon = styled(Icon)`
    margin-right: 6px;
`;

const Description = styled(P)`
    margin-top: 4px;
`;

interface SettingsSectionProps {
    customHeader?: ReactNode;
    title?: string | ReactElement;
    icon?: IconType;
    description?: string | ReactElement;
    children?: ReactNode;
}

export const SettingsSection = ({
    children,
    title,
    icon,
    description,
    customHeader,
}: SettingsSectionProps) => {
    const theme = useTheme();

    return (
        <Wrapper>
            <Header>
                {!title && customHeader}
                {title && !customHeader && (
                    <Title>
                        {icon && <StyledIcon icon={icon} size={16} color={theme.TYPE_LIGHT_GREY} />}
                        {title}
                    </Title>
                )}
                {description && !customHeader && (
                    <Description type="label">{description}</Description>
                )}
            </Header>

            <Card paddingType="none">{children}</Card>
        </Wrapper>
    );
};
