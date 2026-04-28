import { createHash, randomBytes } from 'crypto';

import type { UiResponseThpPairingTag } from '@trezor/connect-common';
import { DEVICE } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { ThpPairingMethod, thp as protocolThp } from '@trezor/protocol';
import { createDeferred } from '@trezor/utils';

import { abortThpWorkflow, thpCall } from './thpCall';
import { DataManager } from '../../data/DataManager';
import type { IDevice } from '../../types/idevice';
import { sanitizeString } from '../../utils/formatUtils';

const processQrCodeTag = async (device: IDevice, value: string) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    const tagSha = createHash('sha256')
        .update(thpState.handshakeCredentials.handshakeHash)
        .update(Buffer.from(value, 'hex'))
        .digest('hex');
    const qrCodeSecret = await thpCall(device, 'ThpQrCodeTag', {
        tag: tagSha,
    });

    protocolThp.validateQrCodeTag(
        thpState.handshakeCredentials,
        value,
        qrCodeSecret.message.secret,
    );

    return qrCodeSecret;
};

const processNfcTag = async (device: IDevice, value: string) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }
    if (!thpState?.nfcSecret) {
        throw new Error('missing nfcSecret');
    }

    const tagSha = createHash('sha256')
        .update(Buffer.from([protocolThp.ThpPairingMethod.NFC]))
        .update(thpState.handshakeCredentials.handshakeHash)
        .update(Buffer.from(value, 'hex'))
        .digest('hex');

    const nfcTagTrezor = await thpCall(device, 'ThpNfcTagHost', {
        tag: tagSha,
    });

    protocolThp.validateNfcTag(
        thpState.handshakeCredentials,
        nfcTagTrezor.message.tag,
        thpState.nfcSecret,
    );

    return nfcTagTrezor;
};

const processCodeEntry = async (device: IDevice, value: string) => {
    const codeValue = Buffer.from(value, 'ascii');

    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    const hostKeys = protocolThp.getCpaceHostKeys(
        codeValue,
        thpState.handshakeCredentials.handshakeHash,
    );
    const tag = protocolThp
        .getSharedSecret(thpState.handshakeCredentials.trezorCpacePublicKey, hostKeys.privateKey)
        .toString('hex');

    const codeEntrySecret = await thpCall(device, 'ThpCodeEntryCpaceHostTag', {
        tag,
        cpace_host_public_key: hostKeys.publicKey.toString('hex'),
    });

    protocolThp.validateCodeEntryTag(
        thpState.handshakeCredentials,
        value,
        codeEntrySecret.message.secret,
    );

    return codeEntrySecret;
};

const processThpPairingResponse = (
    device: IDevice,
    payload: UiResponseThpPairingTag['payload'],
) => {
    if ('selectedMethod' in payload) {
        // change pairing method
        const selectedMethod = protocolThp.getThpPairingMethod(payload.selectedMethod);
        device.getThpState()?.setPairingMethod(selectedMethod);

        return thpCall(device, 'ThpSelectMethod', {
            selected_pairing_method: selectedMethod,
        });
    }

    const selectedMethod = device.getThpState()?.pairingMethod;
    if (selectedMethod === ThpPairingMethod.QrCode) {
        return processQrCodeTag(device, payload.tag);
    }

    if (selectedMethod === ThpPairingMethod.NFC) {
        return processNfcTag(device, payload.tag);
    }

    if (selectedMethod === ThpPairingMethod.CodeEntry) {
        return processCodeEntry(device, payload.tag);
    }

    throw ERRORS.TypedError('Device_ThpPairingMethodsException');
};

const waitForPairingCancel = (device: IDevice) => {
    const readAbort = new AbortController();
    device.getThpState()?.setExpectedResponses([0x04]); // expect Cancel
    const readCancel = device.getCurrentSession().receive({ signal: readAbort.signal });

    return {
        readAbort,
        readCancel,
    };
};

const waitForPairingTag = async (device: IDevice) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }
    if (thpState.pairingMethod === undefined) {
        throw ERRORS.TypedError('Device_ThpPairingMethodsException');
    }

    const dfd = createDeferred<
        UiResponseThpPairingTag['payload'] | { error: ERRORS.TrezorError }
    >();

    // start listening for the Cancel message from Trezor
    const { readAbort, readCancel } = waitForPairingCancel(device);
    const cancelResult = readCancel
        .then(readResult => {
            if (readResult.success) {
                let code, message;
                const { payload } = readResult;
                if (payload.type === 'Failure') {
                    code = payload.message.code;
                    message = payload.message.message;
                } else {
                    message = `Unexpected message type: ${readResult.payload.type}`;
                }

                dfd.resolve({
                    error: ERRORS.TypedError(code || 'ThpUnknownError', message),
                });
            }
        })
        .catch(() => {
            // silent
        });

    thpState.setPairingTagPromise({
        abort: async () => {
            readAbort.abort();
            await cancelResult;
        },
    });

    // start listening for the UI response
    const payload = {
        availableMethods: thpState.handshakeCredentials.pairingMethods,
        selectedMethod: thpState.pairingMethod,
        nfcData: thpState.nfcData?.toString('hex'),
    };
    device.prompt(DEVICE.THP_PAIRING, { payload }).then(response => {
        if (response.success) {
            dfd.resolve(response.payload);
        } else {
            abortThpWorkflow(device).then(() => {
                dfd.resolve({
                    error: ERRORS.TypedError('ThpUnknownError', response.error.message),
                });
            });
        }
    });

    const pairingResponse = await dfd.promise;

    // wait for readCancel to finish reading
    readAbort.abort();
    await readCancel;

    thpState.setPairingTagPromise(undefined);

    if ('error' in pairingResponse) {
        throw pairingResponse.error;
    }

    // node-bridge + usb: abort received on client side of http request resolves faster than server. result with "device call in progress"
    await new Promise(resolve => setTimeout(resolve, 500));

    return processThpPairingResponse(device, pairingResponse).catch(e => {
        // catch pairing tag mismatch
        // DataError since 2.10.0 https://github.com/trezor/trezor-firmware/commit/b0c3be9b1d95946471ebdab27918a3f652cf11e9
        if (e.code === 'Failure_FirmwareError' || e.code === 'Failure_DataError') {
            if ('tag' in pairingResponse) {
                device.emit(DEVICE.THP_PAIRING_STATUS_CHANGED, {
                    status: 'invalid-tag',
                    tag: pairingResponse.tag,
                });
            }

            // 'Unexpected Code Entry Tag'
            throw ERRORS.TypedError('Device_ThpPairingTagInvalid', e.message);
        }

        throw ERRORS.TypedError(e.code, e.message);
    });
};

export const getThpCredentials = async (device: IDevice, autoconnect = false) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    const credentials = await thpCall(device, 'ThpCredentialRequest', {
        autoconnect,
        host_static_public_key: thpState.handshakeCredentials.hostStaticPublicKey.toString('hex'),
        credential: thpState.pairingCredentials[0]?.credential,
    });

    const host_static_key = thpState.handshakeCredentials.staticKey.toString('hex');

    return { ...credentials.message, autoconnect, host_static_key };
};

export const thpPairingEnd = async (device: IDevice) => {
    const result = await thpCall(device, 'ThpEndRequest', {});
    device.getThpState()?.setPhase('paired');

    return result;
};

// State HH2/HH3 -> HP0 -> HP1 -> HP2 -> HP3 -> HP4
// Workflow will require user interaction
// TODO: link-to-public-docs
// https://www.notion.so/satoshilabs/THP-Specification-2-1-203dc5260606804192aecaa58fb961ca
export const thpPairing = async (device: IDevice) => {
    const thpState = device.getThpState();
    if (!thpState?.handshakeCredentials) {
        throw ERRORS.TypedError('Device_ThpStateMissing');
    }

    // State HH2 and HH3 combined
    // if thpState.isPaired then transition to HC0 (credentials) otherwise transition to HP0 (pairing)
    if (thpState.isPaired && thpState.pairingMethod !== protocolThp.ThpPairingMethod.SkipPairing) {
        // State HC0
        if (!thpState.isAutoconnectPaired) {
            // device is paired but credentials may not be persistent
            // get new credentials to enforce ButtonRequest.thp_connection_request flow if necessary
            await getThpCredentials(device, false);
        }

        // State HC1 -> HC2 pairing complete
        return thpPairingEnd(device);
    }

    // use first pairing method from the list
    const [selected_pairing_method] = thpState.handshakeCredentials.pairingMethods;
    thpState.setPairingMethod(selected_pairing_method);

    // State HP0
    // ThpPairingRequest will trigger ButtonRequest.thp_pairing_request flow
    const settings = DataManager.getSettings('thp');
    await thpCall(device, 'ThpPairingRequest', {
        host_name: sanitizeString(settings?.hostName) || 'Unknown hostName',
        app_name: sanitizeString(settings?.appName) || 'Unknown appName',
    });

    // State HP1
    const selectMethod = await thpCall(device, 'ThpSelectMethod', { selected_pairing_method });

    // selected_pairing_method === ThpPairingMethod.SkipPairing
    if (selectMethod.type === 'ThpEndResponse') {
        thpState.setIsPaired(true);
        device.getThpState()?.setPhase('paired');

        return;
    }

    // State HP2
    if (selectMethod.type === 'ThpCodeEntryCommitment') {
        // store handshakeCommitment and validate later in `processCodeEntry`
        const codeEntryChallenge = randomBytes(32);
        const handshakeCommitment = Buffer.from(selectMethod.message.commitment, 'hex');
        thpState.updateHandshakeCredentials({
            handshakeCommitment,
            codeEntryChallenge,
        });

        // State HP3a
        const codeEntryCpace = await thpCall(device, 'ThpCodeEntryChallenge', {
            challenge: codeEntryChallenge.toString('hex'),
        });

        thpState.updateHandshakeCredentials({
            trezorCpacePublicKey: Buffer.from(
                codeEntryCpace.message.cpace_trezor_public_key,
                'hex',
            ),
        });

        // State HP4 -> HP5
        await waitForPairingTag(device);
    }

    if (selectMethod.type === 'ThpPairingPreparationsFinished') {
        if (thpState.pairingMethod === protocolThp.ThpPairingMethod.NFC) {
            // generate random secret and store it
            thpState.setNfcSecret(randomBytes(16));
        }

        // State HP6 and HP7
        await waitForPairingTag(device);
    }

    // State HC0
    // generate new credentials and send
    const credentials = await getThpCredentials(device, false);
    device.emit(DEVICE.THP_CREDENTIALS_CHANGED, {
        credentials,
    });
    const settings1 = DataManager.getSettings('thp');
    if (settings1) {
        settings1.knownCredentials?.push(credentials);
    }

    thpState.setPairingCredentials([credentials]);
    thpState.setIsPaired(true);

    await thpPairingEnd(device);
};
