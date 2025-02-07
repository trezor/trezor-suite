import { CryptoId } from 'invity-api';

import {
    Column,
    H4,
    IconCircle,
    IconCircleProps,
    List,
    NewModal,
    Paragraph,
} from '@trezor/components';
import { mapTrezorModelToIconDeprecated } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import type { Deferred } from '@trezor/utils';

import { Translation } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite';
import { useTradingInfo } from 'src/hooks/wallet/trading/useTradingInfo';

type TradingTermsModalProps = {
    decision: Deferred<boolean>;
    onCancel: () => void;
    type: 'BUY' | 'SELL' | 'TRADING_SWAP' | 'TRADING_SWAP_DEX';
    provider?: string;
    cryptoCurrency?: CryptoId;
    toCryptoCurrency?: CryptoId;
    fromCryptoCurrency?: CryptoId;
};

export const TradingTermsModal = ({
    decision,
    onCancel,
    type,
    provider,
    cryptoCurrency,
    toCryptoCurrency,
    fromCryptoCurrency,
}: TradingTermsModalProps) => {
    const providerName = provider || 'unknown provider';
    const lowercaseType = type.toLowerCase();
    const { device } = useDevice();
    const { cryptoIdToCoinSymbol } = useTradingInfo();
    const iconProps = {
        variant: 'primary',
        size: 50,
        paddingType: 'medium',
        hasBorder: false,
    } as Partial<IconCircleProps>;

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
                    data-testid={`@trading/${lowercaseType}/offers/trade-terms-confirm-button`}
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
                            name={mapTrezorModelToIconDeprecated[device.features.internal_model]}
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
