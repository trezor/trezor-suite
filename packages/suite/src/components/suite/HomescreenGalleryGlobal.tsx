import styled from 'styled-components';

import { useDevice } from '@suite/device';
import { notificationsActions } from '@suite-common/toast-notifications';
import { Grid } from '@trezor/components';
import { DeviceModelInternal, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { resolveStaticPath } from '@trezor/env-utils';
import { borders, spacings } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

import { getDefaultHomeScreenImage, getHomescreens } from 'src/constants/suite/homescreens';
import { useDispatch } from 'src/hooks/suite';
import { imagePathToHex } from 'src/utils/suite/homescreen';
import { runConnect } from 'src/views/settings/SettingsDebug/runConnect';
import { useConnectRun } from 'src/views/settings/SettingsDebug/useConnect';

type HomescreensType = ReturnType<typeof getHomescreens>;
type AnyImageName = HomescreensType[keyof HomescreensType][number];

const getHomescreenPath = (deviceModelInternal: DeviceModelInternal) => {
    switch (deviceModelInternal) {
        case DeviceModelInternal.T1B1:
        case DeviceModelInternal.T2B1:
        case DeviceModelInternal.T3B1:
            return 'BW_64x128';
        case DeviceModelInternal.T2T1:
        case DeviceModelInternal.T3T1:
        case DeviceModelInternal.UNKNOWN:
            return 'COLOR_240x240';
        case DeviceModelInternal.T3W1:
            return 'COLOR_520x380';
        default:
            return exhaustive(deviceModelInternal);
    }
};

const HomescreenImage = styled.img`
    display: block;
    width: 100%;
    cursor: pointer;
    border-radius: ${borders.radii.xs};
`;

type HomescreenGalleryGlobalProps = {
    onConfirm?: () => void;
};

/**
 * Variant of `HomescreenGallery` that drives the call locally via
 * `useConnectRun.startManual` and manually iterates the subprocess stream,
 * sending every event through `handleDefault` — which dispatches it as an
 * action so the existing global modal stack (`modalReducer` /
 * `DeviceContextModal`) renders. The component itself renders no modal.
 *
 * Smoke-tests: startManual + handleDefault + the global modal stack for a
 * callId-stamped call (which `connectInitThunks` will skip).
 */
export const HomescreenGalleryGlobal = ({ onConfirm }: HomescreenGalleryGlobalProps) => {
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();

    const { startManual, handleDefault } = useConnectRun(runConnect(c => c.applySettings));

    const deviceModelInternal = device?.features?.internal_model;

    if (!deviceModelInternal || !device) return null;

    const isBitcoinOnlyFirmware = hasBitcoinOnlyFirmware(device);
    const setHomescreen = async (imagePath: string, image: AnyImageName) => {
        if (isLocked()) return;

        const isOriginalImage =
            getDefaultHomeScreenImage({ deviceModelInternal, isBitcoinOnlyFirmware }) === image;

        const params = isOriginalImage
            ? { homescreen_length: 0 }
            : { homescreen: await imagePathToHex(imagePath, deviceModelInternal) };

        const proc = startManual(params);

        try {
            // Drive subprocess iteration manually; every event is routed to the
            // global modal stack via handleDefault. Runs in parallel with
            // proc.toPromise() — they observe the same process independently.

            for await (const sub of proc.run()) {
                handleDefault(sub);
            }
            dispatch(notificationsActions.addToast({ type: 'settings-applied' }));
            onConfirm?.();
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            if (message === 'Process cancelled') return;
            dispatch(notificationsActions.addToast({ type: 'error', error: message }));
        }
    };

    const homescreens = getHomescreens(isBitcoinOnlyFirmware);
    const path = getHomescreenPath(deviceModelInternal);
    const isColorScreen = path.startsWith('COLOR');

    return (
        <Grid gap={spacings.md} columns={4}>
            {homescreens[deviceModelInternal].map(image => {
                const src = resolveStaticPath(
                    `images/homescreens/${path}/${image}.${isColorScreen ? 'jpg' : 'png'}`,
                );

                return (
                    <HomescreenImage
                        id={image}
                        data-testid={`@modal/gallery-global/${path.toLowerCase()}/${image}`}
                        key={image}
                        onClick={() => setHomescreen(src, image)}
                        src={src}
                    />
                );
            })}
        </Grid>
    );
};
