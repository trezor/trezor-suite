import { Column, InfoItem, Skeleton } from '@trezor/components';

type CancelTransactionSkeletonRowProps = {
    animate: boolean;
};

export const CancelTransactionSkeletonRow = ({ animate }: CancelTransactionSkeletonRowProps) => (
    <InfoItem
        direction="row"
        label={<Skeleton width={90} animate={animate} />}
        typographyStyle="body-md"
        intent="neutral"
        priority="primary"
    >
        <Column alignItems="flex-end" gap={8}>
            <Skeleton width={80} animate={animate} />
            <Skeleton width={50} height={14} animate={animate} />
        </Column>
    </InfoItem>
);
