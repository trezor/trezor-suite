import { useState } from 'react';

import {
    type NetworkSymbol,
    getNetwork,
    getNetworkDisplaySymbol,
} from '@suite-common/wallet-config';
import { Box, Button, Card, CheckBox, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { EarnConsentsItem } from './EarnConsentsItem';

type EarnConsentsDelegatingCardProps = {
    symbol: NetworkSymbol;
    onConfirm: () => void;
};

export const EarnConsentsDelegatingCard = ({
    symbol,
    onConfirm,
}: EarnConsentsDelegatingCardProps) => {
    const [hasAgreed, setHasAgreed] = useState(false);
    const displaySymbol = getNetworkDisplaySymbol(symbol);
    const itemsTranslationKey = getNetwork(symbol).networkType === 'solana' ? 'sol' : 'eth';

    return (
        <Card>
            <VStack spacing="sp24">
                <Text variant="body-md">
                    <Translation id="earn.earnConsentsScreen.maintained" />
                </Text>
                <EarnConsentsItem iconName="everstakeLogo" color="contentPrimary">
                    <Translation
                        id={`earn.earnConsentsScreen.delegatingCard.${itemsTranslationKey}.firstItem`}
                        values={{ displaySymbol }}
                    />
                </EarnConsentsItem>
                <EarnConsentsItem iconName="lock" color="contentPrimary">
                    <Translation
                        id={`earn.earnConsentsScreen.delegatingCard.${itemsTranslationKey}.secondItem`}
                        values={{ displaySymbol }}
                    />
                </EarnConsentsItem>
                <HStack spacing="sp12" alignItems="center">
                    <CheckBox
                        isChecked={hasAgreed}
                        onChange={setHasAgreed}
                        testID="@earn/consent/checkbox"
                    />
                    <Box flex={1}>
                        <Text onPress={() => setHasAgreed(!hasAgreed)}>
                            <Translation id="earn.earnConsentsScreen.acknowledge" />
                        </Text>
                    </Box>
                </HStack>
                <Button testID="@earn/consent/continue" isDisabled={!hasAgreed} onPress={onConfirm}>
                    <Translation id="generic.buttons.continue" />
                </Button>
            </VStack>
        </Card>
    );
};
