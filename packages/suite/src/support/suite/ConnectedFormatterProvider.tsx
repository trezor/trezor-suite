import { type ReactNode, memo } from 'react';

import { FormatterProvider } from '@suite-common/formatters';

import { useFormattersConfig } from 'src/hooks/suite';

interface ConnectedFormatterProviderProps {
    children: ReactNode;
}

export const ConnectedFormatterProvider = memo(({ children }: ConnectedFormatterProviderProps) => {
    const formattersConfig = useFormattersConfig();

    return <FormatterProvider config={formattersConfig}>{children}</FormatterProvider>;
});

ConnectedFormatterProvider.displayName = 'ConnectedFormatterProvider';
