import { ReactNode, SyntheticEvent } from 'react';
import styled, { useTheme } from 'styled-components';
import { darken } from 'polished';
import { Icon, IconProps, variables, Checkbox } from '@trezor/components';

const StyledCheckbox = styled(Checkbox)`
    position: absolute;
    right: 0;
    top: 20px;

    ${variables.SCREEN_QUERY.MOBILE} {
        top: auto;
    }
`;

const Card = styled.div<{ checked: boolean }>`
    position: relative;
    padding: 24px;
    border-radius: 10px;
    border: solid 1.5px ${({ theme, checked }) => (checked ? theme.TYPE_GREEN : theme.STROKE_GREY)};
    transition:
        box-shadow 0.2s ease-in-out,
        border 0.2s ease-in-out;
    cursor: pointer;

    :hover {
        box-shadow: 0 4px 10px 0 ${({ theme }) => theme.BOX_SHADOW_OPTION_CARD};
        border: 1.5px solid ${({ theme, checked }) => (checked ? theme.TYPE_GREEN : 'transparent')};

        ${StyledCheckbox} > :first-child {
            border: ${({ theme }) =>
                `2px solid ${darken(theme.HOVER_DARKEN_FILTER, theme.STROKE_GREY)}`};
        }
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        display: flex;
        align-items: center;
        padding-right: 56px;
    }
`;

const Label = styled.span`
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.NORMAL};
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    flex: 1;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        margin-top: 0;
    }
`;

const IconWrapper = styled.div`
    display: flex;
    margin-bottom: 30px;

    ${variables.SCREEN_QUERY.BELOW_TABLET} {
        margin-bottom: 20px;
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        display: none;
    }
`;

interface BackupSeedCardProps {
    label: ReactNode;
    icon: IconProps['icon'];
    isChecked: boolean;
    onClick: () => void;
    ['data-test']: string;
}

export const BackupSeedCard = ({
    label,
    icon,
    isChecked,
    onClick,
    'data-test': dataTest,
}: BackupSeedCardProps) => {
    const theme = useTheme();

    const handleCheckboxClick = (e: SyntheticEvent<HTMLElement>) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <Card checked={isChecked} onClick={onClick} data-test={dataTest}>
            <Content>
                <IconWrapper>
                    <Icon icon={icon} color={theme.TYPE_DARK_GREY} />
                </IconWrapper>

                <Label>{label}</Label>
            </Content>

            <StyledCheckbox isChecked={isChecked} onClick={handleCheckboxClick} />
        </Card>
    );
};
