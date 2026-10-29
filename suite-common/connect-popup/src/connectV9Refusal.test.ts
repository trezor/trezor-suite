import {
    Feature,
    type MessageSystemRootState,
    messageSystemInitialState,
} from '@suite-common/message-system';

import { CALL_SOURCE_DEEPLINK, CALL_SOURCE_WEB, type ConnectCallSource } from './connectPopupTypes';
import { selectConnectV9RefusalMessage } from './connectV9Refusal';

const DEFAULT_REFUSAL_MESSAGE =
    'Trezor Suite declined this request from an app that uses Trezor Connect 9. Ask the app developer to update to Trezor Connect 10.';

type RefusalFeature = {
    flag?: boolean;
    content?: string;
};

// A message-system store whose config carries the connect.v9.refuse feature message.
const createState = (feature?: RefusalFeature): Partial<MessageSystemRootState> => {
    if (!feature) return {};

    const message = {
        id: 'connect-v9-refusal',
        priority: 0,
        content: { en: feature.content ?? '' },
        feature: [{ domain: Feature.connectV9.refuse, flag: feature.flag }],
    };

    return {
        messageSystem: {
            ...messageSystemInitialState,
            config: { actions: [{ message }] },
            validMessages: { ...messageSystemInitialState.validMessages, feature: [message.id] },
        },
    } as unknown as MessageSystemRootState;
};

const connectV9Source: ConnectCallSource = {
    type: CALL_SOURCE_WEB,
    origin: 'https://example.com',
    manifest: { appName: 'App', npmVersion: '9.7.3' },
};

const guessedConnectV9Deeplink: ConnectCallSource = {
    type: CALL_SOURCE_DEEPLINK,
    origin: 'myapp://callback',
    manifest: { appName: 'App' },
    isConnectV9: true,
    isConnectV9Certain: false,
};

describe('selectConnectV9RefusalMessage', () => {
    it('declines a call from a Connect 9 app with the configured text', () => {
        expect(
            selectConnectV9RefusalMessage(
                createState({ flag: true, content: 'Update to Connect 10.' }),
                connectV9Source,
            ),
        ).toBe('Update to Connect 10.');
    });

    it('declines with a default text when the feature message has none', () => {
        expect(selectConnectV9RefusalMessage(createState({ flag: true }), connectV9Source)).toBe(
            DEFAULT_REFUSAL_MESSAGE,
        );
    });

    it.each<[string, Partial<MessageSystemRootState>]>([
        ['there is no message system', {}],
        ['the config has no connect.v9.refuse message', createState()],
        ['the feature message does not have the flag', createState({})],
        ['the flag is false', createState({ flag: false })],
    ])('declines no call while %s', (_, state) => {
        expect(selectConnectV9RefusalMessage(state, connectV9Source)).toBeUndefined();
    });

    it('declines no call from an app that is not a Connect 9 one', () => {
        expect(
            selectConnectV9RefusalMessage(createState({ flag: true }), {
                ...connectV9Source,
                manifest: { appName: 'App', npmVersion: '10.0.0' },
            }),
        ).toBeUndefined();
    });

    // The call id alone is a hint for the deprecation notice, not a reason to turn an app away.
    it('declines no deeplink call that is only guessed to be a Connect 9 one', () => {
        expect(
            selectConnectV9RefusalMessage(createState({ flag: true }), guessedConnectV9Deeplink),
        ).toBeUndefined();
    });
});
