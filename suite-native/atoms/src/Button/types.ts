export const BUTTON_INTENTS = [
    'brand',
    'neutral',
    'info',
    'warning',
    'critical',
    'accentViolet',
] as const;
export type ButtonIntent = (typeof BUTTON_INTENTS)[number];

export const BUTTON_PRIORITIES = ['primary', 'secondary'] as const;
export type ButtonPriority = (typeof BUTTON_PRIORITIES)[number];

export const BUTTON_SIZES = ['small', 'medium', 'large'] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export const TEXT_BUTTON_SIZES = ['large', 'small'] as const;
export type TextButtonSize = (typeof TEXT_BUTTON_SIZES)[number];

export type ButtonColorProps = {
    intent?: ButtonIntent;
    priority?: ButtonPriority;
    isInverse?: boolean;
};

export type InverseKey = 'normal' | 'inverse';
