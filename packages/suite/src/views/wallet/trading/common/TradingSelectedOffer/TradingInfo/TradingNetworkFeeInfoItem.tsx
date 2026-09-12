import { useState } from 'react';

import { Translation } from '@suite/intl';
import { type TradingComposedTransactionInfo } from '@suite-common/trading';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account, type FeeInfo, type FormState } from '@suite-common/wallet-types';
import { InfoItem, Text, TextButton, Tooltip } from '@trezor/components';
import { PencilSimpleIcon } from '@trezor/icons';

import { BaseCurrencyValue, FormattedCryptoAmount } from 'src/components/suite';
import { type getFeeTooltipTextId } from 'src/components/wallet/Fees/feeUtils';
import { TradingExchangeNetworkFeeModal } from 'src/views/wallet/trading/exchange/TradingExchangeNetworkFeeModal/TradingExchangeNetworkFeeModal';

export type TradingNetworkFeeInfoItemProps = {
    amount: string;
    symbol: NetworkSymbol;
    tooltipTextId: ReturnType<typeof getFeeTooltipTextId>;
    edit?: {
        account: Account;
        feeInfo: FeeInfo;
        composeFormState: FormState;
        onConfirm: (composedTransactionInfo: TradingComposedTransactionInfo) => void;
    };
};

export const TradingNetworkFeeInfoItem = ({
    amount,
    symbol,
    tooltipTextId,
    edit,
}: TradingNetworkFeeInfoItemProps) => {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (isEditModalOpen && !edit) {
        setIsEditModalOpen(false);
    }

    return (
        <>
            <InfoItem
                label={
                    <Tooltip
                        content={
                            <Translation
                                id={tooltipTextId}
                                values={{
                                    br: <br />,
                                    networkDisplaySymbol: getNetworkDisplaySymbol(symbol),
                                }}
                            />
                        }
                        hasIcon
                    >
                        <Translation id="TR_TRADING_NETWORK_FEE" />
                    </Tooltip>
                }
                direction="row"
            >
                {edit ? (
                    <TextButton
                        onClick={() => setIsEditModalOpen(true)}
                        size="small"
                        iconRight={PencilSimpleIcon}
                        intent="brand"
                        isUnderlined
                        data-testid="@trading/offer/info/network-fee"
                    >
                        <BaseCurrencyValue
                            disableHiddenPlaceholder
                            amount={amount}
                            symbol={symbol}
                            rateType="current"
                            showApproximationIndicator
                        />
                    </TextButton>
                ) : (
                    <Tooltip
                        content={
                            <FormattedCryptoAmount
                                disableHiddenPlaceholder
                                value={amount}
                                symbol={symbol}
                            />
                        }
                    >
                        <Text
                            typographyStyle="body-sm"
                            data-testid="@trading/offer/info/network-fee"
                        >
                            <BaseCurrencyValue
                                disableHiddenPlaceholder
                                amount={amount}
                                symbol={symbol}
                                rateType="current"
                                showApproximationIndicator
                            />
                        </Text>
                    </Tooltip>
                )}
            </InfoItem>

            {isEditModalOpen && edit && (
                <TradingExchangeNetworkFeeModal
                    account={edit.account}
                    feeInfo={edit.feeInfo}
                    composeFormState={edit.composeFormState}
                    onConfirm={edit.onConfirm}
                    onClose={() => setIsEditModalOpen(false)}
                />
            )}
        </>
    );
};
