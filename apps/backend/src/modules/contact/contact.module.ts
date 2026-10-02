import { appConfig } from '@/config/app-config';
import { TelegramBotMessageSender } from '@/infrastructure/telegram/telegram-bot-message-sender';
import { Module } from '@/shared/module';
import { ContactController } from './controllers/contact.controller';
import { ContactService } from './services/contact.service';

export class ContactModule extends Module {
  /**
   * Wires the contact endpoint to the service that will own message delivery.
   */
  constructor() {
    const telegramBotMessageSender = new TelegramBotMessageSender({ botToken: appConfig.telegramBotToken });
    const contactService = new ContactService({
      telegramBotMessageSender,
      chatId: appConfig.telegramChatId,
    });
    const contactController = new ContactController({ contactService });

    super({ controller: contactController });
  }
}
