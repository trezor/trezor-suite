import { act, render } from '@testing-library/react';

import { fixtures } from './__fixtures__/useCountdownTimer';
import { useCountdownTimer } from './useCountdownTimer';

type Result = ReturnType<typeof useCountdownTimer>;

const Component = ({
    params,
    callback,
}: {
    params: Parameters<typeof useCountdownTimer>;
    callback: (res: Result) => void;
}) => {
    const result = useCountdownTimer(...params);
    callback(result);

    return null;
};

describe('useCountdownTimer', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    fixtures.forEach(({ desc, duration, options, expected }) => {
        it(desc, () => {
            let result: Result = {
                duration: {},
                isPastDeadline: false,
            };

            const params: Parameters<typeof useCountdownTimer> = options
                ? [Date.now() + duration, options]
                : [Date.now() + duration];

            const { unmount } = render(
                <Component params={params} callback={res => (result = res)} />,
            );

            act(() => {
                jest.advanceTimersByTime(1000);
            });

            expect(result).toEqual(expected);
            unmount();
        });
    });
});
