'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { questionFormSchema, type QuestionFormInput } from '@question-exchange/shared';
import { useMutation } from '@tanstack/react-query';
import api, { extractData } from '@/lib/api';
import toast from 'react-hot-toast';

export default function NewQuestionPage() {
  const router = useRouter();
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormInput>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      enableCollaboration: false,
    },
  });

  const createQuestion = useMutation({
    mutationFn: async (data: QuestionFormInput) => {
      const response = await api.post('/api/questions', data);
      return extractData(response);
    },
    onSuccess: (data: any) => {
      toast.success('질문이 생성되었습니다!');
      router.push(`/questions/${data.id}`);
    },
  });

  const onSubmit = (data: QuestionFormInput) => {
    createQuestion.mutate({ ...data, tags });
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput) && tags.length < 5) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">새 질문 만들기</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">핵심 질문</h2>
          <textarea
            {...register('coreQuestion')}
            className="textarea h-24"
            placeholder="명확하고 구체적인 질문을 작성해주세요..."
          />
          {errors.coreQuestion && (
            <p className="text-red-500 text-sm mt-1">{errors.coreQuestion.message}</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">맥락 정보</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">배경</label>
              <textarea
                {...register('context.background')}
                className="textarea h-20"
                placeholder="이 질문이 나오게 된 배경이나 상황을 설명해주세요..."
              />
              {errors.context?.background && (
                <p className="text-red-500 text-sm mt-1">{errors.context.background.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">사전 지식</label>
              <textarea
                {...register('context.priorKnowledge')}
                className="textarea h-20"
                placeholder="이미 알고 있는 관련 지식이나 경험을 공유해주세요..."
              />
              {errors.context?.priorKnowledge && (
                <p className="text-red-500 text-sm mt-1">{errors.context.priorKnowledge.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">시도한 접근법</label>
              <textarea
                {...register('context.attemptedApproach')}
                className="textarea h-20"
                placeholder="이미 시도해본 방법이나 고민한 내용을 설명해주세요..."
              />
              {errors.context?.attemptedApproach && (
                <p className="text-red-500 text-sm mt-1">{errors.context.attemptedApproach.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">예상 활용</label>
              <textarea
                {...register('context.expectedUse')}
                className="textarea h-20"
                placeholder="답변을 어떻게 활용할 계획인지 설명해주세요..."
              />
              {errors.context?.expectedUse && (
                <p className="text-red-500 text-sm mt-1">{errors.context.expectedUse.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">태그</h2>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="input flex-1"
              placeholder="태그 입력 후 Enter"
            />
            <button type="button" onClick={addTag} className="btn-secondary">
              추가
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-primary-900 hover:text-red-600"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {errors.tags && (
            <p className="text-red-500 text-sm mt-1">{errors.tags.message}</p>
          )}
        </div>

        <div className="card">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              {...register('enableCollaboration')}
              className="rounded"
            />
            <span>실시간 협업 활성화</span>
          </label>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting ? '생성 중...' : '질문 생성'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-secondary"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}