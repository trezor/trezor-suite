import { act, render } from '@testing-library/react';
import { fixtures } from 'src/hooks/suite/__fixtures__/useCountdownTimer';
import { useCountdownTimer } from 'src/hooks/suite/useCountdownTimer';

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
    fixtures.forEach(({ desc, duration, expected }) => {
        it(desc, () => {
            jest.useFakeTimers();

            let result: Result = {
                duration: {},
                isPastDeadline: false,
            };

            const { unmount } = render(
                <Component params={[Date.now() + duration]} callback={res => (result = res)} />,
            );

            act(() => {
                jest.advanceTimersToNextTimer(1000); // wait 1 second
            });

            expect(result).toEqual(expected);
            unmount();
        });
    });
});
