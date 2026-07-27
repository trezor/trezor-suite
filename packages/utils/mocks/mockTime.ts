let timeMocked = false;

export const mockTime = async () => {
    jest.useFakeTimers();
    timeMocked = true;

    await jest.advanceTimersToNextTimerAsync();
    while (timeMocked && jest.getTimerCount()) {
        await jest.advanceTimersToNextTimerAsync();
    }
};

export const unmockTime = () => {
    timeMocked = false;
    jest.useRealTimers();
};
