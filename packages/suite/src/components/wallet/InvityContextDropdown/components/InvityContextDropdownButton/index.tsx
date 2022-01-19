import React from 'react';
import styled from 'styled-components';
import { darken } from 'polished';
import { Button, variables } from '@trezor/components';
import { Translation } from '@suite-components';
import { resolveStaticPath } from '@suite/utils/suite/build';
import type { ExtendedMessageDescriptor } from '@suite/types/suite';

// TODO: extract somewhere?
const InvityPrimaryColor = 'rgb(0, 191, 217)';
const InvityPrimaryBackbgroundColor = 'rgba(0, 191, 217, 0.05)';

// TODO: The button is not properly designed. Need to wait until designer designs the button by design manual correctly.
const StyledButton = styled(Button)`
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${InvityPrimaryColor};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    display: flex;
    align-items: center;
    white-space: nowrap;
    margin-left: 10px;
    height: 32px;
    background: ${InvityPrimaryBackbgroundColor};
    &:hover,
    &:visited,
    &:focus,
    &:active {
        color: ${InvityPrimaryColor};
        background: ${props =>
            darken(props.theme.HOVER_DARKEN_FILTER, InvityPrimaryBackbgroundColor)};
    }
`;

const Image = styled.img`
    height: 12px;
    object-fit: contain;
    margin-right: 8px;
`;

interface InvityContextDropdownButtonProps {
    onClick?: () => void;
    labelTranslationId: ExtendedMessageDescriptor['id'];
}

export const InvityContextDropdownButton = ({
    onClick,
    labelTranslationId,
}: InvityContextDropdownButtonProps) => (
    <StyledButton size={14} type="button" onClick={onClick}>
        <Image src={resolveStaticPath('/images/svg/invity-symbol.svg')} />
        <Translation id={labelTranslationId} />
    </StyledButton>
);
