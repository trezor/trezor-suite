import { useState } from 'react';
import styled, { css, useTheme } from 'styled-components';
import { Icon, IconType } from '@trezor/components';
import { TranslationKey } from '@suite-common/intl-types';
import { Translation } from 'src/components/suite';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsSessionAutostopped } from 'src/reducers/wallet/coinjoinReducer';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { toggleAutostopCoinjoin } from 'src/actions/wallet/coinjoinAccountActions';
import { borders, typography } from '@trezor/theme';

const TRANSITION_CONFIG = '0.1s ease';

const StyledIcon = styled(Icon)<{ isActivated: boolean }>`
    position: absolute;
    left: 6px;
    width: 15px;
    height: 15px;
    border: 1.5px solid
        ${({ theme, isActivated }) => (isActivated ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY)};
    border-radius: 50%;
    transition:
        background ${TRANSITION_CONFIG},
        border-color ${TRANSITION_CONFIG};

    path {
        transition: fill ${TRANSITION_CONFIG};
    }
`;

const getHoverStyle = (backgroundColor: string, strokeColor: string, fontColor?: string) => css`
    color: ${fontColor};
    background: ${backgroundColor};
    border-color: ${backgroundColor};

    ${StyledIcon} {
        background: ${strokeColor};
        border-color: ${strokeColor};

        path {
            fill: ${backgroundColor};
        }
    }
`;

const Container = styled.button<{
    isActivated: boolean;
    isHovered: boolean;
}>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 290px;
    margin: 14px auto 0;
    padding: 3px 8px 3px 26px;
    border: 1px solid ${({ theme }) => theme.STROKE_LIGHT_GREY};
    border-radius: ${borders.radii.lg};
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
    background: none;
    transition:
        background ${TRANSITION_CONFIG},
        border-color ${TRANSITION_CONFIG},
        color ${TRANSITION_CONFIG};
    cursor: pointer;
    appearance: none;

    :focus-visible {
        ${({ theme }) => getHoverStyle(theme.BG_GREY, theme.TYPE_LIGHTER_GREY)}
    }

    ${({ theme, isHovered }) => isHovered && getHoverStyle(theme.BG_GREY, theme.TYPE_LIGHTER_GREY)}

    ${({ theme, isActivated, isHovered }) =>
        isActivated &&
        css`
            border-color: ${theme.BG_LIGHT_GREEN};
            background: ${theme.BG_LIGHT_GREEN};
            color: ${theme.TYPE_GREEN};

            :focus-visible {
                ${getHoverStyle(theme.BG_LIGHT_RED, theme.TYPE_RED, theme.TYPE_RED)}
            }

            ${isHovered && getHoverStyle(theme.BG_LIGHT_RED, theme.TYPE_RED, theme.TYPE_RED)}
        `};
`;

const getButtonConfig = (
    isActivated: boolean,
    isHovered: boolean,
): {
    icon: IconType;
    iconSize: number;
    text: TranslationKey;
} => {
    if (isActivated) {
        if (isHovered) {
            return {
                icon: 'CROSS',
                iconSize: 9,
                text: 'TR_DISABLE_AUTOSTOP_COINJOIN',
            };
        }
        return {
            icon: 'CHECK',
            iconSize: 10,
            text: 'TR_AUTOSTOP_COINJOIN_ENABLED',
        };
    }

    return {
        icon: 'STOP',
        iconSize: 7,
        text: 'TR_ENABLE_AUTOSTOP_COINJOIN',
    };
};

interface AutoStopButtonProps {
    relatedAccountKey: string;
}

export const AutoStopButton = ({ relatedAccountKey }: AutoStopButtonProps) => {
    const isActivated = useSelector(state => selectIsSessionAutostopped(state, relatedAccountKey));
    const [isHovered, setIsHovered] = useState(false);

    const theme = useTheme();
    const dispatch = useDispatch();

    const handleClick = () => {
        setIsHovered(current => !current);
        dispatch(toggleAutostopCoinjoin(relatedAccountKey));
    };

    const { icon, iconSize, text } = getButtonConfig(isActivated, isHovered);

    return (
        <Container
            isActivated={!!isActivated}
            isHovered={isHovered}
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <StyledIcon
                isActivated={!!isActivated}
                icon={icon}
                size={iconSize}
                color={isActivated ? theme.iconPrimaryDefault : undefined}
            />

            <Translation id={text} />
        </Container>
    );
};
