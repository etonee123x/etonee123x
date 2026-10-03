class AppConfig {
  private static getRequiredEnvironmentVariable(name: string): string {
    const value = process.env[name];

    if (!value || value.trim() === '') {
      throw new Error(`${name} is not defined`);
    }

    return value;
  }

  private static getOptionalEnvironmentVariable(name: string): string | undefined {
    const value = process.env[name]?.trim();

    return value || undefined;
  }

  private static getEnvironmentVariablePositiveNumber(name: string): number {
    const numberValue = Number(this.getRequiredEnvironmentVariable(name));

    if (!Number.isFinite(numberValue) || numberValue <= 0) {
      throw new Error(`${name} must be a positive number`);
    }

    return numberValue;
  }

  private static getPortFromEnvironment(): number {
    const port = Number(this.getRequiredEnvironmentVariable('PORT'));

    if (!Number.isSafeInteger(port) || port < 0 || port > 65_535) {
      throw new Error('PORT must be an integer between 0 and 65535');
    }

    return port;
  }

  /**
  HTTP server port.
  */
  readonly port: number;
  /**
  Secret used to sign and verify JWTs.
  */
  readonly secretKey: string;
  /**
  Secret required to create one-time tokens.
  */
  readonly oneTimeTokenSecret: string;
  /**
  Telegram bot token used for contact message delivery.
  */
  readonly telegramBotToken: string;
  /**
  Telegram chat ID that receives contact messages.
  */
  readonly telegramChatId: string;
  /**
  Maximum age of an unused one-time token in milliseconds.
  */
  readonly oneTimeTokenTtlMs: number;
  /**
  Maximum JWT lifetime in milliseconds.
  */
  readonly authTokenMaxLifetimeMs: number;
  /**
  Path to the database files.
  */
  readonly databasePath: string;
  /**
  Path to public content files.
  */
  readonly contentPath: string;
  /**
  Path to uploaded files.
  */
  readonly uploadsPath: string;
  /**
  Path to audio cover files extracted from embedded audio metadata.
  */
  readonly audioCoversPath: string;
  /**
  Optional path to file inspector cache files; without it, caching is disabled.
  */
  readonly fileInspectorCachePath: string | undefined;
  /**
  Maximum JSON request body size.
  */
  readonly jsonBodyLimit: string;
  /**
  Maximum request processing time in milliseconds.
  */
  readonly requestTimeoutMs: number;
  /**
  Maximum time for receiving request headers in milliseconds.
  */
  readonly headersTimeoutMs: number;
  /**
  Keep-alive timeout in milliseconds.
  */
  readonly keepAliveTimeoutMs: number;
  /**
  Allowed CORS origins.
  */
  readonly corsOrigins: Array<string>;
  /**
  Whether the application runs in production.
  */
  readonly isProduction: boolean;
  /**
  Whether the application runs in development.
  */
  readonly isDevelopment: boolean;

  constructor() {
    const nodeEnvironment = AppConfig.getOptionalEnvironmentVariable('NODE_ENV') ?? 'production';
    const corsOrigin = AppConfig.getRequiredEnvironmentVariable('CORS_ORIGIN');

    this.port = AppConfig.getPortFromEnvironment();
    this.secretKey = AppConfig.getRequiredEnvironmentVariable('SECRET_KEY');
    this.oneTimeTokenSecret = AppConfig.getRequiredEnvironmentVariable('ONE_TIME_TOKEN_SECRET');
    this.telegramBotToken = AppConfig.getRequiredEnvironmentVariable('TELEGRAM_BOT_TOKEN');
    this.telegramChatId = AppConfig.getRequiredEnvironmentVariable('TELEGRAM_CHAT_ID');
    this.oneTimeTokenTtlMs = AppConfig.getEnvironmentVariablePositiveNumber('ONE_TIME_TOKEN_TTL_MS');
    this.authTokenMaxLifetimeMs = AppConfig.getEnvironmentVariablePositiveNumber('AUTH_TOKEN_MAX_LIFETIME_MS');
    this.databasePath = AppConfig.getRequiredEnvironmentVariable('DATABASE_PATH');
    this.contentPath = AppConfig.getRequiredEnvironmentVariable('CONTENT_PATH');
    this.uploadsPath = AppConfig.getRequiredEnvironmentVariable('UPLOADS_PATH');
    this.audioCoversPath = AppConfig.getRequiredEnvironmentVariable('AUDIO_COVERS_PATH');
    this.fileInspectorCachePath = AppConfig.getOptionalEnvironmentVariable('FILE_INSPECTOR_CACHE_PATH');
    this.jsonBodyLimit = AppConfig.getRequiredEnvironmentVariable('JSON_BODY_LIMIT');
    this.requestTimeoutMs = AppConfig.getEnvironmentVariablePositiveNumber('REQUEST_TIMEOUT_MS');
    this.headersTimeoutMs = AppConfig.getEnvironmentVariablePositiveNumber('HEADERS_TIMEOUT_MS');
    this.keepAliveTimeoutMs = AppConfig.getEnvironmentVariablePositiveNumber('KEEP_ALIVE_TIMEOUT_MS');
    this.corsOrigins = corsOrigin.split(',').map((origin) => {
      return origin.trim();
    });
    this.isProduction = nodeEnvironment === 'production';
    this.isDevelopment = nodeEnvironment === 'development';
  }
}

export const appConfig = new AppConfig();
