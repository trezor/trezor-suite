import { ReactNode, memo, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingBuyProviders } from '@suite-common/trading';
import {
    BottomSheetModal,
    Box,
    BulletListItem,
    Button,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';

import { useBottomSheetBackButtonSubscription } from '../../hooks/useBottomSheetBackButtonSubscription';

export type LegalSheetProps = {
    isVisible: boolean;
    onConsent: () => void;
    onDismiss: () => void;
    tradeProvider: string;
};

const CONFIRM_BUTTON_TEST_ID = '@trading/buy/confirm-button';

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
        const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
        const providers = useSelector(selectTradingBuyProviders);
        const { companyName } = providers?.[tradeProvider] ?? {};
        const { translate } = useTranslate();

        useEffect(() => {
            if (isVisible) {
                openModal();
            }
        }, [isVisible, openModal]);

        const dismissSheet = useCallback(() => {
            onDismiss();
            closeModal();
        }, [onDismiss, closeModal]);

        useBottomSheetBackButtonSubscription(isVisible, dismissSheet);

        const closeWithConsent = useCallback(() => {
            onConsent();
            closeModal();
        }, [onConsent, closeModal]);

        return (
            <BottomSheetModal
                ref={bottomSheetRef}
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
                                <Button onPress={closeWithConsent} testID={CONFIRM_BUTTON_TEST_ID}>
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
