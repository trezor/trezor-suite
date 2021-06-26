import React from 'react';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProviders, findByTestId } from '@suite/support/tests/hooksHelper';
import PrerequisitesGuide from '..';

// react-svg will not work
jest.mock('react-svg', () => ({ ReactSVG: () => 'SVG' }));
// render only Translation.id in data-test attribute
jest.mock('@suite-components/Translation', () => ({
    Translation: ({ id }: any) => <div data-test={id}>{id}</div>,
}));
// jest.mock('@firmware-components/ReconnectDevicePrompt', () => ({
//     __esModule: true, // export as module
//     default: ({ children }: any) => <div data-test="box">{children}</div>,
// }));
// jest.mock('@onboarding-components/DeviceAnimation', () => ({
//     __esModule: true, // export as module
//     default: ({ children }: any) => <div data-test="box">{children}</div>,
// }));
// do not render animations
// jest.mock('lottie-react', () => ({
//     // Lottie: ({ trezorVersion }: any) => <div>{trezorVersion}</div>,
//     __esModule: true, // export as module
//     default: ({ trezorVersion }: any) => <div data-test="lottie-image">{trezorVersion}</div>,
// }));
// jest.mock('react-use/lib/useMeasure', () => ({
//     // Lottie: ({ trezorVersion }: any) => <div>{trezorVersion}</div>,
//     __esModule: true, // export as module
//     default: () => ['ref', { height: 0 }],
// }));
// jest.mock('react-spring', () => ({
//     config: {
//         default: {},
//     },
//     animated: {
//         div: (props: any) => <div data-test={props['data-test']}>{props.children}</div>,
//     },
//     useSpring: () => ({}),
// }));

export const getInitialState = () => ({
    suite: {
        settings: { debug: {}, theme: { variant: 'light' } },
        online: true,
        locks: [],
    },
});

type State = ReturnType<typeof getInitialState>;
const mockStore = configureStore<State, any>([thunk]);

const initStore = (state: State) => {
    const store = mockStore(state);
    return store;
};

describe('PrerequisitesGuide component', () => {
    it('No transport', () => {
        const store = initStore(getInitialState());
        const { unmount } = renderWithProviders(
            store,
            <PrerequisitesGuide prerequisite="transport-bridge" />,
        );
        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_TREZOR_BRIDGE_IS_NOT_RUNNING')).not.toBeNull();

        unmount();
    });

    it('Bridge transport, no device', () => {
        const store = initStore(getInitialState());
        const { unmount } = renderWithProviders(
            store,
            <PrerequisitesGuide prerequisite="device-disconnected" />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_STILL_DONT_SEE_YOUR_TREZOR')).not.toBeNull();

        unmount();
    });

    // it('WebUSB transport, no device', () => {
    //     const store = initStore(getInitialState());
    //     const { unmount } = renderWithProviders(
    //         store,
    //         <PrerequisitesGuide transport={{}} precondition="transport-bridge" />,
    //     );
    // });

    it('Bootloader device with firmware', () => {
        const store = initStore(getInitialState());
        const { unmount } = renderWithProviders(
            store,
            <PrerequisitesGuide prerequisite="device-bootloader" />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_DEVICE_IN_BOOTLOADER')).not.toBeNull();

        unmount();
    });

    // it('Bootloader device without firmware', () => {
    //     const store = initStore(getInitialState());
    //     const { unmount } = renderWithProviders(
    //         store,
    //         <PrerequisitesGuide precondition="device-bootloader" />,
    //     );

    //     expect(findByTestId('@connect-device-prompt')).not.toBeNull();
    //     expect(findByTestId('TR_DEVICE_IN_BOOTLOADER')).not.toBeNull();

    //     unmount();
    // });

    // it('Unacquired device', () => {
    //     const store = initStore(getInitialState());
    //     const { unmount } = renderWithProviders(
    //         store,
    //         <PrerequisitesGuide precondition="device-bootloader" />,
    //     );

    //     expect(findByTestId('@connect-device-prompt')).not.toBeNull();
    //     expect(findByTestId('TR_DEVICE_IN_BOOTLOADER')).not.toBeNull();

    //     unmount();
    // });

    // it('Not initialized device', () => {
    //     const store = initStore(getInitialState());
    //     const { unmount } = renderWithProviders(
    //         store,
    //         <PrerequisitesGuide precondition="device-bootloader" />,
    //     );

    //     expect(findByTestId('@connect-device-prompt')).not.toBeNull();
    //     expect(findByTestId('TR_DEVICE_IN_BOOTLOADER')).not.toBeNull();

    //     unmount();
    // });

    // it('Unknown device', () => {
    //     const store = initStore(getInitialState());
    //     const { unmount } = renderWithProviders(
    //         store,
    //         <PrerequisitesGuide precondition="device-bootloader" />,
    //     );

    //     expect(findByTestId('@connect-device-prompt')).not.toBeNull();
    //     expect(findByTestId('TR_DEVICE_IN_BOOTLOADER')).not.toBeNull();

    //     unmount();
    // });

    // it('Recovery mode device', () => {
    //     const store = initStore(getInitialState());
    //     const { unmount } = renderWithProviders(
    //         store,
    //         <PrerequisitesGuide precondition="device-bootloader" />,
    //     );

    //     expect(findByTestId('@connect-device-prompt')).not.toBeNull();
    //     expect(findByTestId('TR_DEVICE_IN_BOOTLOADER')).not.toBeNull();

    //     unmount();
    // });

    // it('Required FW update device', () => {
    //     const store = initStore(getInitialState());
    //     const { unmount } = renderWithProviders(
    //         store,
    //         <PrerequisitesGuide precondition="device-bootloader" />,
    //     );

    //     expect(findByTestId('@connect-device-prompt')).not.toBeNull();
    //     expect(findByTestId('TR_DEVICE_IN_BOOTLOADER')).not.toBeNull();

    //     unmount();
    // });

    it('Unreadable device', () => {
        const store = initStore(getInitialState());
        const { unmount } = renderWithProviders(
            store,
            <PrerequisitesGuide prerequisite="device-unreadable" />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_YOUR_DEVICE_IS_CONNECTED_BUT_UNREADABLE')).not.toBeNull();

        unmount();
    });

    it('Seedless device', () => {
        const store = initStore(getInitialState());
        const { unmount } = renderWithProviders(
            store,
            <PrerequisitesGuide prerequisite="device-seedless" />,
        );

        expect(findByTestId('@connect-device-prompt')).not.toBeNull();
        expect(findByTestId('TR_YOUR_DEVICE_IS_SEEDLESS')).not.toBeNull();

        unmount();
    });
});
