// Format byte values consistently across upload and download interfaces.
export const formatFileSize = (bytes: number) => {
  const units = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.min(Math.floor(Math.log(Math.max(bytes, 1)) / Math.log(1024)), units.length - 1);
  const size = bytes / 1024 ** unitIndex;
  const maximumFractionDigits = unitIndex === 0 || size >= 10 ? 0 : 1;

  return `${new Intl.NumberFormat(undefined, { maximumFractionDigits }).format(size)} ${units[unitIndex]}`;
};
