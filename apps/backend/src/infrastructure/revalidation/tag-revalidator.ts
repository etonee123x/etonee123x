/**
Calls the Next.js route handler that invalidates tagged cache data.
*/
export class TagRevalidator {
  private readonly endpoint: URL;
  private readonly secret: string;

  constructor(parameters: { nextServerUrl: string; secret: string }) {
    this.endpoint = new URL('/api/revalidate', parameters.nextServerUrl);
    this.secret = parameters.secret;
  }

  /**
  Marks cached data with the supplied tag as stale in Next.js.
  */
  async revalidate(tag: string): Promise<void> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-secret': this.secret,
      },
      body: JSON.stringify({ tag }),
    });

    if (!response.ok) {
      throw new Error(`Next.js cache revalidation failed with status ${response.status}`);
    }
  }
}
