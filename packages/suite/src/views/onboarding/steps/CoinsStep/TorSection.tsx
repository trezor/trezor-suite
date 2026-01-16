import { Translation } from '@suite/intl';
import { Paragraph, Row, Switch } from '@trezor/components';

import { toggleTor } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectModalType } from 'src/reducers/suite/modalReducer';
import { TorStatus } from 'src/types/suite';
import { getIsTorEnabled, getIsTorLoading } from 'src/utils/suite/tor';

type TorSectionProps = {
    torStatus: TorStatus;
};

export const TorSection = ({ torStatus }: TorSectionProps) => {
    const modalType = useSelector(selectModalType);
    const dispatch = useDispatch();

    const isTorEnabled = getIsTorEnabled(torStatus);
    const isTorLoading = getIsTorLoading(torStatus);
    const isChecked = isTorEnabled || torStatus === TorStatus.Enabling;

    const handleChange = () => dispatch(toggleTor(!isTorEnabled, modalType));

    return (
        <Row justifyContent="space-between" gap={48}>
            <Paragraph variant="tertiary" typographyStyle="hint">
                <Translation id="TR_TOR_DESCRIPTION" />
            </Paragraph>
            <Switch
                data-testid="@onboarding/tor-switch"
                isChecked={isChecked}
                isDisabled={isTorLoading}
                onChange={handleChange}
            />
        </Row>
    );
};
