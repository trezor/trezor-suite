import { Children, BlockquoteHTMLAttributes, cloneElement, isValidElement } from 'react';
import styled from 'styled-components';

import { Warning } from '@trezor/components';
import { typography } from '@trezor/theme';

const StyledWarning = styled(Warning)`
    background: ${({ theme }) => theme.backgroundSurfaceElevation1};
    color: ${({ theme }) => theme.textDefault};
    gap: 10px;
    padding: 10px;

    :not(:last-child) {
        margin-bottom: 16px;
    }

    a {
        display: inline; /* Allow linebreaks inside links as the space is quite narrow. */
        ${typography.hint}
    }

    /* Provide a more specific selector to override paragraph style on parent. */
    p:last-child {
        margin: 0;
    }
`;

const BULB_EMOJI = '💡';
const WARNING_EMOJI = '⚠️';
const REGEX = new RegExp(`^(${BULB_EMOJI}|${WARNING_EMOJI})\\s*`);

// This is a hack to sneak a bit more complex component into the generated markup.
// We use markdown quotes in the source to render hints and warnings in Guide.
// The displayed variant is determined by an emoji at the start of the markdown quote.
export const GuideHint = ({ children }: BlockquoteHTMLAttributes<HTMLQuoteElement>) => {
    // We dig the message from children to check for an emoji indicating the component variant.
    // There should be three children, with the first and the last being just newline characters - we filter them out as invalid elements.
    // The middle one is a ReactElement whose children are the content of the message (array of strings and ReactElements - a, strong etc.).
    // The first element is the start of the message which should hold the emoji.
    const message: string[] | undefined = Children.map(children, child => {
        if (isValidElement(child)) {
            return child.props.children;
        }
        return false;
    })?.filter(child => !!child);
    const variant = message?.[0]?.startsWith(WARNING_EMOJI) ? 'warning' : 'learn';

    let updatedMessage: string[] | undefined;
    if (message?.[0]) {
        // Copy the array and mutate the first element so that it does not affect the original array nested in the children prop
        updatedMessage = [...message];
        updatedMessage[0] = updatedMessage[0].replace(REGEX, '');
    } else {
        // If the object does not have the expected format, log an error but display the component anyway.
        console.error('Unexpected variant of Guide hint.');
    }

    // Clone the children to avoid mutating them and prevent weird bugs.
    const clonedChildren = Children.map(children, child => {
        if (isValidElement(child)) {
            return cloneElement(child, {
                ...child.props,
                children: updatedMessage || child.props.children,
            });
        }
        return child;
    });

    return (
        <StyledWarning withIcon variant={variant}>
            {clonedChildren}
        </StyledWarning>
    );
};
