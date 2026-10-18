import { cookies } from 'next/headers';

/** Forward only the session cookie; Express verifies its signature before allowing a mutation. */
export const getAuthHeaders = async () => {
  const cookieStore = await cookies();
  const jwt = cookieStore.get('jwt')?.value;

  if (!jwt) {
    throw new Error('Unauthorized');
  }

  return { Cookie: `jwt=${encodeURIComponent(jwt)}` };
};
