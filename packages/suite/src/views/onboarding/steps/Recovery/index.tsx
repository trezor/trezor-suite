import styled from 'styled-components';

import { pickByDeviceModel } from '@trezor/device-utils';
import { DeviceModelInternal } from '@trezor/connect';
import { selectDevice } from '@suite-common/wallet-core';

import { OnboardingButtonCta } from 'src/components/onboarding';
import { SelectWordCount, SelectRecoveryType, SelectRecoveryWord } from 'src/components/recovery';
import { Translation } from 'src/components/suite';
import { goToNextStep, updateAnalytics } from 'src/actions/onboarding/onboardingActions';
import { useDispatch, useRecovery, useSelector } from 'src/hooks/suite';
import { selectIsActionAbortable } from 'src/reducers/suite/suiteReducer';

import RecoveryStepBox from './RecoveryStepBox';

const InProgressRecoveryStepBox = styled(RecoveryStepBox)<{
    $deviceModelInternal: DeviceModelInternal;
}>`
    ${({ $deviceModelInternal }) =>
        $deviceModelInternal === DeviceModelInternal.T1B1 ? 'min-height: 475px' : ''};
`;

export const RecoveryStep = () => {
    const isActionAbortable = useSelector(selectIsActionAbortable);
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    const {
        status,
        error,
        wordRequestInputType,
        setWordsCount,
        setAdvancedRecovery,
        recoverDevice,
        setStatus,
        resetReducer,
    } = useRecovery();

    if (!device || !device.features) {
        return null;
    }

    const deviceModelInternal = device.features.internal_model;

    if (status === 'initial') {
        // 1. step where users chooses number of words in case of T1B1
        // In case of T2T1 and T2B1 show CTA button to start the process
        if (deviceModelInternal === DeviceModelInternal.T1B1) {
            // T1B1
            return (
                <RecoveryStepBox
                    key={status} // to properly rerender in translation mode
                    heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                    description={<Translation id="TR_RECOVER_SUBHEADING_COMPUTER" />}
                >
                    <SelectWordCount
                        onSelect={number => {
                            setWordsCount(number);
                            setStatus('select-recovery-type');
                        }}
                    />
                </RecoveryStepBox>
            );
        }

        // T2T1 and T2B1
        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                description={
                    <Translation
                        id={pickByDeviceModel(deviceModelInternal, {
                            default: 'TR_RECOVER_SUBHEADING_TOUCH',
                            [DeviceModelInternal.T2T1]: 'TR_RECOVER_SUBHEADING_TOUCH',
                            [DeviceModelInternal.T2B1]: 'TR_RECOVER_SUBHEADING_BUTTONS',
                        })}
                    />
                }
                innerActions={
                    <OnboardingButtonCta
                        data-test-id="@onboarding/recovery/start-button"
                        onClick={recoverDevice}
                    >
                        <Translation id="TR_START_RECOVERY" />
                    </OnboardingButtonCta>
                }
            />
        );
    }

    if (status === 'select-recovery-type') {
        // 2. step: Standard recovery (user enters recovery seed word by word on host) or Advanced recovery (user types words on a device)
        const handleSelect = (type: 'standard' | 'advanced') => {
            setAdvancedRecovery(type === 'advanced');
            dispatch(updateAnalytics({ recoveryType: type }));
            recoverDevice();
        };

        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_SELECT_RECOVERY_METHOD" />}
                description={<Translation id="TR_RECOVERY_TYPES_DESCRIPTION" />}
            >
                <SelectRecoveryType onSelect={handleSelect} />
            </RecoveryStepBox>
        );
    }

    if (status === 'waiting-for-confirmation') {
        // On T1B1 we show confirm bubble only while we wait for confirmation that users wants to start the process
        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                description={pickByDeviceModel(deviceModelInternal, {
                    default: undefined,
                    [DeviceModelInternal.T2T1]: <Translation id="TR_RECOVER_SUBHEADING_TOUCH" />,
                    [DeviceModelInternal.T2B1]: <Translation id="TR_RECOVER_SUBHEADING_BUTTONS" />,
                })}
                device={device}
                isActionAbortable={isActionAbortable}
            />
        );
    }

    if (status === 'in-progress') {
        const getModel1Description = () => {
            if (wordRequestInputType === 'plain') {
                return (
                    <>
                        <Translation id="TR_ENTER_SEED_WORDS_INSTRUCTION" />{' '}
                        <Translation id="TR_RANDOM_SEED_WORDS_DISCLAIMER" />
                    </>
                );
            }

            if (wordRequestInputType === 6 || wordRequestInputType === 9) {
                return <Translation id="TR_ADVANCED_RECOVERY_TEXT" />;
            }
        };

        return (
            <InProgressRecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_RECOVER_YOUR_WALLET_FROM" />}
                $deviceModelInternal={deviceModelInternal}
                device={device}
                description={pickByDeviceModel(deviceModelInternal, {
                    default: undefined,
                    [DeviceModelInternal.T1B1]: getModel1Description(),
                    [DeviceModelInternal.T2T1]: <Translation id="TR_RECOVER_SUBHEADING_TOUCH" />,
                    [DeviceModelInternal.T2B1]: <Translation id="TR_RECOVER_SUBHEADING_BUTTONS" />,
                })}
                isActionAbortable
            >
                <SelectRecoveryWord />
            </InProgressRecoveryStepBox>
        );
    }

    if (device && device.mode === 'normal') {
        // Ready to continue to the next step
        const handleClick = () => dispatch(goToNextStep('set-pin'));

        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_WALLET_RECOVERED_FROM_SEED" />}
                innerActions={
                    <OnboardingButtonCta
                        data-test-id="@onboarding/recovery/continue-button"
                        onClick={handleClick}
                    >
                        <Translation id="TR_CONTINUE" />
                    </OnboardingButtonCta>
                }
            />
        );
    }
    if (status === 'finished' && error) {
        // Recovery finished with error, user is recommended to wipe the device and start over
        return (
            <RecoveryStepBox
                key={status} // to properly rerender in translation mode
                heading={<Translation id="TR_RECOVERY_FAILED" />}
                description={<Translation id="TR_RECOVERY_ERROR" values={{ error }} />}
                innerActions={
                    <OnboardingButtonCta
                        data-test-id="@onboarding/recovery/retry-button"
                        onClick={
                            deviceModelInternal === DeviceModelInternal.T1B1
                                ? resetReducer
                                : recoverDevice
                        }
                    >
                        <Translation id="TR_RETRY" />
                    </OnboardingButtonCta>
                }
            />
        );
    }

    // We shouldn't get there, but to keep typescript sane let's return null
    return null;
};
