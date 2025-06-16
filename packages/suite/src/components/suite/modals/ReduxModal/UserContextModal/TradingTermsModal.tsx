import { useState } from 'react';

import { CryptoId } from 'invity-api';

import { TradingType, useTradingInfo } from '@suite-common/trading';
import {
    //  Banner,
    //  Checkbox,
    Column,
    H4,
    Icon,
    IconProps,
    List,
    Modal,
    Paragraph,
} from '@trezor/components';
import { mapTrezorModelToIcon } from '@trezor/product-components';
import { spacings } from '@trezor/theme';
import type { Deferred } from '@trezor/utils';

import { setDismissedTradingTerms } from 'src/actions/suite/suiteActions';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';

const getTradingType = (modalType: TradingTermsModalProps['type']): TradingType => {
    if (modalType === 'BUY') return 'buy';
    if (modalType === 'SELL') return 'sell';

    return 'exchange';
};

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
    const dispatch = useDispatch();
    const [dontShowAgain, _setDontShowAgain] = useState(false);

    const providerName = provider || 'unknown provider';
    const { device } = useDevice();
    const { cryptoIdToCoinSymbol } = useTradingInfo();
    const iconProps = {
        size: 24,
        paddingType: 'medium',
        hasBorder: false,
    } as Partial<IconProps>;

    if (!device?.features) {
        return null;
    }

    const onCancelClick = () => {
        decision.resolve(false);
        onCancel();
    };

    const onConfirmClick = () => {
        if (dontShowAgain) {
            dispatch(setDismissedTradingTerms(getTradingType(type)));
        }

        decision.resolve(true);
        onCancel();
    };

    return (
        <Modal
            onCancel={onCancelClick}
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
                <Modal.Button
                    data-testid="@trading/offers/trade-terms-confirm-button"
                    onClick={onConfirmClick}
                >
                    <Translation id={`TR_${type}_MODAL_CONFIRM`} />
                </Modal.Button>
            }
        >
            <Column gap={spacings.md}>
                <List
                    gap={spacings.xxl}
                    bulletGap={spacings.sm}
                    margin={{ top: spacings.xs, bottom: spacings.xs, left: spacings.xs }}
                    bulletAlignment="start"
                >
                    <List.Item
                        bulletComponent={
                            <Icon
                                name={mapTrezorModelToIcon[device.features.internal_model]}
                                {...iconProps}
                            />
                        }
                    >
                        <Column gap={spacings.xxs} alignItems="flex-start">
                            <H4>
                                <Translation id={`TR_${type}_MODAL_SECURITY_HEADER`} />
                            </H4>

                            <List gap={spacings.xxs} bulletGap={spacings.sm} listStyleType="disc">
                                <List.Item>
                                    <Paragraph>
                                        <Translation
                                            id={`TR_${type}_MODAL_TERMS_1`}
                                            values={{ provider: providerName }}
                                        />
                                    </Paragraph>
                                </List.Item>
                                <List.Item>
                                    <Paragraph>
                                        <Translation id={`TR_${type}_MODAL_TERMS_2`} />
                                    </Paragraph>
                                </List.Item>
                                <List.Item>
                                    <Paragraph>
                                        <Translation id={`TR_${type}_MODAL_TERMS_3`} />
                                    </Paragraph>
                                </List.Item>
                            </List>
                        </Column>
                    </List.Item>
                    <List.Item bulletComponent={<Icon name="checkCircle" {...iconProps} />}>
                        <Column gap={spacings.xxs} alignItems="flex-start">
                            <H4>
                                <Translation id={`TR_${type}_MODAL_VERIFIED_PARTNERS_HEADER`} />
                            </H4>
                            <List gap={spacings.xxs} bulletGap={spacings.sm} listStyleType="disc">
                                <List.Item>
                                    <Paragraph>
                                        <Translation
                                            id={`TR_${type}_MODAL_TERMS_4`}
                                            values={{ provider: providerName }}
                                        />
                                    </Paragraph>
                                </List.Item>
                            </List>
                        </Column>
                    </List.Item>
                    <List.Item bulletComponent={<Icon name="scroll" {...iconProps} />}>
                        <Column gap={spacings.xxs} alignItems="flex-start">
                            <H4>
                                <Translation id={`TR_${type}_MODAL_LEGAL_HEADER`} />
                            </H4>
                            <List gap={spacings.xxs} bulletGap={spacings.sm} listStyleType="disc">
                                <List.Item>
                                    <Paragraph>
                                        <Translation id={`TR_${type}_MODAL_TERMS_5`} />
                                    </Paragraph>
                                </List.Item>
                                <List.Item>
                                    <Paragraph>
                                        <Translation id={`TR_${type}_MODAL_TERMS_6`} />
                                    </Paragraph>
                                </List.Item>
                            </List>
                        </Column>
                    </List.Item>
                </List>
                {/*
                <Banner variant="tertiary">
                    <Checkbox
                        isChecked={dontShowAgain}
                        onClick={() => setDontShowAgain(prev => !prev)}
                    >
                        <Translation id="TR_TRADING_TERMS_DONT_SHOW_AGAIN" />
                    </Checkbox>
                </Banner>
              */}
            </Column>
        </Modal>
    );
};
