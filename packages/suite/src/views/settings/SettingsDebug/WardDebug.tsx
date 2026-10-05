import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import {
    WARDD_DEFAULT_URL,
    isValidWarddUrl,
    selectWarddToken,
    selectWarddUrl,
    suiteSettingsActions,
} from '@suite/settings';
import { Button, Input, Text } from '@trezor/components';
import { ActionButton, ActionColumn, SectionItem, TextColumn } from '@trezor/product-components';

import { wardFlushThunk, wardResetAppThunk, wardStatusThunk } from 'src/actions/suite/wardThunks';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type WardError, getWardErrorTranslationKey } from 'src/utils/suite/wardErrors';

import { useWardResetConfirmation } from './useWardResetConfirmation';

type WardOperation = 'status' | 'flush' | 'resetApp';

type WardOutcome = { summary: string } | { error: WardError };

type WardOutcomeTextProps = {
    outcome: WardOutcome | undefined;
};

const WardOutcomeText = ({ outcome }: WardOutcomeTextProps) => {
    if (outcome === undefined) {
        return null;
    }

    if ('error' in outcome) {
        return (
            <Text typographyStyle="body-sm" intent="critical">
                <Translation id={getWardErrorTranslationKey(outcome.error.code)} />
                {outcome.error.detail !== undefined && ` (${outcome.error.detail})`}
            </Text>
        );
    }

    return <Text typographyStyle="body-sm">{outcome.summary}</Text>;
};

// Debug controls for wardd, the local WARD service that Suite lends the device to. wardd's default
// origin list includes Suite web dev at http://localhost:8000. Desktop connects from the main
// process, which sends no origin, and wardd admits that.
export const WardDebug = () => {
    const warddUrl = useSelector(selectWarddUrl);
    const warddToken = useSelector(selectWarddToken);
    const [urlInput, setUrlInput] = useState(warddUrl);
    const [tokenInput, setTokenInput] = useState(warddToken ?? '');
    const [runningOperation, setRunningOperation] = useState<WardOperation | null>(null);
    const [outcomes, setOutcomes] = useState<Partial<Record<WardOperation, WardOutcome>>>({});
    const { device, isLocked } = useDevice();
    // Retiring the app role is hard to undo for the app that held it, so a second click confirms.
    const resetConfirmation = useWardResetConfirmation(device?.id ?? undefined);
    const dispatch = useDispatch();

    const trimmedUrl = urlInput.trim();
    const trimmedToken = tokenInput.trim();
    const isUrlValid = isValidWarddUrl(trimmedUrl);
    const isDeviceUnavailable = !device || isLocked();
    const isOperationDisabled = isDeviceUnavailable || runningOperation !== null;

    const handleSaveUrl = () => {
        dispatch(suiteSettingsActions.setDebugMode({ warddUrl: trimmedUrl }));
    };

    // setDebugMode is in neither the application log nor the Sentry breadcrumbs, and redux-logger
    // and the Redux DevTools extension show the token redacted.
    const handleSaveToken = () => {
        dispatch(suiteSettingsActions.setDebugMode({ warddToken: trimmedToken }));
    };

    const runOperation = async (
        operation: WardOperation,
        getOutcome: () => Promise<WardOutcome>,
    ) => {
        resetConfirmation.disarm();
        setRunningOperation(operation);
        const outcome = await getOutcome();
        setOutcomes(previousOutcomes => ({ ...previousOutcomes, [operation]: outcome }));
        setRunningOperation(null);
    };

    const handleStatus = () =>
        runOperation('status', async () => {
            const result = await dispatch(wardStatusThunk()).unwrap();

            if (!result.success) {
                return { error: result.error };
            }

            const { counter, wmCounter, isBehind } = result.payload;

            return {
                summary:
                    `Replica counter ${counter} · witness counter ${wmCounter ?? 'none'}` +
                    (isBehind ? ' · replica behind the witness' : ''),
            };
        });

    const handleFlush = () =>
        runOperation('flush', async () => {
            const result = await dispatch(wardFlushThunk()).unwrap();

            if (!result.success) {
                return { error: result.error };
            }

            const { published, remaining } = result.payload;

            return {
                summary: `Published ${published} · ${remaining} left in the device queue`,
            };
        });

    const handleResetApp = async () => {
        if (!resetConfirmation.isArmed) {
            resetConfirmation.arm();

            return;
        }

        await runOperation('resetApp', async () => {
            const result = await dispatch(wardResetAppThunk()).unwrap();

            if (!result.success) {
                return { error: result.error };
            }

            return {
                summary: result.payload.wasBound
                    ? 'WARD app role retired. The next app to use WARD may claim it.'
                    : 'No app held the WARD app role.',
            };
        });
    };

    return (
        <>
            <SectionItem data-testid="@settings/debug/ward-url">
                <TextColumn
                    title="WARD service URL"
                    description="Where wardd listens. Only addresses on this computer are accepted, because wardd receives the pairing token and the wallet's Evolu node."
                />
                <ActionColumn>
                    <Input
                        value={urlInput}
                        placeholder={WARDD_DEFAULT_URL}
                        onChange={event => setUrlInput(event.target.value)}
                        hasError={!isUrlValid}
                        bottomText={isUrlValid ? undefined : 'Use ws://127.0.0.1 or ws://localhost'}
                        rightContent={
                            <Button
                                size="small"
                                isDisabled={!isUrlValid || trimmedUrl === warddUrl}
                                onClick={handleSaveUrl}
                            >
                                Save
                            </Button>
                        }
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem data-testid="@settings/debug/ward-token">
                <TextColumn
                    title="WARD pairing token"
                    description="The token wardd keeps in ~/.trezor-ward/token. Suite stores it on this computer and sends it only to wardd."
                />
                <ActionColumn>
                    <Input
                        value={tokenInput}
                        isMasked
                        autoComplete="off"
                        spellCheck={false}
                        onChange={event => setTokenInput(event.target.value)}
                        rightContent={
                            <Button
                                size="small"
                                isDisabled={trimmedToken === (warddToken ?? '')}
                                onClick={handleSaveToken}
                            >
                                Save
                            </Button>
                        }
                    />
                </ActionColumn>
            </SectionItem>
            <SectionItem data-testid="@settings/debug/ward-status">
                <TextColumn
                    title="WARD status"
                    description="The head of this wallet's replica in wardd and the witness's head. The device is asked for the wallet's WARD id and Evolu node."
                    bottomContent={<WardOutcomeText outcome={outcomes.status} />}
                />
                <ActionColumn>
                    <ActionButton
                        isTooltipActive={isDeviceUnavailable}
                        tooltipContent="Connect and unlock a device to use WARD"
                        isDisabled={isOperationDisabled}
                        isLoading={runningOperation === 'status'}
                        onClick={handleStatus}
                    >
                        Check status
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
            <SectionItem data-testid="@settings/debug/ward-flush">
                <TextColumn
                    title="Flush WARD queue"
                    description="Publish the changes this wallet holds in the device queue through wardd. No confirmation on the device."
                    bottomContent={<WardOutcomeText outcome={outcomes.flush} />}
                />
                <ActionColumn>
                    <ActionButton
                        isTooltipActive={isDeviceUnavailable}
                        tooltipContent="Connect and unlock a device to use WARD"
                        isDisabled={isOperationDisabled}
                        isLoading={runningOperation === 'flush'}
                        onClick={handleFlush}
                    >
                        Flush now
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
            <SectionItem data-testid="@settings/debug/ward-reset-app">
                <TextColumn
                    title="Reset WARD app"
                    description="Retire the WARD app role pinned on this device, so that another app can claim it, for example Suite web after Suite desktop, or this app after its THP key changed. Hold to confirm on the device. The device keeps every entry, queued change and root."
                    bottomContent={<WardOutcomeText outcome={outcomes.resetApp} />}
                />
                <ActionColumn>
                    <ActionButton
                        isTooltipActive={isDeviceUnavailable}
                        tooltipContent="Connect and unlock a device to use WARD"
                        isDisabled={isOperationDisabled}
                        isLoading={runningOperation === 'resetApp'}
                        intent={resetConfirmation.isArmed ? 'critical' : undefined}
                        onClick={handleResetApp}
                    >
                        {resetConfirmation.isArmed ? 'Click again to confirm' : 'Reset app'}
                    </ActionButton>
                </ActionColumn>
            </SectionItem>
        </>
    );
};
