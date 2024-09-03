import { Button, Column, Text, Icon, Row, Paragraph } from '@trezor/components';
import { Modal, Translation } from 'src/components/suite';
import styled from 'styled-components';
import type { Deferred } from '@trezor/utils';
import { CryptoId } from 'invity-api';
import { useDevice } from 'src/hooks/suite';
import { spacings, spacingsPx } from '@trezor/theme';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

const ContentWrapper = styled.div`
    text-align: left;
`;

const IconWrapper = styled.div<{ $backgroundColor: string }>`
    border-radius: 50%;
    padding: ${spacingsPx.lg};
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: ${spacingsPx.xl};
    background-color: ${({ $backgroundColor }) => $backgroundColor};
`;

const FooterContent = styled.div`
    display: flex;
    flex: 1;
    place-content: center space-between;
`;

export type CoinmarketTermsModalProps = {
    decision: Deferred<boolean>;
    onCancel: () => void;
    type: 'BUY' | 'SELL' | 'COINMARKET_SWAP' | 'COINMARKET_SWAP_DEX';
    provider?: string;
    cryptoCurrency?: CryptoId;
    toCryptoCurrency?: CryptoId;
    fromCryptoCurrency?: CryptoId;
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
    const { device } = useDevice();
    const { cryptoIdToCoinSymbol } = useCoinmarketInfo();

    if (!device?.features) {
        return null;
    }

    type PProps = { children: React.ReactNode };
    const P = ({ children }: PProps) => (
        <Paragraph margin={{ top: spacings.sm }}>{children}</Paragraph>
    );

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
                            ? cryptoIdToCoinSymbol(cryptoCurrency)
                            : undefined,
                        toCrypto: toCryptoCurrency
                            ? cryptoIdToCoinSymbol(toCryptoCurrency)
                            : undefined,
                        fromCrypto: fromCryptoCurrency
                            ? cryptoIdToCoinSymbol(fromCryptoCurrency)
                            : undefined,
                    }}
                />
            }
            bottomBarComponents={
                <FooterContent>
                    <Button
                        data-testid={`@coinmarket/${lowercaseType}/offers/buy-terms-confirm-button`}
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
            <Column gap={spacings.lg}>
                <Row alignItems="center">
                    <IconWrapper $backgroundColor="#e5f3ee">
                        <Icon
                            size={24}
                            name={`trezor${device.features.internal_model}`}
                            color="#00854d"
                        />
                    </IconWrapper>

                    <ContentWrapper>
                        <Text typographyStyle="highlight" margin={{ top: spacings.sm }}>
                            <Translation id={`TR_${type}_MODAL_SECURITY_HEADER`} />
                        </Text>
                        <P>
                            <Translation
                                id={`TR_${type}_MODAL_TERMS_1`}
                                values={{ provider: providerName }}
                            />
                        </P>
                        <P>
                            <Translation id={`TR_${type}_MODAL_TERMS_2`} />
                        </P>
                        <P>
                            <Translation id={`TR_${type}_MODAL_TERMS_3`} />
                        </P>
                    </ContentWrapper>
                </Row>
                <Row alignItems="center">
                    <IconWrapper $backgroundColor="#e8f3fa">
                        <Icon size={24} name="checkActive" color="#1d88c5" />
                    </IconWrapper>

                    <ContentWrapper>
                        <Text typographyStyle="highlight" margin={{ top: spacings.sm }}>
                            <Translation id={`TR_${type}_MODAL_VERIFIED_PARTNERS_HEADER`} />
                        </Text>
                        <P>
                            <Translation
                                id={`TR_${type}_MODAL_TERMS_4`}
                                values={{ provider: providerName }}
                            />
                        </P>
                    </ContentWrapper>
                </Row>
                <Row alignItems="center">
                    <IconWrapper $backgroundColor="#f9f4e6">
                        <Icon size={24} name="pencil" color="#c19009" />
                    </IconWrapper>
                    <ContentWrapper>
                        <Text typographyStyle="highlight">
                            <Translation id={`TR_${type}_MODAL_LEGAL_HEADER`} />
                        </Text>
                        <P>
                            <Translation id={`TR_${type}_MODAL_TERMS_5`} />
                        </P>
                        <P>
                            <Translation id={`TR_${type}_MODAL_TERMS_6`} />
                        </P>
                    </ContentWrapper>
                </Row>
            </Column>
        </Modal>
    );
};
