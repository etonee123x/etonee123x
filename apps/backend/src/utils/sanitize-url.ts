export const sanitizeUrl = (url: string): string => {
  try {
    const parsed = new URL(url, 'http://localhost');
    const sensitiveKeys = new Set(['jwt', 'ott', 'token', 'secret', 'password', 'key', 'auth']);

    const parameterNames: Array<string> = [];
    parsed.searchParams.forEach((...[, name]) => {
      parameterNames.push(name);
    });

    for (const key of parameterNames) {
      if (sensitiveKeys.has(key.toLowerCase())) {
        parsed.searchParams.set(key, '[REDACTED]');
      }
    }

    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};
