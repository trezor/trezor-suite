import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { Column, H2 } from '@trezor/components';

import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { useSelector } from 'src/hooks/suite';

type TransactionReviewFollowDeviceProps = {
    isSigned: boolean;
};

export const TransactionReviewFollowDevice = ({ isSigned }: TransactionReviewFollowDeviceProps) => {
    const device = useSelector(selectSelectedDevice);

    return (
        <Column alignItems="center" gap={16} data-testid="@modal/review/follow-device">
            <DeviceConfirmImage device={device} />

            {!isSigned && (
                <H2 align="center" margin={{ left: 16, right: 16, bottom: 16 }}>
                    <Translation id="TR_CONFIRM_ACTION_ON_YOUR" />
                </H2>
            )}
        </Column>
    );
};
