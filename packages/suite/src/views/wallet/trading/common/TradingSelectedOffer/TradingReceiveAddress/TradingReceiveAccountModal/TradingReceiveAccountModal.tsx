import { Translation } from '@suite/intl';
import { cryptoIdToSymbol } from '@suite-common/trading';
import { selectHasRunningDiscovery, selectSelectedDevice } from '@suite-common/wallet-core';
import { Column, Modal } from '@trezor/components';

import { openModal } from 'src/actions/suite/modalActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingReceiveAddressEmpty } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { TradingReceiveAccountSuiteOption } from './TradingReceiveAccountSuiteOption';
import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

export const TradingReceiveAccountModal = () => {
    const { tradingReceiveAddress, cryptoId } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);

    const { suiteReceiveAccounts, canAddSuiteAccount, canUseNonSuiteAccount } =
        tradingReceiveAddress;

    const symbol = cryptoIdToSymbol(cryptoId);

    const hasSuiteAccounts = suiteReceiveAccounts && suiteReceiveAccounts.length > 0;

    const onCancel = () => {
        modalControls.close();
    };

    const onAddAccountClick = () => {
        if (!device || !symbol) return;

        modalControls.close();

        dispatch(
            openModal({
                type: 'add-account',
                device,
                symbol,
                noRedirect: true,
                isCoinjoinDisabled: true,
                isBackClickDisabled: true,
                onConfirm: () => {
                    modalControls.open('accountModal');
                },
            }),
        );
    };

    const onUseExternalAddressClick = () => {
        modalControls.open('customAddressModal');
    };

    const showBottomContent = canAddSuiteAccount || canUseNonSuiteAccount;

    return (
        <Modal
            data-testid="@trading/receive-account-modal"
            heading={<Translation id="TR_BUY_RECEIVING_ACCOUNT" />}
            onCancel={onCancel}
            width={480}
            bottomContent={
                showBottomContent ? (
                    <>
                        {canAddSuiteAccount && (
                            <Modal.Button
                                data-testid="@trading/receive-account-modal/option/add-suite"
                                onClick={onAddAccountClick}
                                intent="neutral"
                                priority="secondary"
                            >
                                Add account
                            </Modal.Button>
                        )}
                        {canUseNonSuiteAccount && (
                            <Modal.Button
                                data-testid="@trading/receive-account-modal/option/non-suite"
                                onClick={onUseExternalAddressClick}
                                iconLeft="arrowSquareOut"
                                intent="neutral"
                                priority="secondary"
                                flex="1"
                            >
                                Use external address
                            </Modal.Button>
                        )}
                    </>
                ) : undefined
            }
        >
            <Column gap={12}>
                {isDiscoveryRunning && <DiscoveryWarning />}

                {!hasSuiteAccounts && !isDiscoveryRunning && (
                    <TradingReceiveAddressEmpty
                        title={<Translation id="TR_TRADING_RECEIVE_ACCOUNT_NOT_FOUND_TITLE" />}
                        text={<Translation id="TR_TRADING_RECEIVE_ACCOUNT_NOT_FOUND_TEXT" />}
                    />
                )}

                <Column gap={8}>
                    {suiteReceiveAccounts?.map(account => (
                        <TradingReceiveAccountSuiteOption key={account.key} account={account} />
                    ))}
                </Column>
            </Column>
        </Modal>
    );
};
