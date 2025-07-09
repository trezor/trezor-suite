import { ReactNode, memo, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

import { CryptoId } from 'invity-api';

import {
    TradingExchangeUserConsentProps,
    selectTradingExchangeProviders,
    useTradingInfo,
} from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    BottomSheetModal,
    Box,
    BulletListItem,
    Button,
    Text,
    VStack,
    useBottomSheetModal,
} from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

import { useBottomSheetBackButtonSubscription } from '../../hooks/general/useBottomSheetBackButtonSubscription';

export type ExchangeLegalSheetProps = TradingExchangeUserConsentProps & {
    isVisible: boolean;
    onConsent: () => void;
    onDismiss: () => void;
};

const CONFIRM_BUTTON_TEST_ID = '@trading/exchange/confirm-button';

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

export const ExchangeLegalSheet = memo(
    ({
        isVisible,
        onConsent,
        onDismiss,
        provider,
        send,
        receive,
        isDex,
    }: ExchangeLegalSheetProps) => {
        const { bottomSheetRef, openModal, closeModal } = useBottomSheetModal();
        const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();
        const providers = useSelector(selectTradingExchangeProviders);
        const { companyName } = providers?.[provider] ?? {};

        const { coinSymbol: sendCoinSymbol, contractAddress: sendContractAddress } =
            cryptoIdToSymbolAndContractAddress(send as CryptoId);
        const sendSymbol = sendCoinSymbol && getDisplaySymbol(sendCoinSymbol, sendContractAddress);

        const { coinSymbol: receiveCoinSymbol, contractAddress: receiveContractAddress } =
            cryptoIdToSymbolAndContractAddress(receive as CryptoId);
        const receiveSymbol =
            receiveCoinSymbol && getDisplaySymbol(receiveCoinSymbol, receiveContractAddress);

        const translations = useMemo(() => {
            if (isDex) {
                return {
                    title: (
                        <Translation
                            id="moduleTrading.legalSheet.exchange.dex.title"
                            values={{ send: sendSymbol, receive: receiveSymbol, companyName }}
                        />
                    ),
                    security: {
                        title: (
                            <Translation id="moduleTrading.legalSheet.exchange.dex.security.title" />
                        ),
                        line1: (
                            <Translation
                                id="moduleTrading.legalSheet.exchange.dex.security.line1"
                                values={{ companyName }}
                            />
                        ),
                        line2: (
                            <Translation id="moduleTrading.legalSheet.exchange.dex.security.line2" />
                        ),
                        line3: (
                            <Translation id="moduleTrading.legalSheet.exchange.dex.security.line3" />
                        ),
                    },
                    verifiedPartners: {
                        title: (
                            <Translation id="moduleTrading.legalSheet.exchange.dex.verifiedPartners.title" />
                        ),
                        line1: (
                            <Translation
                                id="moduleTrading.legalSheet.exchange.dex.verifiedPartners.line1"
                                values={{ companyName }}
                            />
                        ),
                    },
                    legal: {
                        title: (
                            <Translation id="moduleTrading.legalSheet.exchange.dex.legal.title" />
                        ),
                        line1: (
                            <Translation id="moduleTrading.legalSheet.exchange.dex.legal.line1" />
                        ),
                        line2: (
                            <Translation id="moduleTrading.legalSheet.exchange.dex.legal.line2" />
                        ),
                    },
                };
            }

            return {
                title: (
                    <Translation
                        id="moduleTrading.legalSheet.exchange.cex.title"
                        values={{ send: sendSymbol, receive: receiveSymbol, companyName }}
                    />
                ),
                security: {
                    title: (
                        <Translation id="moduleTrading.legalSheet.exchange.cex.security.title" />
                    ),
                    line1: (
                        <Translation id="moduleTrading.legalSheet.exchange.cex.security.line1" />
                    ),
                    line2: (
                        <Translation id="moduleTrading.legalSheet.exchange.cex.security.line2" />
                    ),
                    line3: (
                        <Translation id="moduleTrading.legalSheet.exchange.dex.security.line3" />
                    ),
                },
                verifiedPartners: {
                    title: (
                        <Translation id="moduleTrading.legalSheet.exchange.cex.verifiedPartners.title" />
                    ),
                    line1: (
                        <Translation
                            id="moduleTrading.legalSheet.exchange.cex.verifiedPartners.line1"
                            values={{ companyName }}
                        />
                    ),
                },
                legal: {
                    title: <Translation id="moduleTrading.legalSheet.exchange.cex.legal.title" />,
                    line1: <Translation id="moduleTrading.legalSheet.exchange.cex.legal.line1" />,
                    line2: <Translation id="moduleTrading.legalSheet.exchange.cex.legal.line2" />,
                },
            };
        }, [isDex, sendSymbol, receiveSymbol, companyName]);

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
                title={translations.title}
                onDismiss={onDismiss}
                isCloseDisplayed
            >
                <VStack spacing="sp12" paddingHorizontal="sp12">
                    <VStack>
                        <Subheader>{translations.security.title}</Subheader>
                        <Info>{translations.security.line1}</Info>
                        <Info>{translations.security.line2}</Info>
                        <Info>{translations.security.line3}</Info>
                    </VStack>
                    <VStack>
                        <Subheader>{translations.verifiedPartners.title}</Subheader>
                        <Info>{translations.verifiedPartners.line1}</Info>
                    </VStack>
                    <VStack>
                        <Subheader>{translations.legal.title}</Subheader>
                        <Info>{translations.legal.line1}</Info>
                        <Info>{translations.legal.line2}</Info>
                    </VStack>
                    {
                        // Keep this condition here to simplify testing.
                        // Otherwise, due to the way the Gorhom bottom sheet is mocked,
                        // this button would render even when the modal is not visible,
                        // and some tests need to target the "Continue" button on the form screen.
                        isVisible && (
                            <Box paddingVertical="sp20">
                                <Button onPress={onConsent} testID={CONFIRM_BUTTON_TEST_ID}>
                                    <Translation id="moduleTrading.legalSheet.exchange.continueButton" />
                                </Button>
                            </Box>
                        )
                    }
                </VStack>
            </BottomSheetModal>
        );
    },
);
