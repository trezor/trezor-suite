import { StepList } from '@trezor/components';

export const TradingDetailStepList = ({ children }: { children: React.ReactNode }) => (
    <StepList bulletSize="small" bulletGap={12} gap={24} titleGap={12}>
        {children}
    </StepList>
);
