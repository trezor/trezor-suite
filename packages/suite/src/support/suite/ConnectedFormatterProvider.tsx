import { type ReactNode, memo } from 'react';

import { FormatterProvider } from '@suite-common/formatters';

import { useFormattersConfig } from 'src/hooks/suite';

interface ConnectedFormatterProviderProps {
    children: ReactNode;
}

// The config is read from the store here rather than in Main, so that a settings change re-renders
// only this component instead of the whole app.
export const ConnectedFormatterProvider = memo(({ children }: ConnectedFormatterProviderProps) => {
    const formattersConfig = useFormattersConfig();

    return <FormatterProvider config={formattersConfig}>{children}</FormatterProvider>;
});

ConnectedFormatterProvider.displayName = 'ConnectedFormatterProvider';
