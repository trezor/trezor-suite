import { Card, Column } from '@trezor/components';

export const TradingFormCard = ({ children }: { children: React.ReactNode }) => (
    <Card paddingType="none">
        <Column hasDivider>{children}</Column>
    </Card>
);
