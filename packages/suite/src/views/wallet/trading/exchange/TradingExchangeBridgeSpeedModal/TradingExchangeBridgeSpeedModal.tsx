import { type CryptoId } from 'invity-api';

import { Translation } from '@suite/intl';
import {
    type TradingBridgeSpeed,
    type TradingBridgeSpeedOption,
    cryptoIdToNetworkSymbolAndContractAddress,
} from '@suite-common/trading';
import { Column, Icon, Modal, RadioCard, Row, Text } from '@trezor/components';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';

import { TradingExchangeBridgeSpeedFee } from './TradingExchangeBridgeSpeedFee';
import { BRIDGE_SPEED_OPTIONS } from './bridgeSpeedOptions';

type TradingExchangeBridgeSpeedModalProps = {
    bridgeSpeed: TradingBridgeSpeed;
    bridgeSpeedOptions: TradingBridgeSpeedOption[];
    sendCryptoId: CryptoId | undefined;
    receiveSymbol?: string;
    onSelect: (bridgeSpeed: TradingBridgeSpeed) => void;
    onClose: () => void;
};

export const TradingExchangeBridgeSpeedModal = ({
    bridgeSpeed: currentBridgeSpeed,
    bridgeSpeedOptions,
    sendCryptoId,
    receiveSymbol,
    onSelect,
    onClose,
}: TradingExchangeBridgeSpeedModalProps) => {
    const selectedOption = bridgeSpeedOptions.find(({ speed }) => speed === currentBridgeSpeed);
    const sendCurrency = sendCryptoId && cryptoIdToNetworkSymbolAndContractAddress(sendCryptoId);

    return (
        <Modal
            heading={<Translation id="TR_TRADING_BRIDGE_SPEED" />}
            onCancel={onClose}
            width={400}
        >
            <Column gap={8}>
                {bridgeSpeedOptions.map(({ speed: bridgeSpeed, feePercent }) => {
                    const { nameId, descriptionId, icon } = BRIDGE_SPEED_OPTIONS[bridgeSpeed];

                    return (
                        <RadioCard
                            key={bridgeSpeed}
                            type="raised"
                            isSelected={bridgeSpeed === currentBridgeSpeed}
                            onClick={() => onSelect(bridgeSpeed)}
                            dataTestId={`@trading/bridge-speed-modal/${bridgeSpeed}`}
                        >
                            <Column gap={4} alignItems="stretch">
                                <Row justifyContent="space-between" alignItems="center" gap={8}>
                                    <Row alignItems="center" gap={8}>
                                        <Icon as={icon} size={16} />
                                        <Text typographyStyle="body-md-strong">
                                            <Translation id={nameId} />
                                        </Text>
                                    </Row>
                                    <Text typographyStyle="body-md-strong">
                                        <TradingExchangeBridgeSpeedFee feePercent={feePercent} />
                                    </Text>
                                </Row>
                                <Text
                                    typographyStyle="body-sm"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation
                                        id={descriptionId}
                                        values={{ symbol: receiveSymbol }}
                                    />
                                </Text>
                            </Column>
                        </RadioCard>
                    );
                })}

                {selectedOption && sendCurrency && (
                    <Text
                        typographyStyle="body-sm"
                        intent="neutral"
                        priority="secondary"
                        align="center"
                    >
                        <Translation
                            id="TR_TRADING_BRIDGE_SPEED_FORWARDING_FEE_NOTE"
                            values={{
                                fee: (
                                    <FormattedCryptoAmount
                                        disableHiddenPlaceholder
                                        value={selectedOption.forwardFee}
                                        networkSymbol={sendCurrency.networkSymbol}
                                        contractAddress={sendCurrency.contractAddress}
                                    />
                                ),
                            }}
                        />
                    </Text>
                )}
            </Column>
        </Modal>
    );
};
