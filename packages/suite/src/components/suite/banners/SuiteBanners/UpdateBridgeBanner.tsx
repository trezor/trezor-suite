import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Banner } from '../Banner';

export const UpdateBridge = () => {
    const dispatch = useDispatch();

    const action = {
        label: <Translation id="TR_SHOW_DETAILS" />,
        onClick: () => dispatch(goto('suite-bridge')),
        'data-test-id': '@notification/update-bridge/button',
    };

    return (
        <Banner
            variant="info"
            body={<Translation id="TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE" />}
            action={action}
        />
    );
};
