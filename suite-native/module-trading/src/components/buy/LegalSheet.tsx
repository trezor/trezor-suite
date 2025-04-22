import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingBuyProviders } from '@suite-common/trading';
import { BottomSheet, Box, BulletListItem, Button, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

export type LegalSheetProps = {
    isVisible: boolean;
    onConsent: () => void;
    onClose: () => void;
    tradeProvider: string;
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

export const LegalSheet = ({ isVisible, onConsent, onClose, tradeProvider }: LegalSheetProps) => {
    const providers = useSelector(selectTradingBuyProviders);
    const { companyName } = providers?.[tradeProvider] ?? {};

    return (
        <BottomSheet
            title={<Translation id="moduleTrading.legalSheet.title" values={{ companyName }} />}
            onClose={onClose}
            isVisible={isVisible}
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
                            values={{ companyName }}
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
                <Box padding="sp20">
                    <Button onPress={onConsent}>
                        <Translation id="moduleTrading.tradingScreen.continueButton" />
                    </Button>
                </Box>
            </VStack>
        </BottomSheet>
    );
};
