import { useSelector } from 'react-redux';

import { events, injectDesktopAnalytics } from '@suite/analytics';
import { FirmwareUpgradeNeededModal } from '@suite/firmware-upgrade';
import { Translation, useTranslation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { selectIsRegionRestricted } from '@suite/regions';
import { gotoThunk } from '@suite/router';
import { sharedEvents } from '@suite-common/analytics/src/analyticsEvents';
import { selectSelectedDevice } from '@suite-common/device';
import { EarnFlow, EarnProvider } from '@suite-common/suite-types';
import {
    getTradingPrefilledFromAccountData,
    toTokenCryptoId,
    tradingActions,
} from '@suite-common/trading';
import { getYieldVaultContractAddress, isYieldSupported } from '@suite-common/wallet-core';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { Button, Grid, Tooltip } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { PlusIcon } from '@trezor/icons';
import { isWrappedNativeToken } from '@trezor/network-ethereum-suite-common';
import { injectDispatch } from '@trezor/redux-utils';

import { useFirmwareUpgradeModal } from '#src/hooks/suite/useFirmwareUpgradeModal';
import { useLayoutSize } from '#src/hooks/suite/useLayoutSize';

import { useYieldVaultDetail } from './useYieldVaultDetail';
import { getEarnRouteParams } from '../../utils/getEarnRouteParams';

// Wide enough for the longer deposit label with its icon; a narrower row wraps the actions instead.
const ACTION_MIN_WIDTH = 180;

export const YieldVaultDetailBalanceCardActions = () => {
    const selectedDevice = useSelector(selectSelectedDevice);
    const isRegionRestricted = useSelector(selectIsRegionRestricted);
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const { isBelowTablet } = useLayoutSize();
    const { translationString } = useTranslation();

    const { isFirmwareModalOpen, openFirmwareModal, closeFirmwareModal, updateFirmware } =
        useFirmwareUpgradeModal();

    const { account, vault, hasVaultPosition, hasDepositableBalance, messageSystem } =
        useYieldVaultDetail();

    const vaultContractAddress = getYieldVaultContractAddress(vault);

    const isFirmwareOutdated = !isYieldSupported(selectedDevice, {
        vaultToken: {
            networkSymbol: account.symbol,
            contractAddress: vault.token.address,
        },
    });

    const isDepositMoreDisabled =
        !vault.status.enter || !hasDepositableBalance || messageSystem.deposit.isDisabled;
    const isDepositNowDisabled = !vault.status.enter || messageSystem.deposit.isDisabled;
    const isWithdrawDisabled = !hasVaultPosition || messageSystem.withdraw.isDisabled;

    const onBuyClick = () => {
        const { symbol: networkSymbol, index: accountIndex, accountType } = account;

        // A wrapped-native (WETH) vault deposit spends the native asset (wrapped on the way in),
        // so prefill a native buy rather than the wrapped ERC-20, which on-ramps don't sell.
        const tokenAddress = isWrappedNativeToken(networkSymbol, vault.token.address)
            ? undefined
            : vault.token.address;

        const tokenCryptoId = tokenAddress
            ? toTokenCryptoId(
                  networkSymbol,
                  getContractAddressForNetworkSymbol(networkSymbol, tokenAddress),
              )
            : undefined;

        dispatch(
            tradingActions.setTradingFromPrefilledAccount(
                getTradingPrefilledFromAccountData(account, tokenCryptoId),
            ),
        );

        analytics.report({
            type: events.tradeNavigateEvent.name,
            payload: {
                action: 'navigate',
                type: 'buy',
                from: 'vault-detail',
                networkSymbol,
                contractAddress: tokenAddress ?? undefined,
            },
        });

        dispatch(
            gotoThunk({
                routeName: 'wallet-trading-buy',
                params: {
                    symbol: networkSymbol,
                    accountIndex,
                    accountType,
                },
            }),
        );
    };

    const onDepositClick = () => {
        if (isFirmwareOutdated) {
            analytics.report({
                type: sharedEvents.yieldDepositEvent.name,
                payload: {
                    action: 'continue',
                    type: 'firmware-upgrade-needed-modal',
                    networkSymbol: account.symbol,
                    vaultId: vault.id,
                },
            });

            openFirmwareModal();

            return;
        }

        analytics.report({
            type: sharedEvents.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'vault-detail',
                to: 'deposit-in-a-nutshell-modal',
                networkSymbol: account.symbol,
                vaultId: vault.id,
            },
        });

        dispatch(
            openModal({
                type: 'earn-in-a-nutshell',
                flow: EarnFlow.Yield,
                provider: EarnProvider.Morpho,
                account,
                analyticsStep: 'earn-dashboard',
                yieldContext: {
                    id: vault.id,
                    vaultAddress: vaultContractAddress ?? undefined,
                    tokenContractAddress: vault.token.address ?? undefined,
                },
            }),
        );
    };

    const onWithdrawClick = () => {
        if (!vaultContractAddress) return;

        if (isFirmwareOutdated) {
            analytics.report({
                type: sharedEvents.yieldWithdrawEvent.name,
                payload: {
                    action: 'continue',
                    type: 'firmware-upgrade-needed-modal',
                    networkSymbol: account.symbol,
                    vaultId: vault.id,
                },
            });

            openFirmwareModal();

            return;
        }

        analytics.report({
            type: sharedEvents.yieldNavigateEvent.name,
            payload: {
                action: 'continue',
                from: 'vault-detail',
                to: 'withdraw-form',
                networkSymbol: account.symbol,
                vaultId: vault.id,
            },
        });

        dispatch(
            gotoThunk({
                routeName: 'earn-yield-withdraw',
                params: getEarnRouteParams({
                    account,
                    vaultAddress: vaultContractAddress,
                }),
            }),
        );
    };

    const firmwareModal = isFirmwareModalOpen && (
        <FirmwareUpgradeNeededModal
            onClose={closeFirmwareModal}
            onUpdate={updateFirmware}
            featureName={translationString('TR_EARN_DEFI_YIELD')}
        />
    );

    if (!hasVaultPosition && !hasDepositableBalance) {
        if (isRegionRestricted) {
            return null;
        }

        return (
            <Button
                intent="neutral"
                priority="secondary"
                size="large"
                width="100%"
                onClick={onBuyClick}
            >
                <Translation id="TR_EARN_YIELD_VAULT_DETAIL_BUY" />
            </Button>
        );
    }

    return (
        <>
            {firmwareModal}

            <Grid columns={isBelowTablet ? 1 : 2} gap={isBelowTablet ? 12 : 8}>
                {hasVaultPosition ? (
                    <Tooltip
                        content={messageSystem.deposit.content}
                        width="100%"
                        minWidth={ACTION_MIN_WIDTH}
                    >
                        <Button
                            intent="brand"
                            size="large"
                            iconLeft={PlusIcon}
                            width="100%"
                            isDisabled={isDepositMoreDisabled}
                            onClick={onDepositClick}
                        >
                            <Translation id="TR_EARN_YIELD_VAULT_DETAIL_DEPOSIT_MORE" />
                        </Button>
                    </Tooltip>
                ) : (
                    <Tooltip
                        content={messageSystem.deposit.content}
                        width="100%"
                        minWidth={ACTION_MIN_WIDTH}
                    >
                        <Button
                            intent="brand"
                            size="large"
                            iconLeft={PlusIcon}
                            width="100%"
                            isDisabled={isDepositNowDisabled}
                            onClick={onDepositClick}
                        >
                            <Translation id="TR_EARN_YIELD_VAULT_DETAIL_DEPOSIT_NOW" />
                        </Button>
                    </Tooltip>
                )}

                <Tooltip
                    content={messageSystem.withdraw.content}
                    width="100%"
                    minWidth={ACTION_MIN_WIDTH}
                >
                    <Button
                        intent="brand"
                        priority="secondary"
                        size="large"
                        width="100%"
                        isDisabled={isWithdrawDisabled}
                        onClick={onWithdrawClick}
                    >
                        <Translation id="TR_EARN_YIELD_VAULT_DETAIL_WITHDRAW" />
                    </Button>
                </Tooltip>
            </Grid>
        </>
    );
};
