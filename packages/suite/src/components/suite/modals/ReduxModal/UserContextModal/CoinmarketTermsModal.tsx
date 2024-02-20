import { Button, Icon } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import styled from 'styled-components';
import type { Deferred } from '@trezor/utils';
import { DeviceModelInternal } from '@trezor/connect';
import { cryptoToCoinSymbol } from 'src/utils/wallet/coinmarket/cryptoSymbolUtils';
import { CryptoSymbol } from 'invity-api';

const ContentWrapper = styled.div`
    text-align: left;
`;
const TermsText = styled.div`
    padding-bottom: 20px;
`;

const StyledIcon = styled(Icon)`
    border-radius: 50%;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 24px;
`;
const SecurityStyledIcon = styled(StyledIcon)`
    fill: #00854d;
    background-color: #e5f3ee;

    path {
        fill: #00854d;
    }
`;

const VerifiedPartnersStyledIcon = styled(StyledIcon)`
    fill: #1d88c5;
    background-color: #e8f3fa;

    path {
        fill: #1d88c5;
    }
`;
const LegalStyledIcon = styled(StyledIcon)`
    fill: #00854d;
    background-color: #f9f4e6;

    path {
        fill: #c19009;
    }
`;

const Flex = styled.div`
    display: flex;

    & + & {
        padding-top: 20px;
    }
`;
const TermsHeader = styled.h4`
    padding-bottom: 10px;
    font-weight: 600;
`;
const FooterContent = styled.div`
    display: flex;
    flex: 1;
    place-content: center space-between;
`;

export type CoinmarketTermsModalProps = {
    decision: Deferred<boolean>;
    onCancel: () => void;
    type: 'BUY' | 'SELL' | 'EXCHANGE' | 'EXCHANGE_DEX' | 'SAVINGS' | 'P2P';
    provider?: string;
    cryptoCurrency?: CryptoSymbol;
    toCryptoCurrency?: CryptoSymbol;
    fromCryptoCurrency?: CryptoSymbol;
};
export const CoinmarketTermsModal = ({
    decision,
    onCancel,
    type,
    provider,
    cryptoCurrency,
    toCryptoCurrency,
    fromCryptoCurrency,
}: CoinmarketTermsModalProps) => {
    const providerName = provider || 'unknown provider';
    const lowercaseType = type.toLowerCase();

    return (
        <Modal
            isCancelable
            onCancel={onCancel}
            heading={
                <Translation
                    id={`TR_${type}_MODAL_FOR_YOUR_SAFETY`}
                    values={{
                        provider: providerName,
                        cryptocurrency: cryptoCurrency
                            ? cryptoToCoinSymbol(cryptoCurrency)
                            : undefined,
                        toCrypto: toCryptoCurrency
                            ? cryptoToCoinSymbol(toCryptoCurrency)
                            : undefined,
                        fromCrypto: fromCryptoCurrency
                            ? cryptoToCoinSymbol(fromCryptoCurrency)
                            : undefined,
                    }}
                />
            }
            bottomBarComponents={
                <FooterContent>
                    <Button
                        data-test={`@coinmarket/${lowercaseType}/offers/buy-terms-confirm-button`}
                        onClick={() => {
                            decision.resolve(true);
                            onCancel();
                        }}
                    >
                        <Translation id={`TR_${type}_MODAL_CONFIRM`} />
                    </Button>
                </FooterContent>
            }
        >
            <Flex>
                <SecurityStyledIcon size={24} icon={`TREZOR_${DeviceModelInternal.T2T1}`} />

                <ContentWrapper>
                    <TermsHeader>
                        <Translation id={`TR_${type}_MODAL_SECURITY_HEADER`} />
                    </TermsHeader>
                    <TermsText>
                        <Translation
                            id={`TR_${type}_MODAL_TERMS_1`}
                            values={{ provider: providerName }}
                        />
                    </TermsText>
                    <TermsText>
                        <Translation id={`TR_${type}_MODAL_TERMS_2`} />
                    </TermsText>
                    {type !== 'P2P' ? (
                        <TermsText>
                            <Translation id={`TR_${type}_MODAL_TERMS_3`} />
                        </TermsText>
                    ) : null}
                </ContentWrapper>
            </Flex>
            <Flex>
                <VerifiedPartnersStyledIcon size={24} icon="CHECK_ACTIVE" />

                <ContentWrapper>
                    <TermsHeader>
                        <Translation id={`TR_${type}_MODAL_VERIFIED_PARTNERS_HEADER`} />
                    </TermsHeader>
                    <TermsText>
                        <Translation
                            id={`TR_${type}_MODAL_TERMS_4`}
                            values={{ provider: providerName }}
                        />
                    </TermsText>
                </ContentWrapper>
            </Flex>
            <Flex>
                <LegalStyledIcon size={24} icon="PENCIL" />

                <ContentWrapper>
                    <TermsHeader>
                        <Translation id={`TR_${type}_MODAL_LEGAL_HEADER`} />
                    </TermsHeader>
                    <TermsText>
                        <Translation id={`TR_${type}_MODAL_TERMS_5`} />
                    </TermsText>
                    <TermsText>
                        <Translation id={`TR_${type}_MODAL_TERMS_6`} />
                    </TermsText>
                </ContentWrapper>
            </Flex>
        </Modal>
    );
};
