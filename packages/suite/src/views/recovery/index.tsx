import { useState } from 'react';
import { useIntl } from 'react-intl';

import {
    getCheckBackupUrl,
    getNarrowedDeviceModelInternal,
    isDeviceAcquired,
    isDeviceWithButtons,
} from '@suite-common/suite-utils';
import { Card, H2, H3, Image, List, NewModal, Paragraph } from '@trezor/components';
import { pickByDeviceModel } from '@trezor/device-utils';
import TrezorConnect, { DeviceModelInternal } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { SelectRecoveryType, SelectWordCount } from 'src/components/recovery';
import { CheckItem, Loading, Translation } from 'src/components/suite';
import {
    checkSeed,
    setAdvancedRecovery,
    setStatus,
    setWordsCount,
} from 'src/actions/recovery/recoveryActions';
import { useDevice, useDispatch, useSelector } from 'src/hooks/suite';
import type { ForegroundAppProps } from 'src/types/suite';
import type { WordCount } from 'src/types/recovery';
import messages from 'src/support/messages';
import { LearnMoreButton } from 'src/components/suite/LearnMoreButton';
import { MODAL } from 'src/actions/suite/constants';

import { T1B1InputStep } from './steps/T1B1InputStep';
import { EnterOnDeviceStep } from './steps/EnterOnDeviceStep';

export const Recovery = ({ onCancel }: ForegroundAppProps) => {
    const recovery = useSelector(state => state.recovery);
    const modal = useSelector(state => state.modal);
    const dispatch = useDispatch();
    const { device, isLocked } = useDevice();
    const [understood, setUnderstood] = useState(false);

    const intl = useIntl();

    const onSetWordsCount = (count: WordCount) => {
        dispatch(setWordsCount(count));
        dispatch(setStatus('select-recovery-type'));
    };

    const onSetRecoveryType = (type: 'standard' | 'advanced') => {
        dispatch(setAdvancedRecovery(type === 'advanced'));
        dispatch(checkSeed());
    };

    const deviceModelInternal = device?.features?.internal_model;
    const learnMoreUrl = getCheckBackupUrl(device);
    const statesInProgressBar =
        deviceModelInternal === DeviceModelInternal.T1B1
            ? [
                  'initial',
                  'select-word-count',
                  'select-recovery-type',
                  'waiting-for-confirmation',
                  'in-progress',
                  'finished',
              ]
            : ['initial', 'in-progress', 'finished'];
    const hasFinished = recovery.status === 'finished';
    const hasError = recovery.error !== undefined;

    const handleClose = () => {
        if (['in-progress', 'waiting-for-confirmation'].includes(recovery.status)) {
            TrezorConnect.cancel(intl.formatMessage(messages.TR_CANCELLED));
        } else {
            onCancel();
        }
    };

    if (!isDeviceAcquired(device) || !deviceModelInternal) {
        return (
            <NewModal
                heading={<Translation id="TR_RECONNECT_HEADER" />}
                onCancel={onCancel}
                data-testid="@recovery/no-device"
                size="tiny"
            >
                <Image image="CONNECT_DEVICE" />
            </NewModal>
        );
    }

    const getStep = () => {
        const isShamirBackupAvailable =
            device?.features?.capabilities?.includes('Capability_Shamir');

        switch (recovery.status) {
            case 'initial': {
                const descriptionSuffix = isDeviceWithButtons(deviceModelInternal)
                    ? getNarrowedDeviceModelInternal(deviceModelInternal)
                    : 'TOUCHSCREEN';

                return (
                    <>
                        <List isOrdered gap={spacings.xxl}>
                            <List.Item>
                                <Paragraph typographyStyle="hint">
                                    <Translation
                                        id={`TR_CHECK_RECOVERY_SEED_DESC_${descriptionSuffix}`}
                                    />
                                </Paragraph>
                                <Paragraph
                                    typographyStyle="label"
                                    variant="tertiary"
                                    margin={{ top: spacings.xxs }}
                                >
                                    <Translation
                                        id={
                                            isShamirBackupAvailable
                                                ? 'TR_SEED_BACKUP_LENGTH_INCLUDING_SHAMIR'
                                                : 'TR_SEED_BACKUP_LENGTH'
                                        }
                                    />
                                </Paragraph>
                            </List.Item>
                            <List.Item>
                                <Paragraph typographyStyle="hint">
                                    <Translation id="TR_ENTER_ALL_WORDS_IN_CORRECT" />
                                </Paragraph>
                                <Paragraph
                                    typographyStyle="label"
                                    variant="tertiary"
                                    margin={{ top: spacings.xxs }}
                                >
                                    <Translation
                                        id={pickByDeviceModel(deviceModelInternal, {
                                            default: 'TR_SEED_WORDS_ENTER_TOUCHSCREEN',
                                            [DeviceModelInternal.T1B1]:
                                                'TR_SEED_WORDS_ENTER_COMPUTER',
                                            [DeviceModelInternal.T2B1]:
                                                'TR_SEED_WORDS_ENTER_BUTTONS',
                                            [DeviceModelInternal.T3B1]:
                                                'TR_SEED_WORDS_ENTER_BUTTONS',
                                        })}
                                    />
                                </Paragraph>
                            </List.Item>
                        </List>
                        <Card margin={{ top: spacings.xxl }}>
                            <CheckItem
                                data-testid="@recovery/user-understands-checkbox"
                                title={<Translation id="TR_DRY_RUN_CHECK_ITEM_TITLE" />}
                                description={<Translation id="TR_DRY_RUN_CHECK_ITEM_DESCRIPTION" />}
                                isChecked={understood}
                                link={learnMoreUrl && <LearnMoreButton url={learnMoreUrl} />}
                                onClick={() => setUnderstood(!understood)}
                            />
                        </Card>
                    </>
                );
            }
            case 'select-word-count':
                return (
                    <>
                        <H3 margin={{ bottom: spacings.md }}>
                            <Translation id="TR_SELECT_NUMBER_OF_WORDS" />
                        </H3>
                        <SelectWordCount onSelect={onSetWordsCount} />
                    </>
                );
            case 'select-recovery-type':
                return (
                    <>
                        <H3 margin={{ bottom: spacings.md }}>
                            <Translation id="TR_CHOOSE_RECOVERY_TYPE" />
                        </H3>
                        <SelectRecoveryType onSelect={onSetRecoveryType} />
                    </>
                );
            case 'in-progress':
            case 'waiting-for-confirmation':
                if (modal.context !== MODAL.CONTEXT_DEVICE) {
                    return <Loading />;
                }

                // Do not rely on Capability_PassphraseEntry feature. For ancient firmwares it's not there,
                // and we want to allow devices that have unsupported FW to be able to check the seed.
                if (device.features.internal_model === DeviceModelInternal.T1B1) {
                    return <T1B1InputStep />;
                }

                return <EnterOnDeviceStep />;

            case 'finished':
                return !hasError ? (
                    <>
                        <H2 data-testid="@recovery/success-title">
                            <Translation id="TR_SEED_CHECK_SUCCESS_TITLE" />
                        </H2>
                        <Paragraph
                            typographyStyle="hint"
                            variant="tertiary"
                            margin={{ top: spacings.xs }}
                        >
                            <Translation id="TR_SEED_CHECK_SUCCESS_DESC" />
                        </Paragraph>
                    </>
                ) : (
                    <>
                        <H2>
                            <Translation id="TR_SEED_CHECK_FAIL_TITLE" />
                        </H2>
                        <Paragraph
                            typographyStyle="hint"
                            variant="tertiary"
                            margin={{ top: spacings.xs }}
                        >
                            <Translation
                                id="TR_RECOVERY_ERROR"
                                values={{ error: recovery.error }}
                            />
                        </Paragraph>
                    </>
                );
        }
    };

    return (
        <NewModal
            heading={<Translation id="TR_CHECK_RECOVERY_SEED" />}
            description={
                <Translation
                    id="TR_STEP_OF_TOTAL"
                    values={{
                        index: statesInProgressBar.indexOf(recovery.status) + 1,
                        total: statesInProgressBar.length,
                    }}
                />
            }
            bottomContent={
                <>
                    {recovery.status === 'initial' && (
                        <NewModal.Button
                            onClick={() =>
                                deviceModelInternal === DeviceModelInternal.T1B1
                                    ? dispatch(setStatus('select-word-count'))
                                    : dispatch(checkSeed())
                            }
                            isDisabled={!understood || isLocked()}
                            data-testid="@recovery/start-button"
                        >
                            <Translation id="TR_START" />
                        </NewModal.Button>
                    )}
                    <NewModal.Button
                        variant={hasFinished ? undefined : 'tertiary'}
                        onClick={handleClose}
                    >
                        <Translation id="TR_CLOSE" />
                    </NewModal.Button>
                </>
            }
            onCancel={handleClose}
            variant={hasFinished && hasError ? 'warning' : 'primary'}
            // eslint-disable-next-line no-nested-ternary
            iconName={hasFinished ? (hasError ? 'warning' : 'check') : undefined}
        >
            {getStep()}
        </NewModal>
    );
};
