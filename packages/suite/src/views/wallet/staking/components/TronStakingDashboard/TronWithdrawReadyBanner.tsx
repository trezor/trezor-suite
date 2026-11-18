import { events, injectDesktopAnalytics } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import {
    formatStakingAmount,
    settleTronUnlocks,
    useStakingAccountPosition,
} from '@suite-common/earn-staking';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { Banner, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { InfoIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { FormattedCryptoAmount } from '#src/components/suite/FormattedCryptoAmount';
import { useTronFirmwareUpgradeModal } from '#src/hooks/earn/useTronFirmwareUpgradeModal';

import { useTronStakingOperation } from './hooks/useTronStakingOperation';

interface TronWithdrawReadyBannerProps {
    account: Account;
    nowMs: number;
}

export const TronWithdrawReadyBanner = ({ account, nowMs }: TronWithdrawReadyBannerProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const { productId, position } = useStakingAccountPosition(account.key);

    const withdraw = useTronStakingOperation(productId, 'withdraw');
    const { openFirmwareModal, firmwareModal } = useTronFirmwareUpgradeModal();

    if (position === null) {
        return null;
    }

    const { withdrawable } = settleTronUnlocks({ position, nowMs });

    const withdrawableAmount = formatStakingAmount({
        amount: withdrawable,
        networkSymbol: account.symbol,
    });

    if (!isPositiveBalance(withdrawableAmount)) {
        return null;
    }

    const goToWithdraw = () => {
        if (withdraw.isDisabled) return;

        if (withdraw.isFirmwareOutdated) {
            openFirmwareModal('TR_EARN_TRON_WITHDRAW_TITLE');

            return;
        }

        dispatch(
            gotoThunk({
                routeName: 'earn-tron-withdraw',
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

        analytics.report({
            type: events.stakingUnstakeEvent.name,
            payload: {
                action: 'continue',
                step: 'staking-dashboard',
                networkSymbol: account.symbol,
            },
        });
    };

    return (
        <>
            {firmwareModal}

            <Banner
                icon
                intent="info"
                data-testid="@staking/tron-withdraw-banner/container"
                rightContent={
                    <Tooltip content={withdraw.message}>
                        <Banner.Button
                            onClick={goToWithdraw}
                            isDisabled={withdraw.isDisabled}
                            iconLeft={withdraw.isDisabled ? InfoIcon : undefined}
                            data-testid="@staking/tron-withdraw-banner/withdraw-button"
                        >
                            <Translation id="TR_EARN_TRON_WITHDRAW_TITLE" />
                        </Banner.Button>
                    </Tooltip>
                }
                description={
                    <span data-testid="@staking/tron-withdraw-banner/description">
                        <Translation
                            id="TR_EARN_TRON_WITHDRAW_READY"
                            values={{
                                amount: (
                                    <FormattedCryptoAmount
                                        value={withdrawableAmount}
                                        networkSymbol={account.symbol}
                                    />
                                ),
                            }}
                        />
                    </span>
                }
            />
        </>
    );
};
