import { Translation } from '@suite/intl';
import { useSelector } from '@suite-common/redux-utils';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { CardList, Column, Modal } from '@trezor/components';

import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingReceiveAddressEmpty } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { TradingReceiveAccountAddSuiteOption } from './TradingReceiveAccountAddSuiteOption';
import { TradingReceiveAccountNonSuiteOption } from './TradingReceiveAccountNonSuiteOption';
import { TradingReceiveAccountSuiteOption } from './TradingReceiveAccountSuiteOption';
import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

export const TradingReceiveAccountModal = () => {
    const { tradingReceiveAddress } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { suiteReceiveAccounts, canAddSuiteAccount, canUseNonSuiteAccount } =
        tradingReceiveAddress;

    const hasSuiteAccounts = !!(suiteReceiveAccounts && suiteReceiveAccounts.length > 0);
    const onCancel = () => {
        modalControls.close();
    };

    return (
        <Modal
            data-testid="@trading/receive-account-modal"
            heading={<Translation id="TR_BUY_RECEIVING_ACCOUNT" />}
            onCancel={onCancel}
            width={600}
        >
            <Column gap={12}>
                {isDiscoveryRunning && <DiscoveryWarning />}

                {!hasSuiteAccounts && !isDiscoveryRunning && (
                    <TradingReceiveAddressEmpty
                        title={<Translation id="TR_TRADING_RECEIVE_ACCOUNT_NOT_FOUND_TITLE" />}
                        text={<Translation id="TR_TRADING_RECEIVE_ACCOUNT_NOT_FOUND_TEXT" />}
                    />
                )}

                {(hasSuiteAccounts || canAddSuiteAccount || canUseNonSuiteAccount) && (
                    <CardList>
                        {suiteReceiveAccounts?.map(account => (
                            <TradingReceiveAccountSuiteOption key={account.key} account={account} />
                        ))}
                        {canAddSuiteAccount && <TradingReceiveAccountAddSuiteOption />}
                        {canUseNonSuiteAccount && <TradingReceiveAccountNonSuiteOption />}
                    </CardList>
                )}
            </Column>
        </Modal>
    );
};
