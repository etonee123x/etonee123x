export class TelegramBotMessageSender {
  private readonly botToken: string;

  /**
   * Receives the bot token without coupling the sender to application configuration.
   */
  constructor(parameters: { botToken: string }) {
    this.botToken = parameters.botToken;
  }

  /**
   * Sends plain text to the specified Telegram chat and rejects unsuccessful Bot API responses.
   */
  async sendMessage(parameters: { chatId: string; text: string }): Promise<void> {
    const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: parameters.chatId, text: parameters.text }),
    });

    const result = await response.json();

    const isSuccessful =
      response.ok && typeof result === 'object' && result !== null && 'ok' in result && result.ok === true;

    if (isSuccessful) {
      return;
    }

    const description =
      typeof result === 'object' && result !== null && 'description' in result && typeof result.description === 'string'
        ? result.description
        : 'Telegram Bot API request failed';

    throw new Error(description);
  }
}
