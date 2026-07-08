import { apiFetch } from './api';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  roles: string[];
  profile: {
    bio: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    searchRadiusKm: number;
    portfolioLinks: Record<string, string> | null;
  } | null;
};

export type Location = {
  id: string;
  hostId: string;
  title: string;
  description: string;
  expectedOutcome: string;
  kind: string;
  requiresMayorValidation: boolean;
  mayorValidationStatus: string;
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  photoUrl: string;
  status: string;
  createdAt: string;
  host?: { id: string; name: string };
  distanceKm?: number;
  _count?: { proposals: number };
  proposals?: Array<{
    id: string;
    title: string;
    status: string;
    artist: { id: string; name: string };
    createdAt: string;
  }>;
};

export type Proposal = {
  id: string;
  artistId: string;
  locationId: string;
  title: string;
  description: string;
  commitments: string;
  estimatedDurationDays: number;
  sketchUrl: string | null;
  fundingRequested: boolean;
  fundingAmount: number | null;
  fundingDescription: string | null;
  status: string;
  createdAt: string;
  artist?: { id: string; name: string };
  location?: { id: string; title: string; city: string; hostId: string; status: string };
};

export type Conversation = {
  id: string;
  locationId: string;
  hostId: string;
  artistId: string;
  location: { id: string; title: string; city?: string };
  host: { id: string; name: string };
  artist: { id: string; name: string };
  messages?: Array<{ id: string; content: string; createdAt: string }>;
};

export type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
};

export const api = {
  me: () => apiFetch<UserProfile>('/api/v1/me'),
  register: (data: unknown) =>
    apiFetch<UserProfile>('/api/v1/register', { method: 'POST', body: JSON.stringify(data) }),
  updateProfile: (data: unknown) =>
    apiFetch<UserProfile>('/api/v1/me', { method: 'PATCH', body: JSON.stringify(data) }),
  getLocations: (params?: Record<string, string | number | boolean>) => {
    const query = params
      ? `?${new URLSearchParams(
          Object.entries(params).map(([k, v]) => [k, String(v)]),
        ).toString()}`
      : '';
    return apiFetch<Location[]>(`/api/v1/locations${query}`);
  },
  getLocation: (id: string) => apiFetch<Location>(`/api/v1/locations/${id}`),
  createLocation: (data: unknown) =>
    apiFetch<Location>('/api/v1/locations', { method: 'POST', body: JSON.stringify(data) }),
  getPendingMayorLocations: () => apiFetch<Location[]>('/api/v1/mayor/locations/pending'),
  approveLocation: (id: string, comment?: string) =>
    apiFetch(`/api/v1/mayor/locations/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),
  rejectLocation: (id: string, comment?: string) =>
    apiFetch(`/api/v1/mayor/locations/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),
  createProposal: (locationId: string, data: unknown) =>
    apiFetch<Proposal>(`/api/v1/locations/${locationId}/proposals`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMyProposals: () => apiFetch<Proposal[]>('/api/v1/proposals/mine'),
  getLocationProposals: (locationId: string) =>
    apiFetch<Proposal[]>(`/api/v1/locations/${locationId}/proposals`),
  updateProposalStatus: (id: string, status: string) =>
    apiFetch<Proposal>(`/api/v1/proposals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  getConversations: () => apiFetch<Conversation[]>('/api/v1/conversations'),
  getMessages: (conversationId: string) =>
    apiFetch<Message[]>(`/api/v1/conversations/${conversationId}/messages`),
  sendMessage: (conversationId: string, content: string) =>
    apiFetch<Message>(`/api/v1/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  uploadImage: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiFetch<{ url: string }>('/api/v1/uploads/image', { method: 'POST', body: form });
  },
};
