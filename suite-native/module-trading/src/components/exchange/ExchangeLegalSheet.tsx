import { ReactNode, memo, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { CryptoId } from 'invity-api';

import {
    TradingRootState as CommonTradingRootState,
    TradingExchangeUserConsentProps,
    selectTradingProviderByNameAndTradeType,
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

const useLegalSheetTradeInfoData = ({
    provider,
    send,
    receive,
}: Omit<TradingExchangeUserConsentProps, 'isDex'>) => {
    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();
    const { companyName } =
        useSelector((state: CommonTradingRootState) =>
            selectTradingProviderByNameAndTradeType(state, provider, 'exchange'),
        ) ?? {};

    const { coinSymbol: sendCoinSymbol, contractAddress: sendContractAddress } =
        cryptoIdToSymbolAndContractAddress(send as CryptoId);
    const sendSymbol = sendCoinSymbol && getDisplaySymbol(sendCoinSymbol, sendContractAddress);

    const { coinSymbol: receiveCoinSymbol, contractAddress: receiveContractAddress } =
        cryptoIdToSymbolAndContractAddress(receive as CryptoId);
    const receiveSymbol =
        receiveCoinSymbol && getDisplaySymbol(receiveCoinSymbol, receiveContractAddress);

    return { sendSymbol, receiveSymbol, companyName };
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

const DexInfo = ({ companyName }: { companyName: string | undefined }) => (
    <>
        <VStack>
            <Subheader>
                <Translation id="moduleTrading.legalSheet.exchange.dex.security.title" />
            </Subheader>

            <Info>
                <Translation
                    id="moduleTrading.legalSheet.exchange.dex.security.line1"
                    values={{ companyName }}
                />
            </Info>
            <Info>
                <Translation id="moduleTrading.legalSheet.exchange.dex.security.line2" />
            </Info>
            <Info>
                <Translation id="moduleTrading.legalSheet.exchange.dex.security.line3" />
            </Info>
        </VStack>
        <VStack>
            <Subheader>
                <Translation id="moduleTrading.legalSheet.exchange.dex.verifiedPartners.title" />
            </Subheader>
            <Info>
                <Translation
                    id="moduleTrading.legalSheet.exchange.dex.verifiedPartners.line1"
                    values={{ companyName }}
                />
            </Info>
        </VStack>
        <VStack>
            <Subheader>
                <Translation id="moduleTrading.legalSheet.exchange.dex.legal.title" />
            </Subheader>
            <Info>
                <Translation id="moduleTrading.legalSheet.exchange.dex.legal.line1" />
            </Info>
            <Info>
                <Translation id="moduleTrading.legalSheet.exchange.dex.legal.line2" />
            </Info>
        </VStack>
    </>
);

const CexInfo = ({ companyName }: { companyName: string | undefined }) => (
    <>
        <VStack>
            <Subheader>
                <Translation id="moduleTrading.legalSheet.exchange.cex.security.title" />
            </Subheader>

            <Info>
                <Translation id="moduleTrading.legalSheet.exchange.cex.security.line1" />
            </Info>
            <Info>
                <Translation id="moduleTrading.legalSheet.exchange.cex.security.line2" />
            </Info>
            <Info>
                <Translation id="moduleTrading.legalSheet.exchange.cex.security.line3" />
            </Info>
        </VStack>
        <VStack>
            <Subheader>
                <Translation id="moduleTrading.legalSheet.exchange.cex.verifiedPartners.title" />
            </Subheader>
            <Info>
                <Translation
                    id="moduleTrading.legalSheet.exchange.cex.verifiedPartners.line1"
                    values={{ companyName }}
                />
            </Info>
        </VStack>
        <VStack>
            <Subheader>
                <Translation id="moduleTrading.legalSheet.exchange.cex.legal.title" />
            </Subheader>
            <Info>
                <Translation id="moduleTrading.legalSheet.exchange.cex.legal.line1" />
            </Info>
            <Info>
                <Translation id="moduleTrading.legalSheet.exchange.cex.legal.line2" />
            </Info>
        </VStack>
    </>
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
        const { sendSymbol, receiveSymbol, companyName } = useLegalSheetTradeInfoData({
            provider,
            send,
            receive,
        });

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
                title={
                    <Translation
                        id={
                            isDex
                                ? 'moduleTrading.legalSheet.exchange.dex.title'
                                : 'moduleTrading.legalSheet.exchange.cex.title'
                        }
                        values={{ send: sendSymbol, receive: receiveSymbol, companyName }}
                    />
                }
                onDismiss={onDismiss}
                isCloseDisplayed
            >
                <VStack spacing="sp12" paddingHorizontal="sp12">
                    {isDex ? (
                        <DexInfo companyName={companyName} />
                    ) : (
                        <CexInfo companyName={companyName} />
                    )}
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
