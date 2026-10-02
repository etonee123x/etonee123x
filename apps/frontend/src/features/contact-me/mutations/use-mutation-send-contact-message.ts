import { useMutation, type UseMutationOptions } from '@tanstack/react-query';
import { sendContactMessage } from '../api/send-contact-message';

/**
 * Exposes contact delivery through TanStack mutation state and options.
 */
export const useMutationSendContactMessage = (
  options: Omit<
    UseMutationOptions<Awaited<ReturnType<typeof sendContactMessage>>, Error, Parameters<typeof sendContactMessage>[0]>,
    'mutationFn'
  >,
) => {
  return useMutation({
    ...options,
    mutationFn: sendContactMessage,
  });
};
