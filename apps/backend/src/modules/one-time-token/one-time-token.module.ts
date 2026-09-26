import { appConfig } from '@/config/app-config';
import { FsDatabaseFile } from '@/infrastructure/fs-database-file';
import { Module } from '@/shared/module';
import { OneTimeTokenController } from './controllers/one-time-token.controller';
import { OneTimeTokenFsRepo } from './repos/one-time-token-fs.repo';
import { OneTimeTokenService } from './services/one-time-token.service';

export class OneTimeTokenModule extends Module {
  /**
  Shared by the token endpoint and auth module.
  */
  readonly oneTimeTokenService: OneTimeTokenService;

  /**
   * Wires persistent token storage, token generation, and the protected endpoint.
   */
  constructor() {
    const tokenDatabaseFile = new FsDatabaseFile<{ tokenHash: string }>({ fileName: 'one-time-tokens.json' });
    const oneTimeTokenRepo = new OneTimeTokenFsRepo({ fsDatabaseFile: tokenDatabaseFile });
    const oneTimeTokenService = new OneTimeTokenService({ oneTimeTokenRepo });
    const oneTimeTokenController = new OneTimeTokenController({
      oneTimeTokenService,
      secret: appConfig.oneTimeTokenSecret,
    });

    super({ controller: oneTimeTokenController });
    this.oneTimeTokenService = oneTimeTokenService;
  }
}
