import { BulletList, BulletListItemState, Card, Row, Spinner, Text } from '@trezor/components';

type TradingDetailStepProps = {
    state: BulletListItemState;
    title: React.ReactNode;
    children?: React.ReactNode;
};

export const TradingDetailStep = ({ state, title, children }: TradingDetailStepProps) => {
    const isActive = state === 'active';

    return (
        <BulletList.Item
            state={state}
            title={
                <Row justifyContent="space-between" gap={12}>
                    <Text data-testid={isActive ? '@trading/transaction/detail/status' : undefined}>
                        {title}
                    </Text>
                    {isActive && <Spinner size={20} isGrey={false} />}
                </Row>
            }
        >
            {children && state !== 'done' && <Card>{children}</Card>}
        </BulletList.Item>
    );
};
