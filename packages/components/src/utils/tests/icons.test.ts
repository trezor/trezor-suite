import icons from '../../config/icons';
import { getStateIcon } from '../icons';

test('Icons', () => {
    expect(getStateIcon('info')).toBe(icons.INFO);
    expect(getStateIcon('error')).toBe(icons.ERROR);
    expect(getStateIcon('warning')).toBe(icons.WARNING);
    expect(getStateIcon('success')).toBe(icons.SUCCESS);
    expect(getStateIcon()).toBe(null);
});
