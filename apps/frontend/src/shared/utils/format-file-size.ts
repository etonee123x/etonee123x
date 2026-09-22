import { throwError } from './throw-error';

// Format byte values consistently across upload and download interfaces.
export const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  const maximumFractionDigits = unitIndex === 0 || value >= 10 ? 0 : 1;

  return {
    maximumFractionDigits,
    unit: units[unitIndex] ?? throwError(),
    value,
  };
};
