import { OnboardingButton, Text, Wrapper } from '@onboarding-components';
import * as STEP from '@onboarding-constants/steps';
import { SUPPORT_URL } from '@onboarding-constants/urls';
import { Translation } from '@suite-components/Translation';
import { AcquiredDevice, AppState, Dispatch } from '@suite-types';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import messages from '@suite/support/messages';
import { Link } from '@trezor/components-v2';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

const mapStateToProps = (state: AppState) => ({
    activeSubStep: state.onboarding.activeSubStep,
    device: state.suite.device as AcquiredDevice,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
        goToSubStep: bindActionCreators(onboardingActions.goToSubStep, dispatch),
    },
});

type Props = ReturnType<typeof mapStateToProps> & ReturnType<typeof mapDispatchToProps>;

const TroubleshootInitialized = (props: Props) => {
    const { device, activeSubStep, onboardingActions } = props;

    return (
        <>
            {activeSubStep === null && (
                <>
                    <Text>
                        <Translation
                            {...messages.TR_DEVICE_LABEL}
                            values={{ label: device.label }}
                        />{' '}
                        <Translation
                            {...messages.TR_DEVICE_FIRMWARE_VERSION}
                            values={{
                                firmware: `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`,
                            }}
                        />
                    </Text>
                    <Wrapper.Controls>
                        <OnboardingButton.Alt
                            onClick={() => onboardingActions.goToSubStep('user-worked-before')}
                        >
                            <Translation {...messages.TR_USER_HAS_WORKED_WITH_THIS_DEVICE} />
                        </OnboardingButton.Alt>
                        <OnboardingButton.Alt
                            onClick={() => onboardingActions.goToSubStep('is-brand-new')}
                        >
                            <Translation {...messages.TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE} />
                        </OnboardingButton.Alt>
                    </Wrapper.Controls>
                </>
            )}

            {activeSubStep === 'user-worked-before' && (
                <>
                    <Text>
                        <Translation {...messages.TR_INSTRUCTION_TO_SKIP} />
                    </Text>

                    <Wrapper.Controls>
                        <OnboardingButton.Alt onClick={() => onboardingActions.goToSubStep(null)}>
                            <Translation {...messages.TR_BACK} />
                        </OnboardingButton.Alt>
                        <OnboardingButton.Cta
                            onClick={() => onboardingActions.goToNextStep(STEP.ID_FINAL_STEP)}
                        >
                            <Translation {...messages.TR_SKIP_ALL} />
                        </OnboardingButton.Cta>
                    </Wrapper.Controls>
                </>
            )}

            {activeSubStep === 'is-brand-new' && (
                <>
                    <Text>
                        <Translation
                            {...messages.TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS}
                        />
                    </Text>
                    <Wrapper.Controls>
                        <OnboardingButton.Alt onClick={() => onboardingActions.goToSubStep(null)}>
                            <Translation {...messages.TR_BACK} />
                        </OnboardingButton.Alt>
                        <Link href={SUPPORT_URL}>
                            <OnboardingButton.Cta style={{ width: '100%' }}>
                                <Translation {...messages.TR_CONTACT_SUPPORT} />
                            </OnboardingButton.Cta>
                        </Link>
                    </Wrapper.Controls>
                </>
            )}
        </>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(TroubleshootInitialized);
