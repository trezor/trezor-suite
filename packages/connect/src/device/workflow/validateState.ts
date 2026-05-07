import { DEVICE, UI_REQUEST, createDeviceMessage, createUiMessage } from '@trezor/connect-common';
import type { StaticSessionId } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { createStaticSessionId, parseStaticSessionId } from '@trezor/device-utils';

import type { WorkflowContext } from '../../types/workflow';
import { toHardened } from '../../utils/pathUtils';
import { createThpSession } from '../thp';

const getStaticSessionId = (device: WorkflowContext['device']) =>
    device
        .getCurrentSession()
        .typedCall('GetAddress', 'Address', {
            address_n: [toHardened(44), toHardened(1), toHardened(0), 0, 0],
            coin_name: 'Testnet',
            script_type: 'SPENDADDRESS',
        })
        .then(({ message }) =>
            createStaticSessionId({
                firstTestnetAddress: message.address,
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

// Treat two states as "unexpected" if they describe different (firstTestnetAddress, deviceId)
// pairs. Instance is intentionally ignored — the same wallet can be referenced through
// different host-side instance numbers across reconnects.
const isUnexpectedState = (expected?: StaticSessionId, current?: StaticSessionId) => {
    if (!expected || !current) return false;
    const parsedExpected = parseStaticSessionId(expected);
    const parsedCurrent = parseStaticSessionId(current);

    return (
        parsedExpected.firstTestnetAddress !== parsedCurrent.firstTestnetAddress ||
        parsedExpected.deviceId !== parsedCurrent.deviceId
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

    if (!expectedState) {
        device.setState({ staticSessionId: uniqueState });
    }
};

export const validateState = async (context: WorkflowContext) => {
    const { device, sendCoreMessage } = context;

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
        sendCoreMessage(createDeviceMessage(DEVICE.CHANGED, device.toMessageObject()));
    }
};
