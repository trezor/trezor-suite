export const spinnerSizes = [16, 20, 24, 32, 40, 48] as const;
export type SpinnerSize = (typeof spinnerSizes)[number];

export const spinnerVariants = ['loading', 'success', 'error'] as const;
export type SpinnerVariant = (typeof spinnerVariants)[number];
