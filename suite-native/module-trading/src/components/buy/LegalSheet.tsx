import { ReactNode } from 'react';

import { BottomSheet, Box, BulletListItem, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type LegalSheetProps = {
    isVisible: boolean;
    onClose: () => void;
    tradeProviderName?: string;
};

const Subheader = ({ children }: { children: ReactNode }) => (
    <Text variant="highlight" color="textDefault">
        {children}
    </Text>
);

const Info = ({ children }: { children: ReactNode }) => (
    <BulletListItem variant="hint" color="textDefault">
        {children}
    </BulletListItem>
);

export const LegalSheet = ({ isVisible, onClose, tradeProviderName }: LegalSheetProps) => (
    <BottomSheet
        title={<Translation id="moduleTrading.legalSheet.title" values={{ tradeProviderName }} />}
        isVisible={isVisible}
        onClose={onClose}
        collapsable
    >
        <VStack spacing="sp12" paddingHorizontal="sp12">
            <VStack>
                <Subheader>
                    <Translation id="moduleTrading.legalSheet.subheaderSecurity" />
                </Subheader>
                <Info>
                    <Translation id="moduleTrading.legalSheet.infoSecurity1" />
                </Info>
                <Info>
                    <Translation id="moduleTrading.legalSheet.infoSecurity2" />
                </Info>
                <Info>
                    <Translation id="moduleTrading.legalSheet.infoSecurity3" />
                </Info>
            </VStack>
            <VStack>
                <Subheader>
                    <Translation id="moduleTrading.legalSheet.subheaderPartners" />
                </Subheader>
                <Info>
                    <Translation
                        id="moduleTrading.legalSheet.infoPartners"
                        values={{ tradeProviderName }}
                    />
                </Info>
            </VStack>
            <VStack>
                <Subheader>
                    <Translation id="moduleTrading.legalSheet.subheaderLegal" />
                </Subheader>
                <Info>
                    <Translation id="moduleTrading.legalSheet.infoLegal1" />
                </Info>
                <Info>
                    <Translation id="moduleTrading.legalSheet.infoLegal2" />
                </Info>
            </VStack>
            <Box paddingTop="sp40">
                <Button onPress={onClose}>
                    <Translation id="moduleTrading.tradingScreen.continueButton" />
                </Button>
            </Box>
        </VStack>
    </BottomSheet>
);
