import { Translation } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';
import { Banner } from '@trezor/components';

export const UpdateBridge = () => {
    const dispatch = useDispatch();

    return (
        <Banner
            icon
            variant="info"
            rightContent={
                <Banner.Button
                    onClick={() => dispatch(goto('suite-bridge'))}
                    data-testid="@notification/update-bridge/button"
                >
                    <Translation id="TR_SHOW_DETAILS" />
                </Banner.Button>
            }
        >
            <Translation id="TR_NEW_TREZOR_BRIDGE_IS_AVAILABLE" />
        </Banner>
    );
};
