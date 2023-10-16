import styled, { css, useTheme } from 'styled-components';

import { Icon, variables } from '@trezor/components';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';
import { Translation } from '..';
import { mediaQueries } from '@trezor/styles';

const collapsedStyle = css`
    width: 32px;

    span {
        opacity: 0;
    }
`;

const expandedStyle = css`
    width: 90px;

    span {
        opacity: 1;
    }
`;

const AbortContainer = styled.div`
    position: relative;
    height: 32px;
    border-radius: 20px;
    background: ${({ theme }) => theme.STROKE_GREY};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    overflow: hidden;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    transition: width 0.15s ease-in-out;
    cursor: pointer;

    span {
        position: absolute;
        right: 12px;
        top: 8px;
        width: max-content;
        text-transform: uppercase;
        transition: opacity 0.25s ease-out;
    }

    ${variables.SCREEN_QUERY.BELOW_LAPTOP} {
        ${expandedStyle}
    }

    /* Linting error because of a complex interpolation */

    ${/* sc-selector */ mediaQueries.hover} {
        ${/* sc-block */ collapsedStyle}
        :hover {
            ${/* sc-block */ expandedStyle}
        }
    }
`;

const CloseIcon = styled(Icon)`
    position: absolute;
    left: 0;
    top: 0;
    padding: 15.5px;
    border-radius: 20px;
    background: ${({ theme }) => theme.STROKE_GREY};
`;

interface AbortButtonProps {
    onAbort: () => void;
    className?: string;
}

export const AbortButton = ({ onAbort, className }: AbortButtonProps) => {
    const theme = useTheme();

    // checks compatability for use in other places
    const isActionAbortable = useSelector(selectIsActionAbortable);

    if (!isActionAbortable) {
        return null;
    }

    return (
        <AbortContainer
            key="@modal/close-button" // passed in array
            data-test="@modal/close-button"
            onClick={onAbort}
            className={className}
        >
            <Translation id="TR_ABORT" />
            <CloseIcon size={18} color={theme.TYPE_LIGHT_GREY} icon="CROSS" />
        </AbortContainer>
    );
};
