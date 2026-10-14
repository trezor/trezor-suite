import { Card, Column } from '@trezor/components';

export const TRADING_FORM_CARD_COMPONENT = 'TradingFormCard';

type TradingFormCardProps = { children: React.ReactNode };

export const TradingFormCard = ({ children }: TradingFormCardProps) => (
    <Card paddingType="none" data-component={TRADING_FORM_CARD_COMPONENT}>
        <Column hasDivider>{children}</Column>
    </Card>
);
