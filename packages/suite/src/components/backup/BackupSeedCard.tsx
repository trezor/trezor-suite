import { ReactNode, SyntheticEvent } from 'react';
import styled, { useTheme } from 'styled-components';
import { IconLegacy, IconLegacyProps, variables, Checkbox, Card } from '@trezor/components';
import { spacingsPx, typography } from '@trezor/theme';

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
        top: ${spacingsPx.lg};
        left: ${spacingsPx.sm};
    }

    ${variables.SCREEN_QUERY.ABOVE_MOBILE} {
        > div {
            top: auto;
            bottom: ${spacingsPx.md};
            left: ${spacingsPx.lg};
        }
    }
`;

const Container = styled(Card)<{ $checked: boolean }>`
    position: relative;

    /* space for the checkbox */
    padding-bottom: ${spacingsPx.xxxxl};
    border: solid 1px
        ${({ theme, $checked }) => ($checked ? theme.borderSecondary : theme.borderElevation2)};
    transition:
        box-shadow 0.2s ease-in-out,
        border 0.1s;
    cursor: pointer;

    &:hover {
        box-shadow: ${({ theme }) => theme.boxShadowElevated};
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
    icon: IconLegacyProps['icon'];
    isChecked: boolean;
    onClick: () => void;
    ['data-testid']: string;
}

export const BackupSeedCard = ({
    label,
    icon,
    isChecked,
    onClick,
    'data-testid': dataTest,
}: BackupSeedCardProps) => {
    const theme = useTheme();

    const handleCheckboxClick = (e: SyntheticEvent<HTMLElement>) => {
        e.stopPropagation();
        onClick();
    };

    return (
        <Container forceElevation={2} $checked={isChecked} data-testid={dataTest}>
            <Content>
                <IconWrapper>
                    <IconLegacy icon={icon} color={theme.iconDefault} />
                </IconWrapper>

                <Label>{label}</Label>
            </Content>

            <StyledCheckbox variant="primary" isChecked={isChecked} onClick={handleCheckboxClick} />
        </Container>
    );
};
