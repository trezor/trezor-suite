import { act } from '@suite-native/test-utils-store';

// Flush pending react-hook-form async validation microtasks inside act()
// before RTL's auto-cleanup unmounts the tree. Without this, RHF's queued
// setState calls land on unmounted components and produce "not wrapped in
// act" warnings — each one triggers an expensive fiber-stack walk in DEV.
afterEach(async () => {
    await act(async () => {});
});
