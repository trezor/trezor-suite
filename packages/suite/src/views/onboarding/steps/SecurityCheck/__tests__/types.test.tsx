import { Icon } from '@trezor/components';

import { SecurityChecklistItem } from '../types';

describe('SecurityChecklistItem', () => {
    describe('type tests', () => {
        it("should not accept icon: 'string' as an icon prop", () => {
            const x: SecurityChecklistItem = {
                // @ts-expect-error: this should correctly throw a TS error - it cannot be a string
                icon: 'string',
                content: <div />,
            };

            expect(x).toBeTruthy();
        });

        it('should accept icon: ReactElement<<Icon />> as an icon prop', () => {
            const x: SecurityChecklistItem = {
                icon: <Icon name="hologram" />,
                content: <div />,
            };

            expect(x).toBeTruthy();
        });
    });
});
