import React from 'react';
import { Button, Link } from '@trezor/components';
import { FormattedMessage } from 'react-intl';

import { State } from '@suite-types/index';
// import { goToSubStep, goToNextStep } from '@suite/actions/onboarding/onboardingActions';
import * as onboardingActions from '@suite/actions/onboarding/onboardingActions';
import { SUPPORT_URL } from '@suite/constants/onboarding/urls';
import * as STEP from '@suite/constants/onboarding/steps';
import { ControlsWrapper } from '@suite/components/onboarding/Wrapper';
import Text from '@suite/components/onboarding/Text';
import l10nCommonMessages from '@suite-support/Messages';
import l10nMessages from './TroubleshootInitialized.messages';

interface Props {
    device: State['onboarding']['connect']['device'];
    activeSubStep: State['onboarding']['activeSubStep'];
    // onboardingActions: {
    //     goToSubStep: typeof goToSubStep;
    //     goToNextStep: typeof goToNextStep;
    // };
    onboardingActions: typeof onboardingActions;
}

const TroubleshootInitialized: React.FC = (props: Props) => {
    const { device, activeSubStep, onboardingActions } = props;

    return (
        <React.Fragment>
            {activeSubStep === null && (
                <React.Fragment>
                    {/* <H4>
                            <FormattedMessage {...l10nMessages.TR_DEVICE_IS_INITIALIZED} />
                        </H4> */}
                    <Text>
                        {device.features.label && (
                            <FormattedMessage
                                {...l10nMessages.TR_DEVICE_LABEL}
                                values={{ label: device.features.label }}
                            />
                        )}{' '}
                        <FormattedMessage
                            {...l10nMessages.TR_DEVICE_FIRMWARE_VERSION}
                            values={{
                                firmware: `${device.features.major_version}.${device.features.minor_version}.${device.features.patch_version}`,
                            }}
                        />
                    </Text>
                    <ControlsWrapper>
                        <Button
                            onClick={() => onboardingActions.goToSubStep('user-worked-before')}
                            isWhite
                        >
                            <FormattedMessage
                                {...l10nMessages.TR_USER_HAS_WORKED_WITH_THIS_DEVICE}
                            />
                        </Button>
                        <Button
                            onClick={() => onboardingActions.goToSubStep('is-brand-new')}
                            isWhite
                        >
                            <FormattedMessage
                                {...l10nMessages.TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE}
                            />
                        </Button>
                    </ControlsWrapper>
                </React.Fragment>
            )}

            {activeSubStep === 'user-worked-before' && (
                <React.Fragment>
                    {/* <H4>
                            <FormattedMessage
                                {...l10nMessages.TR_USER_HAS_WORKED_WITH_THIS_DEVICE}
                            />
                        </H4> */}
                    <Text>
                        <FormattedMessage {...l10nMessages.TR_INSTRUCTION_TO_SKIP} />
                    </Text>

                    <ControlsWrapper>
                        <Button
                            onClick={() => onboardingActions.goToSubStep(null)}
                            isWhite
                            isInverse
                        >
                            <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                        </Button>
                        <Button
                            onClick={() => onboardingActions.goToNextStep(STEP.ID_FINAL_STEP)}
                            isInverse
                        >
                            <FormattedMessage {...l10nCommonMessages.TR_SKIP_ALL} />
                        </Button>
                    </ControlsWrapper>
                </React.Fragment>
            )}

            {activeSubStep === 'is-brand-new' && (
                <React.Fragment>
                    {/* <H4>
                        <FormattedMessage
                            {...l10nMessages.TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE}
                        />
                    </H4> */}
                    <Text>
                        <FormattedMessage
                            {...l10nMessages.TR_USER_HAS_NOT_WORKED_WITH_THIS_DEVICE_INSTRUCTIONS}
                        />
                    </Text>
                    <ControlsWrapper>
                        <Button onClick={() => onboardingActions.goToSubStep(null)} isWhite>
                            <FormattedMessage {...l10nCommonMessages.TR_BACK} />
                        </Button>
                        <Link href={SUPPORT_URL}>
                            <Button style={{ width: '100%' }}>
                                <FormattedMessage {...l10nCommonMessages.TR_CONTACT_SUPPORT} />
                            </Button>
                        </Link>
                    </ControlsWrapper>
                </React.Fragment>
            )}
        </React.Fragment>
    );
};

export default TroubleshootInitialized;
