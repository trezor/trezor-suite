import { redacted } from '../../src/utils/redacted';

test('redacted', () => {
    expect(redacted('~~bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0~~')).toEqual(
        'bcrt1qej...mt8ntmj0',
    );

    expect(
        redacted('addr: ~~bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0~~ in the middle'),
    ).toEqual('addr: bcrt1qej...mt8ntmj0 in the middle');

    expect(redacted('not redacted')).toEqual('not redacted');

    // @ts-expect-error
    expect(redacted({ message: 'not a string' })).toEqual('[object Object]');

    // @ts-expect-error
    expect(redacted(undefined)).toEqual('undefined');
});
