import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Warning } from '@trezor/components';

export const UpdateBridge = () => {
    const dispatch = useDispatch();

    return (
        <Warning
            icon
            variant="info"
            rightContent={
                <Warning.Button
                    onClick={() => dispatch(goto('suite-bridge'))}
                    data-testid="@notification/update-bridge/button"
                >
                    <Translation id="TR_SHOW_DETAILS" />
                </Warning.Button>
            }
        >
            <Translation id="TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE" />
        </Warning>
    );
};
