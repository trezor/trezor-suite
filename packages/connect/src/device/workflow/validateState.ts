import { UI_REQUEST, createUiMessage } from '@trezor/connect-common';
import type { StaticSessionId } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { toHardenedPathPart } from '@trezor/crypto-utils';
import { createStaticSessionId, parseStaticSessionId } from '@trezor/device-utils';

import type { WorkflowContext } from '../../types/workflow';
import { createThpSession } from '../thp';

const getStaticSessionId = (device: WorkflowContext['device']) =>
    device
        .getCurrentSession()
        .typedCall('GetAddress', 'Address', {
            address_n: [toHardenedPathPart(44), toHardenedPathPart(1), toHardenedPathPart(0), 0, 0],
            coin_name: 'Testnet',
            script_type: 'SPENDADDRESS',
        })
        .then(({ message }) =>
            createStaticSessionId({
                walletDescriptor: message.address,
                deviceId: device.features.device_id!,
                instance: device.getInstance(),
            }),
        );

const preauthorizeState = ({ device, method }: WorkflowContext) => {
    if (!device.features.unlocked && method.preauthorized) {
        // NOTE: auto locked device accepts preauthorized methods (authorizeConjoin, getOwnershipProof, signTransaction) without pin request.
        // in that case it's enough to check if session_id is preauthorized...
        // add-abort-signal
        return device.getCommands().preauthorize(false);
        // ...and if it's not then unlock device and proceed to regular GetAddress flow
    }
};

// A state is "unexpected" only when it describes a DIFFERENT wallet, i.e. a different
// `walletDescriptor`. The descriptor is the first Testnet address (44'/1'/0'/0/0), a pure
// function of (seed, passphrase), so a mismatch is exactly what the "Passphrase is incorrect"
// (Device_InvalidState) guard exists to catch: a passphrase/seed that derives a wallet the host
// did not expect.
//
// `deviceId` and `instance` are intentionally NOT compared:
//   - A differing `deviceId` with the same `walletDescriptor` is the same wallet on a
//     re-provisioned device — wiping and recovering the same seed mints a fresh hardware
//     `device_id`. Reporting that as "Passphrase is incorrect" (as an earlier revision did) is
//     wrong: the passphrase is fine, only the device identity changed. Physical-device selection
//     is enforced upstream in `DeviceList.getDeviceByStaticState`, not here.
//   - `instance` is a host-side number that can differ across reconnects for the same wallet.
export const isUnexpectedState = (expected?: StaticSessionId, current?: StaticSessionId) => {
    if (!expected || !current) return false;

    return (
        parseStaticSessionId(expected).walletDescriptor !==
        parseStaticSessionId(current).walletDescriptor
    );
};

const validate = async (context: WorkflowContext) => {
    const { device } = context;
    if (!device.features) return;

    if (await preauthorizeState(context)) {
        return;
    }

    const expectedState = device.getState()?.staticSessionId;

    // add-abort-signal

    const uniqueState = await getStaticSessionId(device);
    if (device.features.session_id) {
        device.setState({ sessionId: device.features.session_id });
    }

    if (isUnexpectedState(expectedState, uniqueState)) {
        throw ERRORS.TypedError('Device_InvalidState');
    }
    if (!expectedState || expectedState !== uniqueState) {
        device.setState({ staticSessionId: uniqueState });
    }
};

const MAX_PIN_TRIES = 3;

/** Including up to 3 pin tries **/
const validateDeviceState = async (context: WorkflowContext) => {
    for (let i = 0; i < MAX_PIN_TRIES - 1; ++i) {
        try {
            return await validate(context);
        } catch (error) {
            if (error.message.includes('PIN invalid')) {
                context.sendCoreMessage(
                    createUiMessage(UI_REQUEST.INVALID_PIN, {
                        device: context.device.toMessageObject(),
                    }),
                );
            } else {
                throw error;
            }
        }
    }

    return validate(context).catch(error => {
        if (error.message.includes('PIN invalid')) {
            context.sendCoreMessage(
                createUiMessage(UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED, {
                    device: context.device.toMessageObject(),
                }),
            );
        }
        throw error;
    });
};

const validateThpDeviceState = async (context: WorkflowContext) => {
    const { device, method } = context;
    const currentState = device.getState();
    const expectedState = currentState?.staticSessionId;
    const expectedSessionId = currentState?.sessionId
        ? Buffer.from(currentState.sessionId, 'hex')
        : undefined;

    if (await preauthorizeState(context)) {
        return;
    }

    let uniqueState;
    const thpState = device.getThpState()!;
    if (expectedSessionId) {
        // validate that expected ThpSession still exists
        thpState.setSessionId(expectedSessionId);
        uniqueState = await getStaticSessionId(device).catch(e => {
            switch (e.code) {
                case 'Failure_PinCancelled':
                    // user cancelled pin on device
                    throw e;
                case 'Failure_InvalidSession':
                default:
                    // TODO why not to throw?
                    return undefined;
            }
        });

        if (isUnexpectedState(expectedState, uniqueState)) {
            // there is unexpected passphrase on given sessionId, ignore returned state
            uniqueState = undefined;
        }

        if (!uniqueState) {
            // requested sessionId is unknown or there was another passphrase, reset sessionId
            device.setState({ sessionId: undefined, deriveCardano: undefined });
            thpState?.setSessionId(Buffer.alloc(1));
        }
    }

    if (!uniqueState && !device.features.unlocked) {
        // we don't have a sessionId yet and device is locked by pin.
        // try to get staticSessionId (GetAddress) on the "seedless session" to display PIN matrix on the device.
        // Failure_InvalidSession is expected here, because seedless session is not authorized to call GetAddress.
        // This basically means the device is successfully unlocked. (failed successfully)
        await getStaticSessionId(device).catch(e => {
            if (e.code !== 'Failure_InvalidSession') {
                throw e;
            }
        });
    }

    if (!uniqueState || (!currentState?.deriveCardano && method.useCardanoDerivation)) {
        const newSessionId = thpState.createNewSessionId();

        await createThpSession(device, method.useCardanoDerivation);
        uniqueState = await getStaticSessionId(device);
        device.setState({
            sessionId: newSessionId.toString('hex'),
            deriveCardano: method.useCardanoDerivation,
        });
    }

    if (isUnexpectedState(expectedState, uniqueState)) {
        throw ERRORS.TypedError('Device_InvalidState');
    }

    // Mirror the non-THP `validate` above: refresh the saved state whenever it changed, not only
    // when it was absent. Reaching here means the wallet matches (a differing `walletDescriptor`
    // would have thrown), so a difference is a benign `deviceId` change from a re-provisioned
    // device — adopt it, otherwise `getState()`/`getDeviceState` would keep leaking the stale
    // `device_id` and later state-only calls would miss in `getDeviceByStaticState`.
    if (!expectedState || expectedState !== uniqueState) {
        device.setState({ staticSessionId: uniqueState });
    }
};

export const validateState = async (context: WorkflowContext) => {
    const { device } = context;

    // Make sure that device will display pin/passphrase
    const isDeviceUnlocked = device.features.unlocked;

    try {
        if (device.protocol.name === 'v2') {
            await validateThpDeviceState(context);
        } else {
            await validateDeviceState(context);
        }
    } catch (error) {
        // other error
        // sendCoreMessage(ResponseMessage(method.responseID, false, { error }));
        // closePopup();
        // clear cached passphrase. it's not valid
        device.setState({ sessionId: undefined });

        // interrupt process and go to "final" block
        return Promise.reject(error);
    }

    // emit additional CHANGE event if device becomes unlocked after authorization
    // features were automatically updated after PinMatrixAck in DeviceCommands
    if (!isDeviceUnlocked && device.features.unlocked) {
        device.emitDeviceChanged();
    }
};
