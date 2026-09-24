import { useServices } from '@suite-common/dependency-injection';
import { firmwareActions, selectUseDevkit } from '@suite-common/firmware';
import { injectDispatch } from '@suite-common/redux-utils';
import { Switch } from '@trezor/components';
import { SectionItem } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

export const Devkit = () => {
    const { dispatch } = useServices(injectDispatch);
    const useDevkit = useSelector(selectUseDevkit);

    const onChangeRegularCheck = () => {
        dispatch(firmwareActions.toggleUseDevkit(!useDevkit));
    };

    return (
        <SectionItem
            data-testid="@settings/debug/firmware-devkit/switch"
            title="Devkit"
            description="Offer devkit versions of firmware binaries. Never install regular firmware on devkit and vice versa! Use this only if you know what you are doing."
            actions={<Switch onChange={onChangeRegularCheck} isChecked={useDevkit} />}
        />
    );
};
