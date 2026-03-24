import type { UserContextPayload } from '@suite-common/suite-types';

export type TransactionReviewModalProps =
    | Extract<UserContextPayload, { type: 'review-transaction' }>
    | { type: 'sign-transaction'; decision?: undefined }
    | Extract<
          UserContextPayload,
          { type: 'review-transaction-rbf-previous-transaction-mined-error' }
      >;
