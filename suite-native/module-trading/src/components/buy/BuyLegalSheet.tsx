import { ReactNode, memo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
    TradingRootState as CommonTradingRootState,
    selectTradingProviderByNameAndTradeType,
} from '@suite-common/trading';
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

import { useBottomSheetBackButtonSubscription } from '../../hooks/general/useBottomSheetBackButtonSubscription';

export type BuyLegalSheetProps = {
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

export const BuyLegalSheet = memo(
    ({ isVisible, onConsent, onDismiss, tradeProvider }: BuyLegalSheetProps) => {
        const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
        const { companyName } =
            useSelector((state: CommonTradingRootState) =>
                selectTradingProviderByNameAndTradeType(state, tradeProvider, 'buy'),
            ) ?? {};
        const { translate } = useTranslate();

        useEffect(() => {
            if (isVisible) {
                openModal();
            } else {
                closeModal();
            }
        }, [closeModal, isVisible, openModal]);

        useBottomSheetBackButtonSubscription(isVisible, onDismiss);

        return (
            <BottomSheetModal
                ref={bottomSheetRef}
                title={translate('moduleTrading.legalSheet.buy.title', { companyName })}
                onDismiss={onDismiss}
                isCloseDisplayed
            >
                <VStack spacing="sp12" paddingHorizontal="sp12">
                    <VStack>
                        <Subheader>
                            <Translation id="moduleTrading.legalSheet.buy.subheaderSecurity" />
                        </Subheader>
                        <Info>
                            <Translation
                                id="moduleTrading.legalSheet.buy.infoSecurity1"
                                values={{ companyName }}
                            />
                        </Info>
                        <Info>
                            <Translation id="moduleTrading.legalSheet.buy.infoSecurity2" />
                        </Info>
                        <Info>
                            <Translation id="moduleTrading.legalSheet.buy.infoSecurity3" />
                        </Info>
                    </VStack>
                    <VStack>
                        <Subheader>
                            <Translation id="moduleTrading.legalSheet.buy.subheaderPartners" />
                        </Subheader>
                        <Info>
                            <Translation
                                id="moduleTrading.legalSheet.buy.infoPartners"
                                values={{ companyName }}
                            />
                        </Info>
                    </VStack>
                    <VStack>
                        <Subheader>
                            <Translation id="moduleTrading.legalSheet.buy.subheaderLegal" />
                        </Subheader>
                        <Info>
                            <Translation id="moduleTrading.legalSheet.buy.infoLegal1" />
                        </Info>
                        <Info>
                            <Translation id="moduleTrading.legalSheet.buy.infoLegal2" />
                        </Info>
                    </VStack>
                    {
                        // Keep this condition here to simplify testing.
                        // Otherwise, due to the way the Gorhom bottom sheet is mocked,
                        // this button would render even when the modal is not visible,
                        // and some tests need to target the "Continue" button on the form screen.
                        isVisible && (
                            <Box paddingVertical="sp20">
                                <Button onPress={onConsent} testID={CONFIRM_BUTTON_TEST_ID}>
                                    <Translation id="moduleTrading.tradingScreen.buttons.continue" />
                                </Button>
                            </Box>
                        )
                    }
                </VStack>
            </BottomSheetModal>
        );
    },
);
