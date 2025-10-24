import { useNavigationState } from '@react-navigation/native';

export const useLastRouteName = () => useNavigationState(state => state.routes.at(-1)?.name);
