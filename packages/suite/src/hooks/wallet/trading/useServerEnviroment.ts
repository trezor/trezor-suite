import { selectInvityServerEnvironment } from '@suite/settings';
import { invityAPI } from '@suite-common/trading';

import { useSelector } from 'src/hooks/suite';

export const useServerEnvironment = () => {
    const invityServerEnvironment = useSelector(selectInvityServerEnvironment);

    if (invityServerEnvironment) {
        invityAPI.setInvityServersEnvironment(invityServerEnvironment);
    }
};
