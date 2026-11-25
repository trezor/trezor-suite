import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceId } from '@suite-common/device';
import { leaveReferralProgramThunk } from '@suite-common/refer-a-friend';
import { useAlert } from '@suite-native/alerts';
import { BannerInline } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { Link } from '@suite-native/link';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

type LeaveProgramLinkProps = {
    label: ReactNode;
};

export const LeaveProgramLink = ({ label }: LeaveProgramLinkProps) => {
    const { dispatch } = useServices(injectDispatch);
    const { showAlert } = useAlert();

    const deviceId = useSelector(selectDeviceId);

    const leaveProgram = () => {
        if (deviceId) {
            dispatch(leaveReferralProgramThunk({ deviceId }));
        }
    };

    const showLeaveProgramAlert = () => {
        showAlert({
            pictogramVariant: 'critical',
            title: <Translation id="referAFriend.leaveProgram.title" />,
            description: <Translation id="referAFriend.leaveProgram.description" />,
            appendix: (
                <BannerInline
                    title={<Translation id="referAFriend.leaveProgram.warning" />}
                    intent="critical"
                />
            ),
            primaryButtonTitle: <Translation id="referAFriend.buttons.leaveProgram" />,
            primaryButtonColorProps: { intent: 'critical' },
            onPressPrimaryButton: leaveProgram,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
        });
    };

    return (
        <Link
            onPress={showLeaveProgramAlert}
            label={label}
            textVariant="body-sm"
            textColor="contentPrimary"
            isUnderlined
        />
    );
};
