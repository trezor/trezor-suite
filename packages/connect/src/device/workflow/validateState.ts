import { ERRORS } from '../../constants';
import { DataManager } from '../../data/DataManager';
import { DEVICE, UI, createDeviceMessage, createUiMessage } from '../../events';
import { StaticSessionId } from '../../types';
import { WorkflowContext } from '../../types/workflow';
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
        .then(
            ({ message }) =>
                `${message.address}@${device.features.device_id}:${device.getInstance()}` as StaticSessionId,
        );

const getState = async ({ device, method }: WorkflowContext) => {
    if (!device.features) return;

    if (!device.features.unlocked && method.preauthorized) {
        // NOTE: auto locked device accepts preauthorized methods (authorizeConjoin, getOwnershipProof, signTransaction) without pin request.
        // in that case it's enough to check if session_id is preauthorized...
        // add-abort-signal
        if (await device.getCommands().preauthorize(false)) {
            return;
        }
        // ...and if it's not then unlock device and proceed to regular GetAddress flow
    }

    const expectedState = device.getState()?.staticSessionId;

    // add-abort-signal

    const uniqueState = await getStaticSessionId(device);
    if (device.features.session_id) {
        device.setState({ sessionId: device.features.session_id });
    }
    // Ignore instance ID, it doesn't necessarily need to match the current instance
    if (expectedState && expectedState.split(':')[0] !== uniqueState.split(':')[0]) {
        return uniqueState;
    }
    if (!expectedState || expectedState !== uniqueState) {
        device.setState({ staticSessionId: uniqueState });
    }
};

const MAX_PIN_TRIES = 3;

/** Including up to 3 pin tries **/
const getInvalidDeviceState = async (
    context: WorkflowContext,
): Promise<StaticSessionId | undefined> => {
    for (let i = 0; i < MAX_PIN_TRIES - 1; ++i) {
        try {
            return await getState(context);
        } catch (error) {
            if (error.message.includes('PIN invalid')) {
                context.method.postMessage(
                    createUiMessage(UI.INVALID_PIN, { device: context.device.toMessageObject() }),
                );
            } else {
                throw error;
            }
        }
    }

    // eslint-disable-next-line no-restricted-syntax
    return getState(context).catch(error => {
        if (error.message.includes('PIN invalid')) {
            context.method.postMessage(
                createUiMessage(UI.INVALID_PIN_ATTEMPTS_DEPLETED, {
                    device: context.device.toMessageObject(),
                }),
            );
        }
        throw error;
    });
};

const getInvalidThpDeviceState = async (context: WorkflowContext) => {
    const { device, method } = context;
    const currentState = device.getState();
    const expectedState = currentState?.staticSessionId;
    const expectedSessionId = currentState?.sessionId
        ? Buffer.from(currentState.sessionId, 'hex')
        : undefined;
    let uniqueState;
    const thpState = device.getThpState()!;
    if (expectedSessionId) {
        // validate that expected ThpSession still exists
        thpState.setSessionId(expectedSessionId);
        uniqueState = await getStaticSessionId(device).catch(e => {
            if (e.code === 'Failure_InvalidSession') {
                // requested sessionId is not valid, reset setSessionId
                device.setState({
                    sessionId: undefined,
                    deriveCardano: undefined,
                });
                thpState?.setSessionId(Buffer.alloc(1));

                return undefined;
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

    if (expectedState && expectedState !== uniqueState) {
        return uniqueState;
    }

    if (!expectedState) {
        device.setState({ staticSessionId: uniqueState });
    }
};

export const validateState = async (context: WorkflowContext) => {
    const { device, method } = context;
    if (!method.useDeviceState) {
        return;
    }

    const validate =
        device.protocol.name === 'v2' ? getInvalidThpDeviceState : getInvalidDeviceState;

    // Make sure that device will display pin/passphrase
    const isDeviceUnlocked = device.features.unlocked;
    const isUsingPopup = DataManager.getSettings('popup');
    try {
        let invalidDeviceState = await validate(context);
        if (isUsingPopup) {
            while (invalidDeviceState) {
                const uiPromise = method.createUiPromise(UI.INVALID_PASSPHRASE_ACTION, device);
                // request action view
                method.postMessage(
                    createUiMessage(UI.INVALID_PASSPHRASE, {
                        device: device.toMessageObject(),
                    }),
                );

                // wait for user response
                const uiResp = await uiPromise.promise;
                if (uiResp.payload) {
                    // reset sessionId and try again
                    device.setState({ sessionId: undefined });
                    await device.initialize(method.useCardanoDerivation);

                    invalidDeviceState = await validate(context);
                } else {
                    // set new state as requested
                    device.setState({ staticSessionId: invalidDeviceState });
                    break;
                }
            }
        } else if (invalidDeviceState) {
            throw ERRORS.TypedError('Device_InvalidState');
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
        method.postMessage(createDeviceMessage(DEVICE.CHANGED, device.toMessageObject()));
    }
};
