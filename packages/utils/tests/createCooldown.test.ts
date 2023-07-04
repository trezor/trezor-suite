import { createCooldown } from '../src/createCooldown';
import { createTimeoutPromise } from '../src/createTimeoutPromise';

it('createCooldown', async () => {
    const cooldown = createCooldown(20);
    expect(cooldown()).toBe(true);
    expect(cooldown()).toBe(false);
    await createTimeoutPromise(10);
    expect(cooldown()).toBe(false);
    await createTimeoutPromise(15);
    expect(cooldown()).toBe(true);
    await createTimeoutPromise(5);
    expect(cooldown()).toBe(false);
});
