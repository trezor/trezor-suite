import { FormProvider } from 'react-hook-form';

import { type CryptoId, type DexApprovalType } from 'invity-api';

import { DebugOnlyBadge, selectIsDebugModeActive } from '@suite/debug';
import { useDevice } from '@suite/device';
import { Translation, type TranslationKey } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { getDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isAllowanceUnlimited } from '@suite-common/wallet-utils';
import {
    Banner,
    Card,
    CardList,
    CollapsibleBox,
    Column,
    Modal,
    Row,
    Text,
} from '@trezor/components';
import { CaretDownIcon, InfoIcon, WarningIcon } from '@trezor/icons';
import { NetworkIcon, TokenIcon } from '@trezor/product-components';
import { useAsyncClickHandler } from '@trezor/react-utils';

import { AccountLabeling } from 'src/components/suite/labeling/AccountLabeling';
import { Fees } from 'src/components/wallet/Fees/Fees';
import { useAllowanceModal } from 'src/hooks/wallet/allowance';

import {
    type AllowanceModalProvider,
    AllowanceModalProviderInfo,
} from './AllowanceModalProviderInfo';
import { ApproveModalTypeSelector } from './ApproveModalTypeSelector';

interface ApproveModalProps {
    amount: string;
    cryptoId: CryptoId;
    account: Account;
    provider: AllowanceModalProvider;
    spender: string;
    showSpender?: boolean;
    preapprovedAmount?: string;
    heading: TranslationKey;
    description: TranslationKey;
    onSelectApprovalType?: (type: DexApprovalType) => void;
    onConfirm?: (approvalType: DexApprovalType) => void;
    onCancel?: () => void;
}

export const ApproveModal = (props: ApproveModalProps) => {
    const { account, provider, spender, preapprovedAmount, showSpender, heading, description } =
        props;
    const { device } = useDevice();
    const { handleClick, disabled: isConfirmInProgress } = useAsyncClickHandler();
    const context = useAllowanceModal({ ...props, type: 'APPROVE' });
    const isDebug = useSelector(selectIsDebugModeActive);

    const {
        inputAmount,
        feeInfo,
        token,
        approvalType,
        isLoading,
        composedLevels,
        composedLevelsError,
        canSubmit,
        data,
        methods,
        selectApprovalType,
        handleClose,
        handleFeeChange,
        confirmAndSend,
    } = context;

    if (!token?.symbol) return null;

    const displaySymbol = getDisplaySymbol(token.symbol, token.contract);
    const hasPreapprovedAmount = !!preapprovedAmount && preapprovedAmount !== '0';
    const isPreapprovedAmountUnlimited =
        hasPreapprovedAmount &&
        isAllowanceUnlimited({ amount: preapprovedAmount, decimals: token.decimals });

    return (
        <FormProvider {...methods}>
            <Modal
                onCancel={handleClose}
                intent="brand"
                width={480}
                heading={<Translation id={heading} values={{ displaySymbol }} />}
                description={<Translation id={description} values={{ displaySymbol }} />}
                bottomContent={
                    <>
                        <Modal.Button
                            data-testid="@modal/approve/continue-button"
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
                // Disable shadow bottom to make `Fees` component fully visible
                shadowBottom={false}
            >
                <Column gap={8}>
                    {hasPreapprovedAmount && (
                        <Banner
                            intent="info"
                            icon={InfoIcon}
                            description={<Translation id="TR_APPROVAL_MODAL_APPROVE_BANNER" />}
                        />
                    )}
                    <CardList>
                        <CardList.Item>
                            <Text typographyStyle="body-sm">
                                <Translation id="TR_ACCOUNT" />
                            </Text>
                            <Row gap={8} data-testid="@modal/approve/account-value">
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
                                    <Translation id="TR_APPROVAL_CURRENT_LIMIT" />
                                </Text>
                                <Row gap={8}>
                                    <TokenIcon
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
                                </Row>
                            </CardList.Item>
                        )}
                        <ApproveModalTypeSelector
                            approvalType={approvalType}
                            isLoading={isLoading}
                            data={data}
                            networkSymbol={account.symbol}
                            onSelect={selectApprovalType}
                            provider={provider}
                            token={token}
                            displayAmount={inputAmount}
                            hasPreapprovedAmount={hasPreapprovedAmount}
                        />
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
                            toggleIcon={CaretDownIcon}
                            toggleIconSize={20}
                        >
                            <Text wordBreak="break-all" isMonospaced>
                                {data}
                            </Text>
                        </CollapsibleBox>
                    )}

                    <Column gap={12}>
                        <Card>
                            <Fees
                                label="TR_TX_FEE"
                                feeInfo={feeInfo}
                                account={account}
                                composedLevels={composedLevels}
                                changeFeeLevel={handleFeeChange}
                                headerTypographyStyle="body-sm"
                            />
                        </Card>

                        {composedLevelsError && (
                            <Banner
                                intent="critical"
                                icon={WarningIcon}
                                description={
                                    <Translation
                                        id={composedLevelsError.id}
                                        values={composedLevelsError.values}
                                    />
                                }
                            />
                        )}
                    </Column>
                </Column>
            </Modal>
        </FormProvider>
    );
};
