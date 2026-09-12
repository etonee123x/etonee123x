const BYTE_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
const BYTES_PER_UNIT = 1024;

export const formatBytes = (bytes: number): string => {
  if (bytes === 0) {
    return '0 B';
  }

  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(BYTES_PER_UNIT)), BYTE_UNITS.length - 1);
  const value = bytes / BYTES_PER_UNIT ** exponent;
  const formattedValue = Number.isSafeInteger(value) ? String(value) : value.toFixed(1);

  // Binary units match filesystem byte accounting while keeping clear-script logs readable.
  return `${formattedValue} ${BYTE_UNITS[exponent]}`;
};
