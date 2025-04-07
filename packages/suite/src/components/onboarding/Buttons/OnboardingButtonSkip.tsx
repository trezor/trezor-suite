import { HtmlHTMLAttributes } from 'react';

import { TextButton } from '@trezor/components';

export const OnboardingButtonSkip = (props: HtmlHTMLAttributes<HTMLSpanElement>) => (
    <TextButton
        variant="tertiary"
        size="small"
        isUnderlined
        data-testid="@onboarding/skip-button"
        {...props}
    >
        {props.children}
    </TextButton>
);
