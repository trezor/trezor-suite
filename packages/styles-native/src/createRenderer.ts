import type { IRenderer } from 'fela';
// @ts-expect-error fela-native does not publish types; keep the public declaration local.
import { createRenderer as createFelaNativeRenderer } from 'fela-native';

export const createRenderer: () => IRenderer = createFelaNativeRenderer;
