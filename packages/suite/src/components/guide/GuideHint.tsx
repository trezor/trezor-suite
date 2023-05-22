import React from 'react';
import styled from 'styled-components';

import { Warning, variables } from '@trezor/components';

const StyledWarning = styled(Warning)`
    background: ${({ theme }) => theme.BG_GREY};
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    gap: 10px;
    padding: 10px;

    a {
        display: inline; /* Allow linebreaks inside links as the space is quite narrow. */
    }
    p {
        margin: 0;
    }
    strong {
        font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    }
`;

const BULB_EMOJI = '💡';
const WARNING_EMOJI = '⚠️';
const REGEX = new RegExp(`^(${BULB_EMOJI}|${WARNING_EMOJI})\\s*`);

// This is a hack to sneak a bit more complex component into the generated markup.
// We use markdown quotes in the source to render hints and warnings in Guide.
// The displayed variant is determined by an emoji at the start of the markdown quote.
export const GuideHint = ({ children }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => {
    // We dig the message from children to check for an emoji indicating the component variant.
    // There should be three children, with the first and the last being just newline characters.
    // The middle one is a ReactElement whose children are the content of the message (array of strings and ReactElements in case of links).
    // The first element is the start of the message which should hold the emoji.
    const message: string[] | undefined = (children as React.ReactElement[])?.[1]?.props?.children;

    // This must be checked before the message is transformed.
    const variant = message?.[0]?.startsWith(WARNING_EMOJI) ? 'warning' : 'learn';

    if (message?.[0]) {
        // Assigning to message does mutate the children object as it is a reference to an array within the object.
        message[0] = message[0].replace(REGEX, '');
    } else {
        // If the object does not have the expected format, log an error but display the component anyway.
        console.error('Unexpected variant of Guide hint.');
    }

    return (
        <StyledWarning withIcon variant={variant}>
            {children}
        </StyledWarning>
    );
};
