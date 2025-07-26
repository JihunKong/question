'use client';

import { useNetworkStatus, useOfflineSync } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

export function NetworkStatus() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const { pendingSync, syncNow } = useOfflineSync();

  if (isOnline && !isSlowConnection && pendingSync === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm',
        !isOnline ? 'bg-red-50 border border-red-200' :
        isSlowConnection ? 'bg-yellow-50 border border-yellow-200' :
        'bg-blue-50 border border-blue-200'
      )}
    >
      {!isOnline && (
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-red-600 mt-0.5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="font-medium text-red-900">오프라인 모드</p>
            <p className="text-sm text-red-700 mt-1">
              인터넷 연결이 없습니다. 작업은 자동 저장됩니다.
            </p>
          </div>
        </div>
      )}

      {isSlowConnection && (
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-yellow-600 mt-0.5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <div>
            <p className="font-medium text-yellow-900">저속 연결</p>
            <p className="text-sm text-yellow-700 mt-1">
              간소화된 모드로 전환되었습니다.
            </p>
          </div>
        </div>
      )}

      {pendingSync > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              대기 중인 동기화: {pendingSync}개
            </p>
            <button
              onClick={syncNow}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              지금 동기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}