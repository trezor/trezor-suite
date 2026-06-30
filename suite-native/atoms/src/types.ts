export type TestProps = {
    ['data-testid']?: never;
    ['data-test']?: never;
    ['data-testId']?: never;
    ['data-testID']?: never;
    ['testID']?: string;
};

export const SURFACE_ELEVATIONS = ['0', '1'] as const;
export type SurfaceElevation = (typeof SURFACE_ELEVATIONS)[number];
