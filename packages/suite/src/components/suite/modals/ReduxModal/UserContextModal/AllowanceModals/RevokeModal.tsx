import { FormProvider } from 'react-hook-form';

import { type CryptoId, type ProviderMetadata } from 'invity-api';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import { Banner, Box, Column, Icon, Modal, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders } from '@trezor/theme';

import { AccountLabeling } from 'src/components/suite/labeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useAllowanceModal } from 'src/hooks/wallet/allowance';
import { TradingCoinLogo } from 'src/views/wallet/trading/common/TradingCoinLogo';

import {
    AllowanceModalProviderInfo,
    type ProviderLogoSourceType,
} from './AllowanceModalProviderInfo';

interface RevokeModalProps {
    cryptoId: CryptoId;
    account: Account;
    provider: ProviderMetadata;
    spender: string;
    logoSourceType?: ProviderLogoSourceType;
    preapprovedAmount?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export const RevokeModal = (props: RevokeModalProps) => {
    const { account, provider, spender, cryptoId, logoSourceType, preapprovedAmount } = props;
    const { device } = useDevice();

    const context = useAllowanceModal({
        ...props,
        type: 'REVOKE',
        amount: '0',
    });

    const {
        feeInfo,
        token,
        isLoading,
        composedLevels,
        composedLevelsError,
        canSubmit,
        methods,
        handleClose,
        handleFeeChange,
        confirmAndSend,
    } = context;

    if (!token?.symbol) return null;

    const displaySymbol = getDisplaySymbol(token.symbol, token.contract);
    const isPreapprovedAmountUnlimited =
        !!preapprovedAmount && isAllowanceUnlimited(preapprovedAmount, token.decimals);

    return (
        <FormProvider {...methods}>
            <Modal
                onCancel={handleClose}
                intent="brand"
                width={600}
                heading={
                    <Translation
                        id="TR_EXCHANGE_APPROVAL_REVOKE_TOKEN_SPENDING"
                        values={{ displaySymbol }}
                    />
                }
                bottomContent={
                    <>
                        <Modal.Button
                            isLoading={isLoading}
                            isDisabled={!device?.connected || !canSubmit}
                            onClick={confirmAndSend}
                        >
                            <Translation id="TR_CONTINUE" />
                        </Modal.Button>

                        <Modal.Button intent="neutral" priority="secondary" onClick={handleClose}>
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
                description={
                    <Row margin={{ top: 8 }} gap={4}>
                        <CoinLogo size={20} symbol={account.symbol} />
                        <AccountLabeling
                            account={account}
                            showAccountTypeBadge
                            accountTypeBadgeSize="small"
                        />
                    </Row>
                }
                shadowBottom={false}
            >
                <Column gap={12}>
                    <AllowanceModalProviderInfo
                        spender={spender}
                        provider={provider}
                        logoSourceType={logoSourceType}
                    />

                    <Box
                        borderWidth={borders.widths.large}
                        padding={12}
                        borderRadius={borders.radii.sm}
                    >
                        <Column gap={12}>
                            <Row alignItems="flex-start" gap={48}>
                                <Column gap={12} flex="1" overflow="hidden">
                                    <Text>
                                        <Translation id="TR_EXCHANGE_APPROVAL_CURRENT_LIMIT" />
                                    </Text>
                                    <Row gap={12}>
                                        <TradingCoinLogo cryptoId={cryptoId} size={24} />
                                        <Text>
                                            {isPreapprovedAmountUnlimited ? (
                                                <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />
                                            ) : (
                                                `${preapprovedAmount ?? '∞'} ${displaySymbol}`
                                            )}
                                        </Text>
                                    </Row>
                                </Column>

                                <Column alignSelf="center">
                                    <Icon name="arrowRight" />
                                </Column>

                                <Column gap={12} flex="1">
                                    <Text>
                                        <Translation id="TR_EXCHANGE_APPROVAL_NEW_LIMIT" />
                                    </Text>
                                    <Row gap={12}>
                                        <TradingCoinLogo cryptoId={cryptoId} size={24} />
                                        <Text>0 {displaySymbol}</Text>
                                    </Row>
                                </Column>
                            </Row>
                        </Column>
                    </Box>

                    <Box
                        padding={12}
                        borderWidth={borders.widths.large}
                        borderRadius={borders.radii.sm}
                    >
                        <Fees
                            label="TR_TX_FEE"
                            feeInfo={feeInfo}
                            account={account}
                            composedLevels={composedLevels}
                            changeFeeLevel={handleFeeChange}
                        />
                    </Box>

                    {composedLevelsError && (
                        <Banner
                            intent="critical"
                            icon="warning"
                            description={
                                <Translation
                                    id={composedLevelsError.id}
                                    values={composedLevelsError.values}
                                />
                            }
                        />
                    )}
                </Column>
            </Modal>
        </FormProvider>
    );
};
