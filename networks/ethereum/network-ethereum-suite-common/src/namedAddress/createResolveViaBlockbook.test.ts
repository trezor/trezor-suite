import { createResolveViaBlockbook } from './createResolveViaBlockbook';

it('reads the current Connect implementation when resolving, not when constructing the resolver', async () => {
    const firstGetAccountInfo = jest.fn().mockResolvedValue({
        success: true,
        payload: { descriptor: 'first-address' },
    });
    const secondGetAccountInfo = jest.fn().mockResolvedValue({
        success: true,
        payload: { descriptor: 'second-address' },
    });
    let connect = { getAccountInfo: firstGetAccountInfo };
    const getTrezorConnect = jest.fn(() => connect);
    const resolveViaBlockbook = createResolveViaBlockbook({ getTrezorConnect });

    expect(getTrezorConnect).not.toHaveBeenCalled();
    await expect(resolveViaBlockbook('example.eth', 'eth')).resolves.toBe('first-address');

    connect = { ...connect, getAccountInfo: secondGetAccountInfo };
    await expect(resolveViaBlockbook('example.eth', 'eth')).resolves.toBe('second-address');
    expect(firstGetAccountInfo).toHaveBeenCalledTimes(1);
    expect(secondGetAccountInfo).toHaveBeenCalledWith({
        descriptor: 'example.eth',
        coin: 'eth',
        details: 'basic',
    });
});
