import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

const DotsWrapper = styled.span``;

const Dot = styled.span`
    &:before {
        content: '.';
    }
`;

interface Props {
    maxCount?: number;
    speed?: number;
}

const Dots = ({ maxCount = 3, speed = 1000 }: Props) => {
    const [count, setCount] = useState<number>(0);

    useEffect(() => {
        const timer = setInterval(() => {
            if (count < maxCount) {
                setCount(count + 1);
            } else {
                setCount(0);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [maxCount, speed, count]);

    return (
        <DotsWrapper>
            {Array.from(new Array(maxCount)).map(
                // @ts-ignore sorry, dont know how to ignore the first parameter I dont use.
                (item: number, index: number) => (
                    <Dot
                        // eslint-disable-next-line react/no-array-index-key
                        key={`dot-${index}`}
                        style={{ visibility: index < count ? 'visible' : 'hidden' }}
                    />
                ),
            )}
        </DotsWrapper>
    );
};

export default Dots;
