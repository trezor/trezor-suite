import { nativeFirmwareReducer } from '@suite-native/firmware';
import { AuthorizeDeviceStackRoutes, RootStackRoutes } from '@suite-native/navigation';
import { UI } from '@trezor/connect';

type NativeFirmwareState = ReturnType<typeof nativeFirmwareReducer>;

type GetInitialState = {
    nativeFirmware?: Partial<NativeFirmwareState>;
};

const getInitialState = ({ nativeFirmware }: GetInitialState) => ({
    nativeFirmware: {
        ...nativeFirmwareReducer(undefined, { type: 'foo' }),
        ...nativeFirmware,
    },
});

export const invalidThpPairingFixtures = [
    {
        description: 'should not react to any UI Request Button action',
        initialState: getInitialState({}),
        action: { type: UI.REQUEST_BUTTON },
    },
    {
        description: 'should not react to any UI Request Button action',
        initialState: getInitialState({}),
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'non-valid-name' } },
    },
    {
        description: 'should not react to any random action',
        initialState: getInitialState({}),
        action: { type: 'foo' },
    },

    {
        description:
            'should not redirect to THP pairing screen on thp_pairing_request action if FW install is running',
        initialState: getInitialState({
            nativeFirmware: {
                isFirmwareInstallationRunning: true,
            },
        }),
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'thp_pairing_request' } },
    },
    {
        description:
            'should not redirect to THP pairing screen on thp_connection_request action if FW install is running',
        initialState: getInitialState({
            nativeFirmware: {
                isFirmwareInstallationRunning: true,
            },
        }),
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'thp_connection_request' } },
    },
] as const;

export const validThpPairingFixtures = [
    {
        description: 'should redirect to THP pairing screen on thp_pairing_request action',
        initialState: getInitialState({}),
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'thp_pairing_request' } },
        redirectTarget: {
            route: RootStackRoutes.AuthorizeDeviceStack,
            params: {
                screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
            },
        },
    },
    {
        description: 'should redirect to THP pairing screen on thp_connection_request action',
        initialState: getInitialState({}),
        action: { type: UI.REQUEST_BUTTON, payload: { name: 'thp_connection_request' } },
        redirectTarget: {
            route: RootStackRoutes.AuthorizeDeviceStack,
            params: {
                screen: AuthorizeDeviceStackRoutes.ThpConfirmation,
            },
        },
    },
] as const;
