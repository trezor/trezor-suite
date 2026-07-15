import {
    type BlockquoteHTMLAttributes,
    Children,
    type PropsWithChildren,
    cloneElement,
    isValidElement,
} from 'react';

import { Banner, type BannerIntent } from '@trezor/components';
import { typedObjectKeys } from '@trezor/utils';

// The displayed Banner intent is determined by an emoji at the start of the markdown quote.
// The mapping is exhaustive over BannerIntent so Guide hints support every Banner intent.
const INTENT_EMOJI = {
    brand: '💡',
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
    neutral: '📝',
} as const satisfies Record<BannerIntent, string>;

const HINT_INTENTS = typedObjectKeys(INTENT_EMOJI);
const EMOJI_REGEX = new RegExp(`^(${Object.values(INTENT_EMOJI).join('|')})\\s*`);

// This is a hack to sneak a bit more complex component into the generated markup.
// We use markdown quotes in the source to render hints and warnings in Guide.
// The displayed variant is determined by an emoji at the start of the markdown quote.
export const GuideHint = ({ children }: BlockquoteHTMLAttributes<HTMLQuoteElement>) => {
    // We dig the message from children to check for an emoji indicating the component variant.
    // There should be three children, with the first and the last being just newline characters - we filter them out as invalid elements.
    // The middle one is a ReactElement whose children are the content of the message (array of strings and ReactElements - a, strong etc.).
    // The first element is the start of the message which should hold the emoji.
    const message: string[] | undefined = Children.map(children, child => {
        if (isValidElement<{ children?: string }>(child)) {
            return child.props.children;
        }

        return false;
    })?.filter(child => !!child);

    const intent =
        HINT_INTENTS.find(candidate => message?.[0]?.startsWith(INTENT_EMOJI[candidate])) ??
        'brand';

    let updatedMessage: string[] | undefined;
    if (message?.[0]) {
        // Copy the array and mutate the first element so that it does not affect the original array nested in the children prop
        updatedMessage = [...message];
        updatedMessage[0] = updatedMessage[0]?.replace(EMOJI_REGEX, '') ?? '';
    } else {
        // If the object does not have the expected format, log an error but display the component anyway.
        console.error('Unexpected intent of Guide hint.');
    }

    // Clone the children to avoid mutating them and prevent weird bugs.
    const clonedChildren = Children.map(children, child => {
        if (isValidElement<PropsWithChildren>(child)) {
            return cloneElement(child, {
                ...child.props,
                children: updatedMessage || child.props.children,
            });
        }

        return child;
    });

    return (
        <Banner
            data-testid="guide-banner"
            icon
            intent={intent}
            description={clonedChildren}
            margin={{ bottom: 16 }}
        />
    );
};
