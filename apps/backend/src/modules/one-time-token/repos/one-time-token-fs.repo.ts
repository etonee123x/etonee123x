import { FsDatabaseRepo } from '@/infrastructure/database/fs-database.repo';
import type { OneTimeTokenRepo } from './one-time-token.repo';

export class OneTimeTokenFsRepo extends FsDatabaseRepo<{ tokenHash: string }> implements OneTimeTokenRepo {
  /**
   * Persists the token digest as a database row.
   */
  async create(parameters: { tokenHash: string }): Promise<void> {
    await this.fsDatabaseFile.writeEntityOrRow(undefined, parameters);
  }

  /**
   * Deletes a token row and returns its creation time.
   */
  async consume(parameters: { tokenHash: string }): Promise<number | null> {
    const rows = await this.fsDatabaseFile.read();
    const row = rows.find((row) => {
      return row.tokenHash === parameters.tokenHash;
    });

    if (!row) {
      return null;
    }

    await this.fsDatabaseFile.deleteRowById({ id: row._meta.id });

    return row._meta.createdAt;
  }

  /**
   * Deletes every stored token row and returns the number removed.
   */
  async clearAll(): Promise<number> {
    const rows = await this.fsDatabaseFile.read();
    await this.fsDatabaseFile.drop();

    return rows.length;
  }
}
