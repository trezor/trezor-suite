import React from 'react';
import styled from 'styled-components';
import { SkeletonRectangle, Stack, Spread } from '@suite-components/Skeleton';

const SkeletonWrapper = styled.div<{ animate?: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    align-self: flex-end;
    margin: 20px;
`;

const SkeletonBar = (props: React.ComponentProps<typeof SkeletonRectangle>) => (
    <SkeletonRectangle borderRadius="4px 4px 0px 0px" {...props} />
);

const SkeletonTransactionsGraph = ({ animate }: { animate?: boolean }) => {
    return (
        <SkeletonWrapper animate={animate}>
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
            <SkeletonRectangle height="2px" width="100%" animate={animate} />
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

export default SkeletonTransactionsGraph;
