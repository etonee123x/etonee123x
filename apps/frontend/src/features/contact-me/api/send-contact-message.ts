import type { components } from '@/shared/api/openapi';
import { client } from '@/shared/api/client';

/**
 * Sends the contact form payload to the backend and rejects non-success responses.
 */
export const sendContactMessage = async (body: components['schemas']['ContactRequest']): Promise<void> => {
  const { response } = await client['/contact-me'].POST({ body });

  if (!response.ok) {
    // Preserve HTTP status so the form can explain rate-limit responses.
    throw Object.assign(new Error('Failed to send contact message'), { status: response.status });
  }
};
