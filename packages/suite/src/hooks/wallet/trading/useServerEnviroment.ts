import { invityAPI } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

export const useServerEnvironment = () => {
    const invityServerEnvironment = useSelector(
        state => state.suiteSettings.debug.invityServerEnvironment,
    );

    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
    }
};
