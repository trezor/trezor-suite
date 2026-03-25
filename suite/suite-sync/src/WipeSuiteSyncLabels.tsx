import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectSelectedDevice } from '@suite-common/device';
import { type SuiteSyncUpdateError } from '@suite-common/suite-sync-storage';
import { type EnsureWalletSuiteSyncOnErrors, type SuiteSync } from '@suite-common/suite-sync-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { Button } from '@trezor/components';
import { type StaticSessionId } from '@trezor/connect';
import { ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';
import { type TimerId, exhaustive } from '@trezor/type-utils';

const WIPE_CONFIRM_DELAY_MS = 3_000;

type WipeSuiteSyncLabelsError = EnsureWalletSuiteSyncOnErrors | SuiteSyncUpdateError;

export type WipeSuiteSyncLabelsOnError = (params: {
    deviceStaticSessionId: StaticSessionId;
    error: WipeSuiteSyncLabelsError;
}) => void;

type WipeSuiteSyncLabelsProps = {
    onError: WipeSuiteSyncLabelsOnError;
    suiteSync: SuiteSync;
};

type WipeSuiteSyncLabelsStep = 'wipingLoading' | 'areYouSure' | 'confirmDeletion' | 'start';

/**
 * @deprecated Intended only for debug & testing
 */
export const WipeSuiteSyncLabels = ({ onError, suiteSync }: WipeSuiteSyncLabelsProps) => {
    const [step, setStep] = useState<WipeSuiteSyncLabelsStep>('start');
    const [wipeConfirmationCountdown, setWipeConfirmationCountdown] = useState(0);

    const wipeConfirmationTimeoutRef = useRef<TimerId | null>(null);
    const wipeConfirmationIntervalRef = useRef<TimerId | null>(null);

    const selectedDevice = useSelector(selectSelectedDevice);

    const selectedDeviceStaticSessionId = selectedDevice?.state?.staticSessionId;

    const getButtonLabel = (currentStep: WipeSuiteSyncLabelsStep) => {
        switch (currentStep) {
            case 'wipingLoading':
                return 'Wiping labels...';
            case 'areYouSure':
                return `Are you sure? (${wipeConfirmationCountdown}s)`;
            case 'confirmDeletion':
                return 'Confirm deletion, CAN NOT BE UNDONE ❗';
            case 'start':
                return 'Wipe labels';
            default:
                return exhaustive(currentStep);
        }
    };

    useEffect(
        () => () => {
            if (wipeConfirmationTimeoutRef.current !== null) {
                clearTimeout(wipeConfirmationTimeoutRef.current);
            }

            if (wipeConfirmationIntervalRef.current !== null) {
                clearInterval(wipeConfirmationIntervalRef.current);
            }
        },
        [],
    );

    const isDisabled =
        step === 'wipingLoading' ||
        step === 'areYouSure' ||
        selectedDeviceStaticSessionId === undefined;

    const handleWipeButtonClick = async () => {
        switch (step) {
            case 'start':
                setStep('areYouSure');
                setWipeConfirmationCountdown(Math.ceil(WIPE_CONFIRM_DELAY_MS / 1_000));

                if (wipeConfirmationTimeoutRef.current !== null) {
                    clearTimeout(wipeConfirmationTimeoutRef.current);
                }

                if (wipeConfirmationIntervalRef.current !== null) {
                    clearInterval(wipeConfirmationIntervalRef.current);
                }

                wipeConfirmationIntervalRef.current = setInterval(() => {
                    setWipeConfirmationCountdown(countdown => Math.max(countdown - 1, 0));
                }, 1_000);

                wipeConfirmationTimeoutRef.current = setTimeout(() => {
                    setStep('confirmDeletion');
                    setWipeConfirmationCountdown(0);

                    if (wipeConfirmationIntervalRef.current !== null) {
                        clearInterval(wipeConfirmationIntervalRef.current);
                        wipeConfirmationIntervalRef.current = null;
                    }
                }, WIPE_CONFIRM_DELAY_MS);

                return;
            case 'areYouSure':
            case 'wipingLoading':
                return;

            case 'confirmDeletion':
                setStep('wipingLoading');

                if (selectedDeviceStaticSessionId !== undefined) {
                    const { walletDescriptor } = parseDeviceStaticSessionId(
                        selectedDeviceStaticSessionId,
                    );
                    const result = await suiteSync.dangerouslyWipeAllLabelsFromWallet({
                        walletDescriptor,
                    });

                    if (!result.success) {
                        onError({
                            error: result.error,
                            deviceStaticSessionId: selectedDeviceStaticSessionId,
                        });
                    }
                }

                setStep('start');
                setWipeConfirmationCountdown(0);

                if (wipeConfirmationIntervalRef.current !== null) {
                    clearInterval(wipeConfirmationIntervalRef.current);
                    wipeConfirmationIntervalRef.current = null;
                }

                return;
            default:
                exhaustive(step);
        }
    };

    return (
        <SectionItem>
            <TextColumn
                title="Wipe Suite Sync labels"
                description="Sets all current Suite Sync wallet, account, address, and output labels for the selected wallet to null."
            />
            <ActionColumn>
                <Button
                    data-testid="@settings/debug/suite-sync/wipe-labels-button"
                    intent="critical"
                    isLoading={step === 'wipingLoading'}
                    isDisabled={isDisabled}
                    size="small"
                    onClick={handleWipeButtonClick}
                >
                    {getButtonLabel(step)}
                </Button>
            </ActionColumn>
        </SectionItem>
    );
};
