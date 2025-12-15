import { BaseStoreProvider, type BaseStoreProviderProps } from './BaseStoreProvider';

type StoreProviderProps = Omit<BaseStoreProviderProps, 'preloadedState'>;

export const StoreProvider = ({ children }: StoreProviderProps) => (
    <BaseStoreProvider>{children}</BaseStoreProvider>
);
