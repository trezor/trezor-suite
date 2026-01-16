import { Fragment } from 'react';

import { Translation } from '@suite/intl';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { Card, Column, Divider, Modal } from '@trezor/components';
import { spacings } from '@trezor/theme';

import { useSelector } from 'src/hooks/suite';
import { DiscoveryWarning } from 'src/views/wallet/staking/components/StakingDashboard/components/DiscoveryWarning';
import { TradingReceiveAddressEmpty } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/TradingReceiveAddress';
import { useReceiveAddressModalControls } from 'src/views/wallet/trading/common/TradingSelectedOffer/TradingReceiveAddress/useReceiveAddressModalControls';

import { TradingReceiveAccountOption } from './TradingReceiveAccountOption';
import { useTradingReceiveAddressValues } from '../useTradingReceiveAddressValues';

export const TradingReceiveAccountModal = () => {
    const { tradingReceiveAddress } = useTradingReceiveAddressValues();
    const modalControls = useReceiveAddressModalControls();

    const isDiscoveryRunning = useSelector(selectHasRunningDiscovery);
    const { selectAccountOptions } = tradingReceiveAddress;

    const hasSuiteAccounts = !!selectAccountOptions.find(option => option.type === 'SUITE');

    const onCancel = () => {
        modalControls.close();
    };

    return (
        <Modal
            data-testid="@trading/receive-account-modal"
            heading={<Translation id="TR_BUY_RECEIVING_ACCOUNT" />}
            onCancel={onCancel}
        >
            <Column gap={spacings.sm}>
                {isDiscoveryRunning && <DiscoveryWarning />}

                {!hasSuiteAccounts && !isDiscoveryRunning && (
                    <TradingReceiveAddressEmpty
                        title={<Translation id="TR_TRADING_RECEIVE_ACCOUNT_NOT_FOUND_TITLE" />}
                        text={<Translation id="TR_TRADING_RECEIVE_ACCOUNT_NOT_FOUND_TEXT" />}
                    />
                )}

                {selectAccountOptions.length > 0 && (
                    <Card paddingType="none">
                        {selectAccountOptions.map((option, index) => (
                            <Fragment key={index}>
                                <TradingReceiveAccountOption option={option} />
                                {index < selectAccountOptions.length - 1 && <Divider margin={0} />}
                            </Fragment>
                        ))}
                    </Card>
                )}
            </Column>
        </Modal>
    );
};
