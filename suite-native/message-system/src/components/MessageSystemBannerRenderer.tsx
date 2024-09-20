import { useSelector } from 'react-redux';

import { A } from '@mobily/ts-belt';

import { VStack } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    selectActiveBannerMessages,
    selectMessageSystemConfig,
} from '@suite-common/message-system';
import { useOfflineBannerAwareSafeAreaInsets } from '@suite-native/connection-status';
import { selectDeviceEnabledDiscoveryNetworkSymbols } from '@suite-native/discovery';
import { Message } from '@suite-common/suite-types';

import { MessageBanner } from './MessageBanner';

const messageBannerContainerStyle = prepareNativeStyle<{ topSafeAreaInset: number }>(
    (_, { topSafeAreaInset }) => ({
        marginTop: topSafeAreaInset,
    }),
);

export const MessageSystemBannerRenderer = () => {
    const { applyStyle } = useNativeStyles();
    const { top: topSafeAreaInset } = useOfflineBannerAwareSafeAreaInsets();

    const activeBannerMessages = useSelector(selectActiveBannerMessages);
    const enabledNetworks = useSelector(selectDeviceEnabledDiscoveryNetworkSymbols);
    const topInset = A.isNotEmpty(activeBannerMessages) ? topSafeAreaInset : 0;
    const configFull = useSelector(selectMessageSystemConfig);

    const config = `sequence: ${configFull?.sequence}, t: ${configFull?.timestamp}, content: ${configFull?.actions.map(a => `| ${a.message.content.en.substring(0, 25)}|`)}`;

    let messages: Message[] = [
        {
            id: 'xbfce56e-6b1b-4f88-8acc-38b9bc5dabeb',
            priority: 93,
            dismissible: true,
            variant: 'critical',
            category: 'banner',
            content: {
                'en-GB': `[${enabledNetworks}]`,
                en: `[${enabledNetworks}]`,
                es: `[${enabledNetworks}]`,
                cs: `[${enabledNetworks}]`,
                ru: `[${enabledNetworks}]`,
                ja: `[${enabledNetworks}]`,
                de: `[${enabledNetworks}]`,
                fr: `[${enabledNetworks}]`,
                it: `[${enabledNetworks}]`,
                pt: `[${enabledNetworks}]`,
                tr: `[${enabledNetworks}]`,
                uk: `[${enabledNetworks}]`,
                hu: `[${enabledNetworks}]`,
            },
        },
        {
            id: 'ddfce37e-6b9b-4f88-8acc-38b9bc5dabeb',
            priority: 94,
            dismissible: true,
            variant: 'info',
            category: 'banner',
            content: {
                'en-GB': `(${config})`,
                en: `(${config})`,
                es: `(${config})`,
                cs: `(${config})`,
                ru: `(${config})`,
                ja: `(${config})`,
                de: `(${config})`,
                fr: `(${config})`,
                it: `(${config})`,
                pt: `(${config})`,
                tr: `(${config})`,
                uk: `(${config})`,
                hu: `(${config})`,
            },
        },
    ];
    activeBannerMessages.map(m => messages.push(m));

    return (
        <VStack
            spacing={4}
            style={applyStyle(messageBannerContainerStyle, {
                topSafeAreaInset: topInset,
            })}
        >
            {messages.map(message => (
                <MessageBanner key={message.id} message={message} />
            ))}
        </VStack>
    );
};
