import { selectShouldAnimateLoadingSkeleton } from '@suite/ui-animations';
import { Column, Row, Skeleton } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';

const barProps = {
    width: 12,
    borderRadius: 2,
    animate: false,
} as const;

const labelProps = {
    height: 10,
    animate: false,
} as const;

interface GraphSkeletonProps {
    animate?: boolean;
}

export const GraphSkeleton = ({ animate, ...rest }: GraphSkeletonProps) => {
    const shouldAnimate = useSelector(selectShouldAnimateLoadingSkeleton);
    const animationEnabled = animate ?? shouldAnimate;

    return (
        <Column width="100%" alignSelf="flex-end" margin={20} overflow="hidden" {...rest}>
            <Row flex="1" alignItems="flex-end" justifyContent="space-between">
                <Row gap={8} alignItems="flex-end">
                    <Skeleton {...barProps} height={30} />
                    <Skeleton {...barProps} height={40} />
                </Row>

                <Skeleton {...barProps} height={80} />

                <Row gap={8} alignItems="flex-end">
                    <Skeleton {...barProps} height={20} />
                    <Skeleton {...barProps} height={50} />
                    <Skeleton {...barProps} height={70} />
                    <Skeleton {...barProps} height={30} />
                </Row>

                <Row gap={8} alignItems="flex-end">
                    <Skeleton {...barProps} height={120} />
                    <Skeleton {...barProps} height={150} />
                    <Skeleton {...barProps} height={200} />
                    <Skeleton {...barProps} height={170} />
                    <Skeleton {...barProps} height={80} />
                </Row>

                <Row gap={8} alignItems="flex-end">
                    <Skeleton {...barProps} height={100} />
                    <Skeleton {...barProps} height={180} />
                    <Skeleton {...barProps} height={30} />
                    <Skeleton {...barProps} height={10} />
                </Row>
                <Skeleton {...barProps} height={30} />
                <Row gap={8} alignItems="flex-end">
                    <Skeleton {...barProps} height={10} />
                    <Skeleton {...barProps} height={30} />
                    <Skeleton {...barProps} height={70} />
                </Row>
            </Row>
            <Skeleton height={2} width="100%" animate={animationEnabled} />
            <Row
                justifyContent="space-around"
                alignItems="flex-end"
                margin={{ top: 12, bottom: 48 }}
            >
                <Skeleton {...labelProps} />
                <Skeleton {...labelProps} />
                <Skeleton {...labelProps} />
                <Skeleton {...labelProps} />
                <Skeleton {...labelProps} />
                <Skeleton {...labelProps} />
            </Row>
        </Column>
    );
};
