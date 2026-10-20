import { Card, Column } from '@trezor/components';

type TradingFormCardProps = { children: React.ReactNode };

export const TradingFormCard = ({ children }: TradingFormCardProps) => (
    <Card paddingType="none">
        <Column hasDivider>{children}</Column>
    </Card>
);
