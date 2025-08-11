import { useState } from 'react';

import styled from 'styled-components';

import { TradingExchangeType, invityAPI, useTradingInfo } from '@suite-common/trading';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import {
    Badge,
    Banner,
    Box,
    CollapsibleBox,
    Column,
    Divider,
    Icon,
    Modal,
    Row,
    Text,
} from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders, spacings } from '@trezor/theme';

import { Translation } from 'src/components/suite/Translation';
import { AccountLabeling } from 'src/components/suite/labeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useSelector } from 'src/hooks/suite';
import { useTradingFormContext } from 'src/hooks/wallet/trading/form/useTradingCommonForm';
import { selectIsDebugModeActive } from 'src/selectors/suite/suiteSelectors';
import { getProvidersInfoProps } from 'src/utils/wallet/trading/tradingTypingUtils';
import { tokenSupportsIncreasingAllowance } from 'src/utils/wallet/trading/tradingUtils';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

const BreakableValue = styled.span`
    word-break: break-all;
`;

const CustomIcon = styled.img`
    flex: none;
    width: 24px;
    height: 24px;
`;

type RevokeModalProps = {
    onCancel: (isSubmitting?: boolean) => void;
};

export const RevokeModal = ({ onCancel }: RevokeModalProps) => {
    const context = useTradingFormContext<TradingExchangeType>();
    const {
        form: {
            state: { isFormLoading },
        },
        device,
        account,
        selectedQuote,
        sendTransaction,
        control,
        feeInfo,
        composedLevels,
        formState: { errors, isDirty },
        register,
        setValue,
        getValues,
        changeFeeLevel,
        trigger,
    } = context;

    const isDebug = useSelector(selectIsDebugModeActive);

    const { cryptoIdToSymbolAndContractAddress } = useTradingInfo();

    const [isConfirmButtonLoading, setIsConfirmButtonLoading] = useState<boolean>(false);

    if (!selectedQuote?.exchange || !selectedQuote?.dexTx || !selectedQuote?.send) {
        return null;
    }

    const confirmAndSend = async () => {
        setIsConfirmButtonLoading(true);
        await sendTransaction();
        setIsConfirmButtonLoading(false);
        onCancel(true);
    };

    const { coinSymbol, contractAddress } = cryptoIdToSymbolAndContractAddress(selectedQuote.send);
    const displaySymbol = coinSymbol && getDisplaySymbol(coinSymbol, contractAddress);
    const isIncreasingAllowanceSupported = tokenSupportsIncreasingAllowance(contractAddress);

    const providers = getProvidersInfoProps(context);
    const provider =
        selectedQuote && selectedQuote.exchange && providers
            ? providers[selectedQuote.exchange]
            : undefined;

    return (
        <Modal
            onCancel={() => onCancel()}
            variant="primary"
            size="small"
            heading={
                <Translation
                    id="TR_EXCHANGE_APPROVAL_REVOKE_TOKEN_SPENDING"
                    values={{ displaySymbol }}
                />
            }
            bottomContent={
                <>
                    <Modal.Button
                        size="medium"
                        isLoading={isFormLoading || isConfirmButtonLoading}
                        isDisabled={!device?.connected}
                        onClick={confirmAndSend}
                    >
                        <Translation id="TR_CONTINUE" />
                    </Modal.Button>

                    <Modal.Button size="medium" variant="tertiary" onClick={() => onCancel()}>
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
            description={
                <Row margin={{ top: spacings.xs }} gap={spacings.xxs}>
                    <CoinLogo size={20} symbol={account.symbol} />
                    <AccountLabeling
                        account={account}
                        showAccountTypeBadge
                        accountTypeBadgeSize="small"
                    />
                </Row>
            }
        >
            <Column gap={spacings.sm}>
                {!isIncreasingAllowanceSupported && (
                    <Banner variant="info" icon="info">
                        <Translation
                            id="TR_EXCHANGE_APPROVAL_MODAL_REVOKE_BANNER"
                            values={{ displaySymbol }}
                        />
                    </Banner>
                )}

                <Box
                    borderWidth={borders.widths.large}
                    padding={spacings.sm}
                    borderRadius={borders.radii.sm}
                >
                    <Column gap={spacings.sm}>
                        <Column gap={spacings.sm}>
                            <Text>
                                <Translation id="TR_EXCHANGE_APPROVAL_PROVIDER" />
                            </Text>
                            <Row gap={spacings.xs}>
                                {provider?.logo && (
                                    <CustomIcon
                                        src={invityAPI.getProviderLogoUrl(provider.logo)}
                                        alt={provider.logo}
                                    />
                                )}
                                <Column>
                                    {provider?.companyName && <Text>{provider.companyName}</Text>}
                                    <Text typographyStyle="hint" variant="tertiary">
                                        {contractAddress}
                                    </Text>
                                </Column>
                            </Row>
                        </Column>

                        <Divider margin={{ top: 0, bottom: 0 }} />

                        <Row alignItems="flex-start" gap={spacings.xxxxl}>
                            <Column gap={spacings.sm} flex="1" overflow="hidden">
                                <Text>
                                    <Translation id="TR_EXCHANGE_APPROVAL_CURRENT_LIMIT" />
                                </Text>
                                <Row gap={spacings.sm}>
                                    <TradingCoinLogo cryptoId={selectedQuote.send} size={24} />
                                    {selectedQuote.preapprovedStringAmount} {displaySymbol}
                                </Row>
                            </Column>

                            <Column alignSelf="center">
                                <Icon name="arrowRight" />
                            </Column>

                            <Column gap={spacings.sm} flex="1">
                                <Text>
                                    <Translation id="TR_EXCHANGE_APPROVAL_NEW_LIMIT" />
                                </Text>
                                <Row gap={spacings.sm}>
                                    <TradingCoinLogo cryptoId={selectedQuote.send} size={24} />0{' '}
                                    {displaySymbol}
                                </Row>
                            </Column>
                        </Row>

                        {isDebug && selectedQuote.dexTx.data ? (
                            <CollapsibleBox
                                heading={
                                    <Row gap={spacings.xs}>
                                        <Translation id="TR_EXCHANGE_APPROVAL_DATA" />
                                        <Badge variant="warning" size="small">
                                            <Translation id="TR_DEBUG_ONLY" />
                                        </Badge>
                                    </Row>
                                }
                            >
                                <BreakableValue>{selectedQuote.dexTx.data}</BreakableValue>
                            </CollapsibleBox>
                        ) : null}
                    </Column>
                </Box>

                <Box
                    padding={spacings.sm}
                    borderWidth={borders.widths.large}
                    borderRadius={borders.radii.sm}
                >
                    <Fees
                        label="TR_TX_FEE"
                        control={control}
                        feeInfo={feeInfo}
                        account={account}
                        composedLevels={composedLevels}
                        errors={errors}
                        isDirty={isDirty}
                        register={register}
                        setValue={setValue}
                        getValues={getValues}
                        changeFeeLevel={changeFeeLevel}
                        trigger={trigger}
                    />
                </Box>
            </Column>
        </Modal>
    );
};
