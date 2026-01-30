import { Column } from '@trezor/components';

export const TradingFormSection = ({ children }: { children: React.ReactNode }) => (
    <Column gap={20} padding={20}>
        {children}
    </Column>
);
