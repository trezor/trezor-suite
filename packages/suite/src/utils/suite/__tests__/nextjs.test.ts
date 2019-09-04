import { resolveStaticPath } from '../nextjs';

test('resolve static path', () => {
    expect(resolveStaticPath('mypath')).toBe('/static/mypath');
});
