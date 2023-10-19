import { createCooldown } from '../src/createCooldown';

it('createCooldown', () => {
    jest.useFakeTimers('modern');

    const cooldown = createCooldown(20);
    expect(cooldown()).toBe(true);
    expect(cooldown()).toBe(false);
    jest.advanceTimersByTime(10);
    expect(cooldown()).toBe(false);
    jest.advanceTimersByTime(10);
    expect(cooldown()).toBe(true);
    jest.advanceTimersByTime(5);
    expect(cooldown()).toBe(false);
});
