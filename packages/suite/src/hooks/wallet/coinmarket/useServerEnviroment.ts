import { invityAPI } from '@suite-common/invity';

import { useSelector } from 'src/hooks/suite';

export const useServerEnvironment = () => {
    const invityServerEnvironment = useSelector(
        state => state.suite.settings.debug.invityServerEnvironment,
    );

    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
    }
};
