import { ComponentProps } from 'react';
import styled from 'styled-components';

import { SkeletonRectangle, SkeletonSpread, SkeletonStack, variables } from '@trezor/components';

import { useLoadingSkeleton } from 'src/hooks/suite';

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
            <SkeletonSpread grow alignItems="flex-end">
                <SkeletonStack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="30px" animate={false} />
                    <SkeletonBar width="12px" height="40px" animate={false} />
                </SkeletonStack>

                <SkeletonBar width="12px" height="80px" />

                <SkeletonStack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="20px" animate={false} />
                    <SkeletonBar width="12px" height="50px" animate={false} />
                    <SkeletonBar width="12px" height="70px" animate={false} />
                    <SkeletonBar width="12px" height="30px" animate={false} />
                </SkeletonStack>

                <SkeletonStack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="120px" animate={false} />
                    <SkeletonBar width="12px" height="150px" animate={false} />
                    <SkeletonBar width="12px" height="200px" animate={false} />
                    <SkeletonBar width="12px" height="170px" animate={false} />
                    <SkeletonBar width="12px" height="80px" animate={false} />
                </SkeletonStack>

                <SkeletonStack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="100px" animate={false} />
                    <SkeletonBar width="12px" height="180px" animate={false} />
                    <SkeletonBar width="12px" height="30px" animate={false} />
                    <SkeletonBar width="12px" height="10px" animate={false} />
                </SkeletonStack>
                <SkeletonBar width="12px" height="30px" />
                <SkeletonStack childMargin="0px 4px" alignItems="flex-end">
                    <SkeletonBar width="12px" height="10px" animate={false} />
                    <SkeletonBar width="12px" height="30px" animate={false} />
                    <SkeletonBar width="12px" height="70px" animate={false} />
                </SkeletonStack>
            </SkeletonSpread>
            <SkeletonRectangle height="2px" width="100%" animate={animationEnabled} />
            <SkeletonSpread spaceAround margin="12px 0px 50px 0px" alignItems="flex-end">
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
                <SkeletonRectangle height="10px" animate={false} />
            </SkeletonSpread>
        </SkeletonWrapper>
    );
};
