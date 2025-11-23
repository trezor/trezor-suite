import { Translation } from '@suite/intl';
import { Banner } from '@trezor/components';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch } from 'src/hooks/suite';

export const BridgeDeprecated = () => {
    const dispatch = useDispatch();

    return (
        <Banner
            icon
            intent="info"
            rightContent={
                <Banner.Button
                    onClick={e => {
                        e.stopPropagation();
                        dispatch(goto('suite-bridge-deprecated'));
                    }}
                    data-testid="@notification/bridge-deprecated/button"
                >
                    <Translation id="TR_LEARN_MORE" />
                </Banner.Button>
            }
            description={<Translation id="TR_STANDALONE_BRIDGE_DEPRECATED" />}
        />
    );
};
