import type { LocationKind, LocationStatus, MayorValidationStatus } from '@prisma/client';
import { LocationStatus as LS, MayorValidationStatus as MVS } from '@prisma/client';

export function resolveLocationStatus(input: {
  publish: boolean;
  kind: LocationKind;
  requiresMayorValidation: boolean;
}): { status: LocationStatus; mayorValidationStatus: MayorValidationStatus } {
  if (!input.publish) {
    return { status: LS.DRAFT, mayorValidationStatus: MVS.NOT_REQUIRED };
  }

  if (input.kind === 'PUBLIC' && input.requiresMayorValidation) {
    return { status: LS.PENDING_VALIDATION, mayorValidationStatus: MVS.PENDING };
  }

  return {
    status: LS.OPEN,
    mayorValidationStatus:
      input.kind === 'PUBLIC' ? MVS.NOT_REQUIRED : MVS.NOT_REQUIRED,
  };
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
