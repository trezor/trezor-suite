import { SettingsAnchor } from '@suite/router';

import { resetProtocol } from 'src/actions/suite/protocolActions';
import type { NotificationRendererProps } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

import { goto } from '../../../../actions/suite/routerActions';

export const AutoEjectRenderer = ({ render: View, notification }: NotificationRendererProps) => {
    const dispatch = useDispatch();

    const onCancel = () => dispatch(resetProtocol);

    const handleActionClick = () => {
        dispatch(goto('settings-index', { anchor: SettingsAnchor.AutoEject }));
    };

    return (
        <View
            message="TOAST_AUTO_EJECT_SETTINGS"
            action={{
                onClick: handleActionClick,
                label: 'TR_SETTINGS',
                position: 'right',
                intent: 'neutral',
            }}
            onCancel={onCancel}
            notification={notification}
            messageValues={undefined}
            variant="transparent"
        />
    );
};
