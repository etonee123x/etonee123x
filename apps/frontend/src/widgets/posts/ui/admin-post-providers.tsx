'use client';

import { DeletePostProvider, DialogDeletePost } from '@/features/post/delete';
import { EditPostProvider } from '@/features/post/editor';
import type { PropsWithChildren } from 'react';

/** Load edit/delete providers and dialog only for admin post rendering. */
export const AdminPostProviders = ({ children }: PropsWithChildren) => {
  return (
    <DeletePostProvider>
      <EditPostProvider>{children}</EditPostProvider>
      <DialogDeletePost />
    </DeletePostProvider>
  );
};
