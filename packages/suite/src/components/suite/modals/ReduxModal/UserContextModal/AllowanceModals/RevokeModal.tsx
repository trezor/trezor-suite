import { FormProvider } from 'react-hook-form';
import { useSelector } from 'react-redux';

import { type CryptoId } from 'invity-api';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isAllowanceUnlimited, shouldShowRevokeAllowanceBanner } from '@suite-common/wallet-utils';
import {
    Banner,
    Box,
    CardList,
    CollapsibleBox,
    Column,
    Icon,
    Modal,
    Row,
    Text,
} from '@trezor/components';
import { AssetLogo, NetworkIcon } from '@trezor/product-components';
import { useAsyncClickHandler } from '@trezor/react-utils';
import { borders } from '@trezor/theme';

import { AccountLabeling } from 'src/components/suite/labeling/AccountLabeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useAllowanceModal } from 'src/hooks/wallet/allowance';

import {
    type AllowanceModalProvider,
    AllowanceModalProviderInfo,
} from './AllowanceModalProviderInfo';

interface RevokeModalProps {
    cryptoId: CryptoId;
    account: Account;
    provider: AllowanceModalProvider;
    spender: string;
    showSpender?: boolean;
    preapprovedAmount?: string;
    approveAmount?: string;
    followedByApproval?: boolean;
    heading: TranslationKey;
    description: TranslationKey;
    onConfirm?: () => void;
    onCancel?: () => void;
}

export const RevokeModal = (props: RevokeModalProps) => {
    const {
        account,
        provider,
        spender,
        preapprovedAmount,
        approveAmount,
        showSpender,
        followedByApproval,
        heading,
        description,
    } = props;
    const { device } = useDevice();
    const { handleClick, disabled: isConfirmInProgress } = useAsyncClickHandler();
    const isDebug = useSelector(selectIsDebugModeActive);

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
        data,
        methods,
        handleClose,
        handleFeeChange,
        confirmAndSend,
    } = context;

    if (!token?.symbol) return null;

    const displaySymbol = getDisplaySymbol(token.symbol, token.contract);
    const hasPreapprovedAmount = !!preapprovedAmount && preapprovedAmount !== '0';
    const isPreapprovedAmountUnlimited =
        !!preapprovedAmount && isAllowanceUnlimited(preapprovedAmount, token.decimals);

    const showRevokeBanner = shouldShowRevokeAllowanceBanner({
        followedByApproval,
        preapprovedAmount,
        approveAmount,
        tokenContractAddress: token.contract,
    });

    return (
        <FormProvider {...methods}>
            <Modal
                onCancel={handleClose}
                intent="brand"
                width={480}
                heading={<Translation id={heading} values={{ displaySymbol }} />}
                description={
                    !showRevokeBanner && <Translation id={description} values={{ displaySymbol }} />
                }
                bottomContent={
                    <>
                        <Modal.Button
                            isLoading={isLoading || isConfirmInProgress}
                            isDisabled={!device?.connected || !canSubmit || isConfirmInProgress}
                            onClick={() => handleClick(confirmAndSend)}
                        >
                            <Translation id="TR_CONTINUE" />
                        </Modal.Button>

                        <Modal.Button intent="neutral" priority="secondary" onClick={handleClose}>
                            <Translation id="TR_CANCEL" />
                        </Modal.Button>
                    </>
                }
                shadowBottom={false}
            >
                <Column gap={8}>
                    {showRevokeBanner && (
                        <Banner
                            intent="warning"
                            icon="warning"
                            description={
                                <Translation
                                    id="TR_APPROVAL_MODAL_REVOKE_BANNER"
                                    values={{ displaySymbol }}
                                />
                            }
                        />
                    )}
                    <CardList borderRadius={borders.radii.sm}>
                        <CardList.Item>
                            <Text typographyStyle="body-sm">
                                <Translation id="TR_ACCOUNT" />
                            </Text>
                            <Row gap={8}>
                                <NetworkIcon networkSymbol={account.symbol} size={20} />
                                <AccountLabeling
                                    account={account}
                                    showAccountTypeBadge
                                    accountTypeBadgeSize="small"
                                    typographyStyle="body-sm"
                                />
                            </Row>
                        </CardList.Item>
                        <AllowanceModalProviderInfo
                            provider={provider}
                            spender={spender}
                            showSpender={showSpender}
                        />
                        {hasPreapprovedAmount && (
                            <CardList.Item>
                                <Text typographyStyle="body-sm">
                                    <Translation id="TR_APPROVAL_LIMIT" />
                                </Text>
                                <Row gap={8}>
                                    <AssetLogo
                                        symbol={account.symbol}
                                        contractAddress={token.contract}
                                        size={20}
                                        placeholder={displaySymbol}
                                    />
                                    <Text typographyStyle="body-sm-strong">
                                        {isPreapprovedAmountUnlimited ? (
                                            <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />
                                        ) : (
                                            `${preapprovedAmount} ${displaySymbol}`
                                        )}
                                    </Text>
                                    <Column alignSelf="center">
                                        <Icon name="arrowRight" size={16} />
                                    </Column>
                                    <Text typographyStyle="body-sm-strong">0 {displaySymbol}</Text>
                                </Row>
                            </CardList.Item>
                        )}
                    </CardList>

                    {isDebug && (
                        <CollapsibleBox
                            heading={
                                <Text typographyStyle="body-sm">
                                    <DebugOnlyBadge>
                                        <Translation id="TR_APPROVAL_DATA" />
                                    </DebugOnlyBadge>
                                </Text>
                            }
                            toggleIconName="caretDown"
                            toggleIconSize={20}
                        >
                            <Text wordBreak="break-all" isMonospaced>
                                {data}
                            </Text>
                        </CollapsibleBox>
                    )}

                    <Box
                        padding={{ horizontal: 20, vertical: 12 }}
                        borderWidth={borders.widths.small}
                        borderRadius={borders.radii.sm}
                        backgroundColor="surfaceFillRaised"
                    >
                        <Fees
                            label="TR_TX_FEE"
                            feeInfo={feeInfo}
                            account={account}
                            composedLevels={composedLevels}
                            changeFeeLevel={handleFeeChange}
                            headerTypographyStyle="body-sm"
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
