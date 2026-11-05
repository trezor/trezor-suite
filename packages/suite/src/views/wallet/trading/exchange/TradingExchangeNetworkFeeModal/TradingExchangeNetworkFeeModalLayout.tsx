import { Translation } from '@suite/intl';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Banner, Column, Modal } from '@trezor/components';
import { WarningCircleIcon } from '@trezor/icons';

import { FeeLevels } from 'src/components/wallet/Fees/CollapsibleFees/FeeLevels/FeeLevels';
import { useFeeLevels } from 'src/components/wallet/Fees/CollapsibleFees/FeeLevels/useFeeLevels';
import { FeesContext, type FeesContextType } from 'src/components/wallet/Fees/context/FeesContext';

import { TradingExchangeNetworkFeeModalTotal } from './TradingExchangeNetworkFeeModalTotal';

type TradingExchangeNetworkFeeModalLayoutProps = {
    account: Account;
    fees: FeesContextType;
    isConfirmDisabled: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export const TradingExchangeNetworkFeeModalLayout = ({
    account,
    fees,
    isConfirmDisabled,
    onConfirm,
    onClose,
}: TradingExchangeNetworkFeeModalLayoutProps) => {
    const { isTrc20Transfer, txMaxFee } = useFeeLevels(fees);
    const composedLevel = fees.composedLevels?.[fees.selectedFee];

    return (
        <Modal
            heading={<Translation id="TR_TRADING_NETWORK_FEE" />}
            description={<Translation id="TR_TRADING_NETWORK_FEE_MODAL_DESC" />}
            onCancel={onClose}
            width={400}
            bottomContent={
                <>
                    <Modal.Button
                        isDisabled={isConfirmDisabled}
                        onClick={onConfirm}
                        data-testid="@trading/network-fee-modal/confirm"
                    >
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                    <Modal.Button
                        intent="neutral"
                        priority="secondary"
                        onClick={onClose}
                        data-testid="@trading/network-fee-modal/cancel"
                    >
                        <Translation id="TR_CANCEL" />
                    </Modal.Button>
                </>
            }
        >
            <FeesContext.Provider value={fees}>
                <Column gap={16} overflow="unset">
                    <FeeLevels
                        showCurrentFee
                        feeCardAppearance={{ minWidth: '100%', cardType: 'raised' }}
                    />

                    {!isTrc20Transfer && (
                        <TradingExchangeNetworkFeeModalTotal txMaxFee={txMaxFee} />
                    )}

                    {composedLevel?.type === 'error' && (
                        <Banner
                            icon={WarningCircleIcon}
                            intent="critical"
                            title={
                                <Translation
                                    id="TR_TRADING_NETWORK_FEE_MODAL_NOT_ENOUGH_FUNDS"
                                    values={{
                                        networkDisplaySymbol: getNetworkDisplaySymbol(
                                            account.symbol,
                                        ),
                                    }}
                                />
                            }
                            description={
                                <Translation id="TR_TRADING_NETWORK_FEE_MODAL_NOT_ENOUGH_FUNDS_DESC" />
                            }
                        />
                    )}
                </Column>
            </FeesContext.Provider>
        </Modal>
    );
};
