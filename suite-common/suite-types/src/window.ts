import { type Getter } from '@trezor/dependency-injection';

export type GetIsWindowVisibleDep = {
    getIsWindowVisible: Getter<[], boolean>;
};
