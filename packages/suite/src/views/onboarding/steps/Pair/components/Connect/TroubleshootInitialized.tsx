import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import l10nCommonMessages from '@suite-support/Messages';
import { SUPPORT_URL } from '@onboarding-constants/urls';
import * as STEP from '@onboarding-constants/steps';
import { Wrapper, Text, OnboardingButton } from '@onboarding-components';
import l10nMessages from './TroubleshootInitialized.messages';
import { Dispatch, AppState, AcquiredDevice } from '@suite-types';

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
                        <FormattedMessage
                            {...l10nMessages.TR_DEVICE_LABEL}
                            values={{ label: device.label }}
                        />{' '}
                        <FormattedMessage
                            {...l10nMessages.TR_DEVICE_FIRMWARE_VERSION}
                            values={{
                                firmware: `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`,
                            }}
                        />
                    </Text>
                    <Wrapper.Controls>
                        <OnboardingButton.Alt
                            onClick={() => onboardingActions.goToSubStep('user-worked-before')}
                        >
                            <FormattedMessage
                                {...l10nMessages.TR_USER_HAS_WORKED_WITH_THIS_DEVICE}
                            />
                        </OnboardingButton.Alt>
                        <OnboardingButton.Alt
                            onClick={() => onboardingActions.goToSubStep('is-brand-new')}
                        >
                            <FormattedMessage
                                {...l10nMessages.TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE}
                            />
                        </OnboardingButton.Alt>
                    </Wrapper.Controls>
                </>
            )}

            {activeSubStep === 'user-worked-before' && (
                <>
                    <Text>
                        <FormattedMessage {...l10nMessages.TR_INSTRUCTION_TO_SKIP} />
                    </Text>

                    <Wrapper.Controls>
                        <OnboardingButton.Alt onClick={() => onboardingActions.goToSubStep(null)}>
                            <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                        </OnboardingButton.Alt>
                        <OnboardingButton.Cta
                            onClick={() => onboardingActions.goToNextStep(STEP.ID_FINAL_STEP)}
                        >
                            <FormattedMessage {...l10nCommonMessages.TR_SKIP_ALL} />
                        </OnboardingButton.Cta>
                    </Wrapper.Controls>
                </>
            )}

            {activeSubStep === 'is-brand-new' && (
                <>
                    <Text>
                        <FormattedMessage
                            {...l10nMessages.TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS}
                        />
                    </Text>
                    <Wrapper.Controls>
                        <OnboardingButton.Alt onClick={() => onboardingActions.goToSubStep(null)}>
                            <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                        </OnboardingButton.Alt>
                        <Link href={SUPPORT_URL} variant="nostyle">
                            <OnboardingButton.Cta style={{ width: '100%' }}>
                                <FormattedMessage {...l10nCommonMessages.TR_CONTACT_SUPPORT} />
                            </OnboardingButton.Cta>
                        </Link>
                    </Wrapper.Controls>
                </>
            )}
        </>
    );
};

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TroubleshootInitialized);
