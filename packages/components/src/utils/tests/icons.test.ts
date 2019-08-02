import { getStateIcon } from '../icons';

test('Icons', () => {
    expect(getStateIcon('info')).toBe('INFO');
    expect(getStateIcon('error')).toBe('ERROR');
    expect(getStateIcon('warning')).toBe('WARNING');
    expect(getStateIcon('success')).toBe('SUCCESS');
    expect(getStateIcon()).toBe(null);
});
