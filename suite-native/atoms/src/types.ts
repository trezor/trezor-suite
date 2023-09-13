export type TestProps = {
    ['data-testid']?: never;
    ['data-test']?: never;
    ['data-test-id']?: never;
    ['data-testId']?: never;
    ['data-testID']?: string;
};

export type SurfaceElevation = '0' | '1';
