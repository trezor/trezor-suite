import { BulletList } from '@trezor/components';

export const TradingDetailStepList = ({ children }: { children: React.ReactNode }) => (
    <BulletList bulletSize="small" bulletGap={12} gap={24} titleGap={12}>
        {children}
    </BulletList>
);
