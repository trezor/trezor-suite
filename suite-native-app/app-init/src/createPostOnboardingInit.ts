import { type PostOnboardingInit } from '@suite-native/services';
import { type NativeReduxStore } from '@suite-native-app/state';

import { postOnboardingInitThunk } from './appInitThunks';

type PostOnboardingInitDeps = Pick<NativeReduxStore, 'dispatch'>;

export const createPostOnboardingInit =
    (deps: PostOnboardingInitDeps): PostOnboardingInit =>
    () => {
        void deps.dispatch(postOnboardingInitThunk());
    };
