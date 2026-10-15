import { screen } from '@testing-library/react';

import { AddressCardDetail } from './AddressCardDetail';
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

describe(AddressCardDetail.name, () => {
    beforeEach(() => {
        Object.defineProperty(navigator, 'share', { value: jest.fn(), configurable: true });
    });

    it('shows the full address, QR code and enabled actions when receive is allowed', () => {
        renderReceiveComponent(
            <AddressCardDetail {...commonProps} {...getReceiveDisabledProps(false)} />,
        );

        expect(screen.getByText(ADDRESS)).toBeTruthy();
        expect(screen.getByTestId('@wallet/receive/qr-code')).toBeTruthy();
        expect(screen.getByTestId('@wallet/receive/copy-address-button')).toHaveProperty(
            'disabled',
            false,
        );
        expect(screen.getByTestId('@wallet/receive/share-address-button')).toHaveProperty(
            'disabled',
            false,
        );
        expect(screen.getByTestId('@wallet/receive/verify-address-button')).toHaveProperty(
            'disabled',
            false,
        );
    });

    it('obscures the address, hides the QR code and disables actions when receive is disabled', () => {
        renderReceiveComponent(
            <AddressCardDetail {...commonProps} {...getReceiveDisabledProps(true)} />,
        );

        expect(screen.getByText(OBSCURED_ADDRESS)).toBeTruthy();
        expect(screen.queryByText(ADDRESS)).toBeNull();
        expect(screen.queryByTestId('@wallet/receive/qr-code')).toBeNull();
        expect(screen.getByTestId('@wallet/receive/copy-address-button')).toHaveProperty(
            'disabled',
            true,
        );
        expect(screen.getByTestId('@wallet/receive/share-address-button')).toHaveProperty(
            'disabled',
            true,
        );
        expect(screen.getByTestId('@wallet/receive/verify-address-button')).toHaveProperty(
            'disabled',
            true,
        );
    });

    it('obscures the address shown under a label', () => {
        renderReceiveComponent(
            <AddressCardDetail
                {...commonProps}
                {...getReceiveDisabledProps(true)}
                item={{ ...item, label: 'Savings' }}
            />,
        );

        expect(screen.getByTestId('@wallet/receive/address').textContent).toBe(OBSCURED_ADDRESS);
        expect(screen.queryByText(ADDRESS)).toBeNull();
    });
});
