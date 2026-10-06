import { Row, StepList, type StepListItemState, Text } from '@trezor/components';

type TradingDetailStepProps = {
    state: StepListItemState;
    title: React.ReactNode;
    children?: React.ReactNode;
    doneContent?: React.ReactNode;
};

export const TradingDetailStep = ({
    state,
    title,
    children,
    doneContent,
}: TradingDetailStepProps) => {
    const isActive = state === 'active';

    return (
        <StepList.Item
            state={state}
            isLoading={isActive}
            title={
                <Row justifyContent="space-between" gap={12}>
                    <Text data-testid={isActive ? '@trading/transaction/detail/status' : undefined}>
                        {title}
                    </Text>
                    {doneContent && state === 'done' && doneContent}
                </Row>
            }
        >
            {children && state !== 'done' && children}
        </StepList.Item>
    );
};
