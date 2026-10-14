import { StepList } from '@trezor/components';

type TradingDetailStepListProps = { children: React.ReactNode };

export const TradingDetailStepList = ({ children }: TradingDetailStepListProps) => (
    <StepList bulletSize="medium" bulletGap={12} gap={24} titleGap={12}>
        {children}
    </StepList>
);
