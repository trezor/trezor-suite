import { HtmlHTMLAttributes } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';

const StyledSpan = styled.span`
    cursor: pointer;
    text-decoration: underline;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const ButtonSkip = (props: HtmlHTMLAttributes<HTMLSpanElement>) => (
    <StyledSpan data-test="@onboarding/skip-button" {...props}>
        {props.children}
    </StyledSpan>
);

export default ButtonSkip;
