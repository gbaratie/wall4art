export const UserRole = {
  PARTICULIER: 'PARTICULIER',
  MAIRE: 'MAIRE',
  ARTISTE: 'ARTISTE',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const LocationKind = {
  PRIVATE: 'PRIVATE',
  PUBLIC: 'PUBLIC',
} as const;

export type LocationKind = (typeof LocationKind)[keyof typeof LocationKind];

export const MayorValidationStatus = {
  NOT_REQUIRED: 'NOT_REQUIRED',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;

export type MayorValidationStatus =
  (typeof MayorValidationStatus)[keyof typeof MayorValidationStatus];

export const LocationStatus = {
  DRAFT: 'DRAFT',
  PENDING_VALIDATION: 'PENDING_VALIDATION',
  OPEN: 'OPEN',
  MATCHED: 'MATCHED',
  CLOSED: 'CLOSED',
} as const;

export type LocationStatus = (typeof LocationStatus)[keyof typeof LocationStatus];

export const ProposalStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN',
} as const;

export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];
