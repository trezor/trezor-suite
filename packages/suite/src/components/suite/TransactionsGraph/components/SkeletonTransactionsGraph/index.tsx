import React from 'react';
import styled, { css } from 'styled-components';
import { SkeletonRectangle } from '@suite-components/Skeleton';

const SkeletonWrapper = styled.div<{ animate?: boolean }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    align-self: flex-end;
    margin: 20px;
`;

interface StackProps {
    col?: boolean;
    grow?: boolean;
    margin?: string;
    childMargin?: string;
}
const Stack = styled.div<StackProps>`
    display: flex;
    align-items: flex-end;
    flex-direction: ${props => (props.col ? 'column' : 'row')};
    flex-grow: ${props => (props.grow ? 1 : 0)};
    ${props =>
        props.margin &&
        css`
            margin: ${props.margin};
        `}
    ${props =>
        props.childMargin &&
        css`
            div {
                margin: ${props.childMargin};
            }
        `}
`;

const Spread = styled(Stack)<
    StackProps & {
        spaceAround?: boolean;
    }
>`
    justify-content: ${props => (props.spaceAround ? 'space-around' : 'space-between')};
`;

const SkeletonBar = (props: React.ComponentProps<typeof SkeletonRectangle>) => (
    <SkeletonRectangle borderRadius="4px 4px 0px 0px" {...props} />
);

const SkeletonTransactionsGraph = ({ animate }: { animate?: boolean }) => {
    return (
        <SkeletonWrapper animate={animate}>
            <Spread grow>
                <Stack childMargin="0px 4px">
                    <SkeletonBar width="12px" height="30px" animate={false} />
                    <SkeletonBar width="12px" height="40px" animate={false} />
                </Stack>

                <SkeletonBar width="12px" height="80px" />

                <Stack childMargin="0px 4px">
                    <SkeletonBar width="12px" height="20px" animate={false} />
                    <SkeletonBar width="12px" height="50px" animate={false} />
                    <SkeletonBar width="12px" height="70px" animate={false} />
                    <SkeletonBar width="12px" height="30px" animate={false} />
                </Stack>

                <Stack childMargin="0px 4px">
                    <SkeletonBar width="12px" height="120px" animate={false} />
                    <SkeletonBar width="12px" height="150px" animate={false} />
                    <SkeletonBar width="12px" height="200px" animate={false} />
                    <SkeletonBar width="12px" height="170px" animate={false} />
                    <SkeletonBar width="12px" height="80px" animate={false} />
                </Stack>

                <Stack childMargin="0px 4px">
                    <SkeletonBar width="12px" height="100px" animate={false} />
                    <SkeletonBar width="12px" height="180px" animate={false} />
                    <SkeletonBar width="12px" height="30px" animate={false} />
                    <SkeletonBar width="12px" height="10px" animate={false} />
                </Stack>
                <SkeletonBar width="12px" height="30px" />
                <Stack childMargin="0px 4px">
                    <SkeletonBar width="12px" height="10px" animate={false} />
                    <SkeletonBar width="12px" height="30px" animate={false} />
                    <SkeletonBar width="12px" height="70px" animate={false} />
                </Stack>
            </Spread>
            <SkeletonRectangle height="2px" width="100%" animate={animate} />
            <Spread spaceAround margin="12px 0px 50px 0px">
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
