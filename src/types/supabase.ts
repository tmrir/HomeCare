import { Database } from '@/integrations/supabase/database.types';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

// Define the status type for service requests
export type ServiceRequestStatus = 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';

// Define the service request type
export interface ServiceRequest extends Tables<'service_requests'> {
  status: ServiceRequestStatus;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
}

// Define the user profile type
export interface UserProfile extends Tables<'profiles'> {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'technician' | 'user';
  created_at: string;
  updated_at: string;
}

// Define the authentication state type
export interface AuthState {
  user: {
    id: string;
    email: string;
    role: 'admin' | 'technician' | 'user';
  } | null;
  loading: boolean;
  error: string | null;
}
