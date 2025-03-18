import { renderWithBasicProvider } from '@suite-native/test-utils';

import { AccountAddress } from '../AccountAddress';

describe('AccountAddress', () => {
    describe('full form', () => {
        it('should render full address', () => {
            const { getByText } = renderWithBasicProvider(
                <AccountAddress address="0x1234567890abcdef" />,
            );

            expect(getByText('0x1234567890abcdef')).toBeDefined();
        });
    });

    describe('short form', () => {
        it('should render address with ellipsis', () => {
            const { getByText } = renderWithBasicProvider(
                <AccountAddress address="0x1234567890abcdef" form="short" />,
            );

            expect(getByText('0x123456...')).toBeDefined();
        });

        it('should render full address when it is shorter than 9 characters', () => {
            const { getByText } = renderWithBasicProvider(<AccountAddress address="0x123456" />);

            expect(getByText('0x123456')).toBeDefined();
        });
    });
});
