import { screen } from '@testing-library/react';

import { AddressHistoryRow } from './AddressHistoryRow';
import {
    ADDRESS,
    OBSCURED_ADDRESS,
    commonProps,
    getReceiveDisabledProps,
    item,
    renderReceiveComponent,
} from '../mocks/mockReceiveAddressComponent';

/*
 This test is an important specification that the receive functionality must be disabled when device is compromised.
 It must be prevented from showing address, xpubs, buying = any UX flows serving to transfer funds TO device.

 However, the other direction (sending, selling, etc.) must NOT be restricted, allowing user to evacuate their funds to safety!
*/

jest.mock(
    '@suite/labeling',
    () => jest.requireActual('../mocks/mockReceiveAddressComponent').mockLabeling,
);

describe(AddressHistoryRow.name, () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'share', { value: jest.fn(), configurable: true });
    });

    const historyRowTestId = `@wallet/receive/used-address/${item.pathIndex}`;
    const renderHistoryRow = (isReceiveDisabled: boolean) =>
        renderReceiveComponent(
            <AddressHistoryRow
                {...commonProps}
                {...getReceiveDisabledProps(isReceiveDisabled)}
                AmountComponent={() => null}
            />,
        );

    it('shows the full address and enabled actions when receive is allowed', () => {
        renderHistoryRow(false);

        expect(screen.getByText(ADDRESS)).toBeTruthy();
        expect(screen.getByTestId(`${historyRowTestId}/copy-button`)).toHaveProperty(
            'disabled',
            false,
        );
        expect(screen.getByTestId(`${historyRowTestId}/share-button`)).toHaveProperty(
            'disabled',
            false,
        );
        expect(screen.getByTestId(`${historyRowTestId}/verify-button`)).toHaveProperty(
            'disabled',
            false,
        );
    });

    it('obscures the address and disables actions when receive is disabled', () => {
        renderHistoryRow(true);

        expect(screen.getByText(OBSCURED_ADDRESS)).toBeTruthy();
        expect(screen.queryByText(ADDRESS)).toBeNull();
        expect(screen.getByTestId(`${historyRowTestId}/copy-button`)).toHaveProperty(
            'disabled',
            true,
        );
        expect(screen.getByTestId(`${historyRowTestId}/share-button`)).toHaveProperty(
            'disabled',
            true,
        );
        expect(screen.getByTestId(`${historyRowTestId}/verify-button`)).toHaveProperty(
            'disabled',
            true,
        );
    });
});
