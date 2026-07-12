import { z } from 'zod';
import {
  LocationKind,
  LocationStatus,
  MayorValidationStatus,
  ProposalStatus,
  UserRole,
} from './enums.js';

export const portfolioLinksSchema = z.object({
  instagram: z.string().url().optional(),
  behance: z.string().url().optional(),
  website: z.string().url().optional(),
  other: z.string().url().optional(),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(100),
  roles: z
    .array(z.enum([UserRole.PARTICULIER, UserRole.MAIRE, UserRole.ARTISTE]))
    .min(1),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(2000).optional(),
  city: z.string().min(2).max(100).optional(),
  searchRadiusKm: z.number().min(1).max(500).optional(),
  portfolioLinks: portfolioLinksSchema.optional(),
});

export const createLocationSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  expectedOutcome: z.string().min(10).max(5000),
  kind: z.enum([LocationKind.PRIVATE, LocationKind.PUBLIC]),
  requiresMayorValidation: z.boolean().default(false),
  address: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  postalCode: z.string().min(3).max(20),
  photoUrl: z.union([z.string().url(), z.string().startsWith('data:image/')]),
  publish: z.boolean().default(false),
});

export const updateLocationSchema = createLocationSchema.partial();

export const addressSearchSchema = z.object({
  q: z.string().min(1).max(200),
  limit: z.coerce.number().min(1).max(10).default(5),
});

export const locationSearchSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  city: z.string().min(2).max(100).optional(),
  radiusKm: z.coerce.number().min(1).max(500).optional(),
  status: z.enum([LocationStatus.OPEN]).optional(),
  kind: z.enum([LocationKind.PRIVATE, LocationKind.PUBLIC]).optional(),
  mine: z.coerce.boolean().optional(),
});

export const mayorDecisionSchema = z.object({
  comment: z.string().max(1000).optional(),
});

export const createProposalSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  commitments: z.string().min(10).max(3000),
  estimatedDurationDays: z.number().int().min(1).max(365),
  sketchUrl: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url().optional(),
  ),
  fundingRequested: z.boolean().default(false),
  fundingAmount: z.preprocess(
    (value) => (value === 0 || value === '' || value == null ? undefined : value),
    z.number().positive().optional(),
  ),
  fundingDescription: z.string().max(2000).optional(),
  submit: z.boolean().default(true),
});

export const updateProposalStatusSchema = z.object({
  status: z.enum([
    ProposalStatus.UNDER_REVIEW,
    ProposalStatus.ACCEPTED,
    ProposalStatus.REJECTED,
    ProposalStatus.WITHDRAWN,
  ]),
});

export const createMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const createConversationSchema = z.object({
  locationId: z.string().uuid(),
  artistId: z.string().uuid().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type AddressSearchInput = z.infer<typeof addressSearchSchema>;
export type LocationSearchInput = z.infer<typeof locationSearchSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
