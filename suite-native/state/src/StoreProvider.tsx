import type { BaseStoreProviderProps } from './BaseStoreProvider';
import { BaseStoreProvider } from './BaseStoreProvider';

type StoreProviderProps = Omit<BaseStoreProviderProps, 'preloadedState'>;

export const StoreProvider = ({ children }: StoreProviderProps) => (
    <BaseStoreProvider>{children}</BaseStoreProvider>
);
