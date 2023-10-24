import { ComponentProps } from 'react';
import styled from 'styled-components';
import { variables } from '@trezor/components';
import { useLoadingSkeleton } from 'src/hooks/suite';
import { SkeletonRectangle, Stack, Spread } from 'src/components/suite/Skeleton';

const SkeletonWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    align-self: flex-end;
    margin: 20px;
    overflow-x: hidden;

    @media (max-width: ${variables.SCREEN_SIZE.SM}) {
        margin: 20px 0;
    }
`;

const SkeletonBar = (props: ComponentProps<typeof SkeletonRectangle>) => (
    <SkeletonRectangle borderRadius="4px 4px 0px 0px" {...props} />
);

interface GraphSkeletonProps {
    animate?: boolean;
}

export const GraphSkeleton = ({ animate, ...rest }: GraphSkeletonProps) => {
    const { shouldAnimate } = useLoadingSkeleton();
    const animationEnabled = animate ?? shouldAnimate;
    return (
        <SkeletonWrapper {...rest}>
            <Spread grow alignItems="flex-end">
                <Stack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="30px" animate={false} />
                    <SkeletonBar width="12px" height="40px" animate={false} />
                </Stack>

                <SkeletonBar width="12px" height="80px" />

                <Stack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="20px" animate={false} />
                    <SkeletonBar width="12px" height="50px" animate={false} />
                    <SkeletonBar width="12px" height="70px" animate={false} />
                    <SkeletonBar width="12px" height="30px" animate={false} />
                </Stack>

                <Stack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="120px" animate={false} />
                    <SkeletonBar width="12px" height="150px" animate={false} />
                    <SkeletonBar width="12px" height="200px" animate={false} />
                    <SkeletonBar width="12px" height="170px" animate={false} />
                    <SkeletonBar width="12px" height="80px" animate={false} />
                </Stack>

                <Stack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="100px" animate={false} />
                    <SkeletonBar width="12px" height="180px" animate={false} />
                    <SkeletonBar width="12px" height="30px" animate={false} />
                    <SkeletonBar width="12px" height="10px" animate={false} />
                </Stack>
                <SkeletonBar width="12px" height="30px" />
                <Stack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="10px" animate={false} />
                    <SkeletonBar width="12px" height="30px" animate={false} />
                    <SkeletonBar width="12px" height="70px" animate={false} />
                </Stack>
            </Spread>
            <SkeletonRectangle height="2px" width="100%" animate={animationEnabled} />
            <Spread spaceAround margin="12px 0px 50px 0px" alignItems="flex-end">
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
            </Spread>
        </SkeletonWrapper>
    );
};
