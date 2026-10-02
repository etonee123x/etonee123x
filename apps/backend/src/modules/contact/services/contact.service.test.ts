import { describe, expect, it, vi } from 'vitest';
import { TelegramBotMessageSender } from '@/infrastructure/telegram/telegram-bot-message-sender';
import { ContactService } from './contact.service';

describe('ContactService', () => {
  it('sends message and reply contact to the configured chat', async () => {
    const telegramBotMessageSender = new TelegramBotMessageSender({ botToken: 'test-token' });
    const sendMessage = vi.spyOn(telegramBotMessageSender, 'sendMessage').mockResolvedValue();
    const contactService = new ContactService({ telegramBotMessageSender, chatId: '12345' });

    await contactService.submit({ text: 'Hello', contact: 'reader@example.com' });

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: '12345',
      text: 'New contact message:\n\nHello\n\nReply contact: reader@example.com',
    });
  });

  it('sends the message without a reply contact when none is provided', async () => {
    const telegramBotMessageSender = new TelegramBotMessageSender({ botToken: 'test-token' });
    const sendMessage = vi.spyOn(telegramBotMessageSender, 'sendMessage').mockResolvedValue();
    const contactService = new ContactService({ telegramBotMessageSender, chatId: '12345' });

    await contactService.submit({ text: 'Hello' });

    expect(sendMessage).toHaveBeenCalledWith({
      chatId: '12345',
      text: 'New contact message:\n\nHello',
    });
  });
});
