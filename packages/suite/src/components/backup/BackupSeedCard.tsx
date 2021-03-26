import React from 'react';
import styled from 'styled-components';
import { Icon, IconProps, variables } from '@trezor/components';
import { useTheme } from '@suite/hooks/suite';

const Card = styled.div<{ checked: boolean }>`
    display: flex;
    padding: 12px 24px;

    border-radius: 10px;
    border: solid 1px ${props => (props.checked ? props.theme.TYPE_GREEN : props.theme.STROKE_GREY)};
    cursor: pointer;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-direction: row;
        align-items: center;
        width: 100%;
    }
`;

const Label = styled.span`
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;
    margin-top: 24px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        margin-top: 0px;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    margin-bottom: 30px;

    @media only screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        display: none;
    }
`;
const Col = styled.div`
    display: flex;
    margin-left: 8px;
`;

interface Props extends React.HTMLAttributes<HTMLDivElement> {
    label: React.ReactNode;
    icon: IconProps['icon'];
    isChecked: boolean;
}

const BackupSeedCard = ({ label, icon, isChecked, ...rest }: Props) => {
    const { theme } = useTheme();

    return (
        <Card checked={isChecked} {...rest}>
            <Content>
                <IconWrapper>
                    <Icon icon={icon} color={theme.TYPE_DARK_GREY} />
                </IconWrapper>
                <Label>{label}</Label>
            </Content>
            <Col>
                <Icon
                    icon="CHECK"
                    size={24}
                    color={isChecked ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY}
                />
            </Col>
        </Card>
    );
};

export default BackupSeedCard;
