import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Box, HStack, Loader, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type EnsResolutionMessageProps = {
    isResolving: boolean;
    /** Onchain address the typed name resolved to. */
    resolvedAddress?: string;
    /** Primary name of the typed address, for a hex input that has one. */
    reverseResolvedName?: string;
};

export const EnsResolutionMessage = ({
    isResolving,
    resolvedAddress,
    reverseResolvedName,
}: EnsResolutionMessageProps) => {
    // A name being resolved outranks a previous result, and a name the user typed outranks the
    // reverse lookup that runs on every hex address.
    const message = (() => {
        if (isResolving) {
            return <Translation id="moduleSend.outputs.recipients.ens.resolving" />;
        }

        if (resolvedAddress) {
            return (
                <Translation
                    id="moduleSend.outputs.recipients.ens.walletAddress"
                    values={{ address: resolvedAddress }}
                />
            );
        }

        if (reverseResolvedName) {
            return (
                <Translation
                    id="moduleSend.outputs.recipients.ens.primaryName"
                    values={{ name: reverseResolvedName }}
                />
            );
        }

        return null;
    })();

    if (!message) return null;

    return (
        <Animated.View entering={FadeIn} exiting={FadeOut}>
            <HStack spacing="sp4" marginLeft="sp12" alignItems="center">
                {isResolving && <Loader size="small" color="contentSecondary" />}
                <Box flex={1}>
                    <Text variant="body-xs" color="contentSecondary">
                        {message}
                    </Text>
                </Box>
            </HStack>
        </Animated.View>
    );
};
