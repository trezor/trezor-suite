import { Column, IconCircle, Paragraph, NewModal, List, H4 } from '@trezor/components';
import { Translation } from 'src/components/suite';
import type { Deferred } from '@trezor/utils';
import { CryptoId } from 'invity-api';
import { useDevice } from 'src/hooks/suite';
import { spacings } from '@trezor/theme';
import { useCoinmarketInfo } from 'src/hooks/wallet/coinmarket/useCoinmarketInfo';

type CoinmarketTermsModalProps = {
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
    const iconProps = { variant: 'primary' as const, size: 'large' as const, hasBorder: false };

    if (!device?.features) {
        return null;
    }

    return (
        <NewModal
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
            bottomContent={
                <NewModal.Button
                    data-testid={`@coinmarket/${lowercaseType}/offers/buy-terms-confirm-button`}
                    onClick={() => {
                        decision.resolve(true);
                        onCancel();
                    }}
                >
                    <Translation id={`TR_${type}_MODAL_CONFIRM`} />
                </NewModal.Button>
            }
        >
            <List
                gap={spacings.xxl}
                bulletGap={spacings.xl}
                margin={{ top: spacings.xs, bottom: spacings.xs, left: spacings.xs }}
            >
                <List.Item
                    bulletComponent={
                        <IconCircle
                            name={`trezor${device.features.internal_model}`}
                            {...iconProps}
                        />
                    }
                >
                    <Column gap={spacings.xxs} alignItems="flex-start">
                        <H4>
                            <Translation id={`TR_${type}_MODAL_SECURITY_HEADER`} />
                        </H4>
                        <Paragraph>
                            <Translation
                                id={`TR_${type}_MODAL_TERMS_1`}
                                values={{ provider: providerName }}
                            />
                        </Paragraph>
                        <Paragraph>
                            <Translation id={`TR_${type}_MODAL_TERMS_2`} />
                        </Paragraph>
                        <Paragraph>
                            <Translation id={`TR_${type}_MODAL_TERMS_3`} />
                        </Paragraph>
                    </Column>
                </List.Item>
                <List.Item bulletComponent={<IconCircle name="check" {...iconProps} />}>
                    <Column gap={spacings.xxs} alignItems="flex-start">
                        <H4>
                            <Translation id={`TR_${type}_MODAL_VERIFIED_PARTNERS_HEADER`} />
                        </H4>
                        <Paragraph>
                            <Translation
                                id={`TR_${type}_MODAL_TERMS_4`}
                                values={{ provider: providerName }}
                            />
                        </Paragraph>
                    </Column>
                </List.Item>
                <List.Item bulletComponent={<IconCircle name="pencil" {...iconProps} />}>
                    <Column gap={spacings.xxs} alignItems="flex-start">
                        <H4>
                            <Translation id={`TR_${type}_MODAL_LEGAL_HEADER`} />
                        </H4>
                        <Paragraph>
                            <Translation id={`TR_${type}_MODAL_TERMS_5`} />
                        </Paragraph>
                        <Paragraph>
                            <Translation id={`TR_${type}_MODAL_TERMS_6`} />
                        </Paragraph>
                    </Column>
                </List.Item>
            </List>
        </NewModal>
    );
};
