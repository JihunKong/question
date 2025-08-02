// Utility functions
export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('ko-KR');
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('ko-KR');
};