import { ReactNode, memo, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { type BottomSheetModal as BottomSheetModalType } from '@gorhom/bottom-sheet';

import { selectTradingBuyProviders } from '@suite-common/trading';
import { BottomSheetModal, Box, BulletListItem, Button, Text, VStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

export type LegalSheetProps = {
    isVisible: boolean;
    onConsent: () => void;
    onDismiss: () => void;
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

export const LegalSheet = memo(
    ({ isVisible, onConsent, onDismiss, tradeProvider }: LegalSheetProps) => {
        const bottomSheetModalRef = useRef<BottomSheetModalType>(null);
        const providers = useSelector(selectTradingBuyProviders);
        const { companyName } = providers?.[tradeProvider] ?? {};
        const { translate } = useTranslate();

        useEffect(() => {
            if (isVisible) {
                bottomSheetModalRef.current?.present();
            }
        }, [isVisible]);

        const closeWithConsent = useCallback(() => {
            onConsent();
            bottomSheetModalRef.current?.close();
        }, [onConsent]);

        return (
            <BottomSheetModal
                ref={bottomSheetModalRef}
                title={translate('moduleTrading.legalSheet.title', { companyName })}
                onDismiss={onDismiss}
                isCloseDisplayed
            >
                <VStack spacing="sp12" paddingHorizontal="sp12">
                    <VStack>
                        <Subheader>
                            <Translation id="moduleTrading.legalSheet.subheaderSecurity" />
                        </Subheader>
                        <Info>
                            <Translation
                                id="moduleTrading.legalSheet.infoSecurity1"
                                values={{ companyName }}
                            />
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
                    {
                        // Keep this condition here to simplify testing.
                        // Otherwise, due to the way the Gorhom bottom sheet is mocked,
                        // this button would render even when the modal is not visible,
                        // and some tests need to target the "Continue" button on the form screen.
                        isVisible && (
                            <Box paddingVertical="sp20">
                                <Button onPress={closeWithConsent}>
                                    <Translation id="moduleTrading.tradingScreen.continueButton" />
                                </Button>
                            </Box>
                        )
                    }
                </VStack>
            </BottomSheetModal>
        );
    },
);
