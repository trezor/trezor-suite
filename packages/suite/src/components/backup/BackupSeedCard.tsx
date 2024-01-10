import { ReactNode, SyntheticEvent } from 'react';
import styled, { useTheme } from 'styled-components';
import { Icon, IconProps, variables, Checkbox, Card } from '@trezor/components';
import { boxShadows, spacingsPx, typography } from '@trezor/theme';

const StyledCheckbox = styled(Checkbox)`
    /* so the entire card acts as a checkbox */
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;

    > div {
        position: absolute;

        /* Card padding */
        bottom: ${spacingsPx.sm};
        left: ${spacingsPx.sm};
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        > div {
            bottom: auto;
        }
    }
`;

const Container = styled(Card)<{ checked: boolean }>`
    position: relative;

    /* space for the checkbox */
    padding-bottom: ${spacingsPx.xxxxl};
    border: solid 1px
        ${({ theme, checked }) => (checked ? theme.borderSecondary : theme.borderOnElevation1)};
    transition:
        box-shadow 0.2s ease-in-out,
        border 0.1s;
    cursor: pointer;

    :hover {
        box-shadow: ${boxShadows.elevation3};
    }

    ${variables.SCREEN_QUERY.MOBILE} {
        flex-direction: row-reverse;
        gap: ${spacingsPx.md};
        padding-bottom: ${spacingsPx.sm};
        padding-left: ${spacingsPx.xxxxl};
    }
`;

const Label = styled.span`
    color: ${({ theme }) => theme.textDefault};
    ${typography.body};
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
        <Container checked={isChecked} elevation={2} data-test={dataTest}>
            <Content>
                <IconWrapper>
                    <Icon icon={icon} color={theme.iconDefault} />
                </IconWrapper>

                <Label>{label}</Label>
            </Content>

            <StyledCheckbox isChecked={isChecked} onClick={handleCheckboxClick} />
        </Container>
    );
};
