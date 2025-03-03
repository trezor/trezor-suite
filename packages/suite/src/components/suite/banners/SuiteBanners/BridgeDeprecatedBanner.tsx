import { Banner } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite';

export const BridgeDeprecated = () => {
    const dispatch = useDispatch();

    return (
        <Banner
            icon
            variant="info"
            rightContent={
                <Banner.Button
                    onClick={() => dispatch(goto('suite-bridge-deprecated'))}
                    data-testid="@notification/bridge-deprecated/button"
                >
                    <Translation id="TR_LEARN_MORE" />
                </Banner.Button>
            }
        >
            <Translation id="TR_YOUR_BRIDGE_VERSION_WILL_SOON_BE_DEPRECATED" />
        </Banner>
    );
};
