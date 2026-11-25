import { useSelector } from 'react-redux';

import { Translation } from '@suite/intl';
import { gotoThunk } from '@suite/router';
import { useFormatters } from '@suite-common/formatters';
import { toTokenSymbol } from '@suite-common/tokens';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type EarnListRootState,
    type YieldListItem,
    selectAccountByKey,
    selectYieldListItemFiatAmount,
} from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { TokenIcon } from '@trezor/product-components';
import { injectDispatch } from '@trezor/redux-utils';

import { getEarnRouteParams } from '#src/components/earn/utils/getEarnRouteParams';
import { BaseCurrencyValue } from '#src/components/suite/BaseCurrencyValue';

import { EarnPositionCard } from '../EarnPositionCard';
import { EarnRateBadge } from '../EarnRateBadge';

type YieldPositionCardProps = {
    position: YieldListItem;
};

export const YieldPositionCard = ({ position }: YieldPositionCardProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { CryptoAmountFormatter } = useFormatters();

    const {
        accountKey,
        networkSymbol,
        vaultName,
        apy,
        token,
        tokenSymbol,
        tokenBalance,
        tokenContractAddress,
        receiptTokenContract,
    } = position;

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const fiatValue = useSelector((state: EarnListRootState) =>
        selectYieldListItemFiatAmount(state, position),
    );

    if (!account) return null;

    const onPositionCardClick = () => {
        if (!receiptTokenContract) return;

        dispatch(
            gotoThunk({
                routeName: 'earn-yield-vault',
                params: getEarnRouteParams({
                    account,
                    vaultAddress: receiptTokenContract,
                }),
            }),
        );
    };

    const displaySymbol = isWrappedNativeToken(networkSymbol, tokenContractAddress)
        ? toTokenSymbol(getNetworkDisplaySymbol(networkSymbol))
        : tokenSymbol;

    const icon = (
        <TokenIcon
            networkSymbol={networkSymbol}
            contractAddress={tokenContractAddress}
            showNetworkIcon
            wrappedTokenIcon="network"
            isBordered={false}
            isTransparent={true}
            size={40}
        />
    );

    const fiatAmount = fiatValue && (
        <BaseCurrencyValue
            amount={fiatValue.toFixed()}
            symbol={networkSymbol}
            shouldConvert={false}
        />
    );

    const cryptoAmount =
        tokenBalance === null ? (
            <Translation id="TR_EARN_N_A" />
        ) : (
            <CryptoAmountFormatter
                value={tokenBalance}
                symbol={displaySymbol}
                isBalance
                formatStyle="compact-balance"
                tokenDecimals={token?.decimals}
            />
        );

    const badges = <EarnRateBadge rateKind="apy" rate={apy} />;

    return (
        <EarnPositionCard
            icon={icon}
            label={vaultName}
            account={account}
            fiatAmount={fiatAmount}
            cryptoAmount={cryptoAmount}
            badges={badges}
            onClick={onPositionCardClick}
        />
    );
};
