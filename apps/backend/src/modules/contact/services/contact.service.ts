import type { TelegramBotMessageSender } from '@/infrastructure/telegram/telegram-bot-message-sender';

export class ContactService {
  private readonly telegramBotMessageSender: TelegramBotMessageSender;
  private readonly chatId: string;

  /**
   * Receives the Telegram sender and destination chat from the module composition root.
   */
  constructor(parameters: { telegramBotMessageSender: TelegramBotMessageSender; chatId: string }) {
    this.telegramBotMessageSender = parameters.telegramBotMessageSender;
    this.chatId = parameters.chatId;
  }

  /**
   * Sends the contact message and optional reply contact to the configured Telegram chat.
   */
  async submit(parameters: { text: string; contact?: string }): Promise<void> {
    await this.telegramBotMessageSender.sendMessage({
      chatId: this.chatId,
      text: [
        'New contact message:',
        parameters.text,
        ...(parameters.contact ? [`Reply contact: ${parameters.contact}`] : []),
      ].join('\n\n'),
    });
  }
}
