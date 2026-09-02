import { type Getter } from '@suite-common/dependency-injection';

export type GetIsWindowVisibleDep = {
    getIsWindowVisible: Getter<[], boolean>;
};
