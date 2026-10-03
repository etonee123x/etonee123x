'use client';

import { useCallback, useRef, useState, type ComponentProps } from 'react';
import { useTranslations } from 'next-intl';
import { LoaderCircleIcon, SendHorizontalIcon } from 'lucide-react';
import { Button } from '@/shared/ui/ds/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/shared/ui/ds/field';
import { Input } from '@/shared/ui/ds/input';
import { Textarea } from '@/shared/ui/ds/textarea';
import { toast } from '@/shared/ui/ds/toast';
import { useMutationSendContactMessage } from '../mutations/use-mutation-send-contact-message';

/**
 * Sends a contact message and presents the submission state accessibly.
 */
export const ContactMeForm = () => {
  const t = useTranslations('ContactMePage');

  const textRef = useRef<HTMLTextAreaElement>(null);

  const [text, setText] = useState('');
  const [contact, setContact] = useState('');

  const [showTextError, setShowTextError] = useState(false);

  const isTextInvalid = showTextError && !text.trim();

  const {
    mutateAsync: sendContactMessage,
    isSuccess,
    isPending,
    reset,
  } = useMutationSendContactMessage({
    onError: (error) => {
      if ('status' in error && error.status === 429) {
        toast.add({
          title: t('messageLimitReached'),
          description: t('messageLimitDetails'),
          type: 'error',
        });
        return;
      }

      toast.add({ description: t('couldNotSendMessage'), type: 'error' });
    },
  });

  const handleSubmit = useCallback<NonNullable<ComponentProps<'form'>['onSubmit']>>(
    async (event) => {
      event.preventDefault();

      const formData = new FormData(event.currentTarget);
      const textValue = formData.get('text');
      const text = typeof textValue === 'string' ? textValue.trim() : '';

      if (!text) {
        setShowTextError(true);
        textRef.current?.focus();
        return;
      }

      setShowTextError(false);
      const contactValue = formData.get('contact');
      const contactTrimmed = typeof contactValue === 'string' ? contactValue.trim() : '';

      await sendContactMessage({
        text,
        ...(contactTrimmed ? { contact: contactTrimmed } : {}),
      });
    },
    [sendContactMessage, textRef, setShowTextError],
  );

  if (isSuccess) {
    const hasContact = Boolean(contact.trim());

    return (
      <div className="flex flex-col gap-3">
        <p role="status">{t(hasContact ? 'thanksIllReplySoon' : 'k')}</p>
        <video
          aria-hidden="true"
          autoPlay
          className="mx-auto w-[clamp(50%,calc(100%+32rem-100vw),100%)]"
          loop
          muted
          playsInline
          src={hasContact ? '/contact-me/w-contact.mp4' : '/contact-me/wo-contact.mp4'}
        />
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <FieldSet>
        <FieldLegend className="sr-only" variant="label">
          {t('contactMe')}
        </FieldLegend>
        <FieldGroup>
          <Field data-invalid={isTextInvalid}>
            <FieldLabel
              className="relative w-fit! after:absolute after:-top-0.5 after:-inset-e-2 after:content-['*'] after:text-red-500"
              htmlFor="contact-message"
            >
              {t('yourMessage')}
            </FieldLabel>
            <Textarea
              id="contact-message"
              className="min-h-48 resize-y leading-6"
              autoFocus
              maxLength={2000}
              name="text"
              placeholder={t('sampleText')}
              aria-invalid={isTextInvalid}
              ref={textRef}
              readOnly={isPending}
              required
              rows={7}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                reset();
              }}
            />
            <div className="flex items-baseline justify-between gap-4">
              {isTextInvalid && <FieldError>{t('messageIsRequired')}</FieldError>}
              <FieldDescription className="ms-auto">{text.length} / 2000</FieldDescription>
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="contact-reply-address">{t('whereCanIReply')}</FieldLabel>
            <Input
              id="contact-reply-address"
              maxLength={320}
              name="contact"
              placeholder={t('yourEmailOrAnotherContact')}
              readOnly={isPending}
              type="text"
              value={contact}
              onChange={(event) => {
                setContact(event.target.value);
                reset();
              }}
            />
            <FieldDescription className="text-end">{contact.length} / 320</FieldDescription>
          </Field>
          <Button className="w-full" disabled={isPending} size="lg" type="submit">
            {isPending ? (
              <>
                {t('sendingMessage')}
                <LoaderCircleIcon aria-hidden="true" className="animate-spin" data-icon="inline-end" />
              </>
            ) : (
              <>
                {t('sendMessage')}
                <SendHorizontalIcon aria-hidden="true" data-icon="inline-end" />
              </>
            )}
          </Button>
        </FieldGroup>
      </FieldSet>
    </form>
  );
};
