import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Link } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import l10nCommonMessages from '@suite-support/Messages';
import { SUPPORT_URL } from '@onboarding-constants/urls';
import * as STEP from '@onboarding-constants/steps';
import { ControlsWrapper } from '@onboarding-components/Wrapper';
import Text from '@onboarding-components/Text';
import { ButtonCta, ButtonAlt } from '@onboarding-components/Buttons';
import l10nMessages from './TroubleshootInitialized.messages';
import { Dispatch, AppState } from '@suite-types';

interface Props {
    device: AppState['onboarding']['connect']['device'];
    activeSubStep: AppState['onboarding']['activeSubStep'];
    onboardingActions: {
        goToSubStep: typeof onboardingActions.goToSubStep;
        goToNextStep: typeof onboardingActions.goToNextStep;
    };
}

const TroubleshootInitialized = (props: Props) => {
    const { device, activeSubStep, onboardingActions } = props;

    return (
        <React.Fragment>
            {activeSubStep === null && (
                <React.Fragment>
                    <Text>
                        <FormattedMessage
                                {...l10nMessages.TR_DEVICE_LABEL}
                                values={{ label: device.label }}
                            />
                        {' '}
                        <FormattedMessage
                            {...l10nMessages.TR_DEVICE_FIRMWARE_VERSION}
                            values={{
                                firmware: `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`,
                            }}
                        />
                    </Text>
                    <ControlsWrapper>
                        <ButtonAlt
                            onClick={() => onboardingActions.goToSubStep('user-worked-before')}
                        >
                            <FormattedMessage
                                {...l10nMessages.TR_USER_HAS_WORKED_WITH_THIS_DEVICE}
                            />
                        </ButtonAlt>
                        <ButtonAlt onClick={() => onboardingActions.goToSubStep('is-brand-new')}>
                            <FormattedMessage
                                {...l10nMessages.TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE}
                            />
                        </ButtonAlt>
                    </ControlsWrapper>
                </React.Fragment>
            )}

            {activeSubStep === 'user-worked-before' && (
                <React.Fragment>
                    <Text>
                        <FormattedMessage {...l10nMessages.TR_INSTRUCTION_TO_SKIP} />
                    </Text>

                    <ControlsWrapper>
                        <ButtonAlt onClick={() => onboardingActions.goToSubStep(null)}>
                            <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                        </ButtonAlt>
                        <ButtonCta
                            onClick={() => onboardingActions.goToNextStep(STEP.ID_FINAL_STEP)}
                        >
                            <FormattedMessage {...l10nCommonMessages.TR_SKIP_ALL} />
                        </ButtonCta>
                    </ControlsWrapper>
                </React.Fragment>
            )}

            {activeSubStep === 'is-brand-new' && (
                <React.Fragment>
                    <Text>
                        <FormattedMessage
                            {...l10nMessages.TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS}
                        />
                    </Text>
                    <ControlsWrapper>
                        <ButtonAlt onClick={() => onboardingActions.goToSubStep(null)}>
                            <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                        </ButtonAlt>
                        <Link href={SUPPORT_URL}>
                            <ButtonCta style={{ width: '100%' }}>
                                <FormattedMessage {...l10nCommonMessages.TR_CONTACT_SUPPORT} />
                            </ButtonCta>
                        </Link>
                    </ControlsWrapper>
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

const mapStateToProps = (state: AppState) => ({
    activeSubStep: state.onboarding.activeSubStep,
    device: state.onboarding.connect.device,
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    onboardingActions: {
        goToNextStep: bindActionCreators(onboardingActions.goToNextStep, dispatch),
        goToSubStep: bindActionCreators(onboardingActions.goToSubStep, dispatch),
    },
});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(TroubleshootInitialized);
