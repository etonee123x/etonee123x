import { afterEach, describe, expect, it, vi } from 'vitest';
import { TelegramBotMessageSender } from './telegram-bot-message-sender';

describe('TelegramBotMessageSender', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends plain text to the configured chat', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ok: true, result: {} }, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const sender = new TelegramBotMessageSender({ botToken: 'test-token' });

    await sender.sendMessage({ chatId: '12345', text: 'Hello from the contact form' });

    expect(fetchMock).toHaveBeenCalledWith('https://api.telegram.org/bottest-token/sendMessage', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: '12345', text: 'Hello from the contact form' }),
    });
  });

  it('rejects unsuccessful Telegram Bot API responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ ok: false, description: 'Chat not found' }, { status: 400 })),
    );
    const sender = new TelegramBotMessageSender({ botToken: 'test-token' });

    await expect(sender.sendMessage({ chatId: '12345', text: 'Hello' })).rejects.toThrow('Chat not found');
  });
});
