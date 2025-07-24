'use client';

import { useQuery } from '@tanstack/react-query';
import { QuestionCard } from './QuestionCard';
import api, { extractData } from '@/lib/api';
import type { QuestionWithRelations } from '@question-exchange/shared';

export function QuestionList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const response = await api.get('/api/questions', {
        params: {
          status: 'PUBLISHED',
          limit: 20,
          orderBy: 'createdAt',
        },
      });
      return extractData<{
        questions: QuestionWithRelations[];
        pagination: any;
      }>(response);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">질문을 불러오는데 실패했습니다.</p>
      </div>
    );
  }

  if (!data?.questions.length) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">아직 등록된 질문이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.questions.map((question) => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </div>
  );
}