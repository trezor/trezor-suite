import styled, { css } from 'styled-components';

import { INPUT_PADDING } from './utils';
import { motionEasingStrings } from '../../config/motion';

type FloatingLabelProps = {
    $isActive?: boolean;
    $isDisabled?: boolean;
};

export const FloatingLabel = styled.label<FloatingLabelProps>`
    --transform: translateY(-50%) translateY(-10px) scale(0.75);

    position: absolute;
    left: ${INPUT_PADDING}px;
    top: 50%;
    transition: 120ms ${motionEasingStrings.enter};
    transform-origin: left;
    transform: translateY(-50%);
    pointer-events: none;
    color: ${({ theme }) => theme.contentSecondary};

    ${({ $isActive }) =>
        $isActive &&
        css`
            transform: var(--transform);
        `}

    :is(input, textarea):focus ~ &,
    :is(input, textarea):not(:placeholder-shown) ~ & {
        transform: var(--transform);
    }

    ${({ $isDisabled }) =>
        $isDisabled &&
        css`
            color: ${({ theme }) => theme.contentDisabled};
        `}
`;
