import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { goto } from '@suite/router';
import { useServices } from '@suite-common/dependency-injection';
import { useDispatch } from '@suite-common/redux-utils';
import { type Account } from '@suite-common/wallet-types';
import { getTronWithdrawableBalance } from '@suite-common/wallet-utils';
import { Banner, Tooltip } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useMessageSystemStaking } from 'src/hooks/suite/useMessageSystemStaking';

interface TronWithdrawReadyBannerProps {
    account: Account;
}

export const TronWithdrawReadyBanner = ({ account }: TronWithdrawReadyBannerProps) => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectDesktopAnalyticsDep);
    const withdrawableAmount = getTronWithdrawableBalance(account);

    const { isWithdrawingDisabled, withdrawingMessageContent } = useMessageSystemStaking(
        account.symbol,
    );

    if (new BigNumber(withdrawableAmount).lte(0)) {
        return null;
    }

    const goToWithdraw = () => {
        dispatch(
            goto({
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
        <Banner
            icon
            intent="info"
            rightContent={
                <Tooltip content={withdrawingMessageContent}>
                    <Banner.Button onClick={goToWithdraw} isDisabled={isWithdrawingDisabled}>
                        <Translation id="TR_EARN_TRON_WITHDRAW_TITLE" />
                    </Banner.Button>
                </Tooltip>
            }
            description={
                <Translation
                    id="TR_EARN_TRON_WITHDRAW_READY"
                    values={{
                        amount: (
                            <FormattedCryptoAmount
                                value={withdrawableAmount}
                                symbol={account.symbol}
                            />
                        ),
                    }}
                />
            }
        />
    );
};
