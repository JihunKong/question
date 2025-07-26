'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

export function TeacherOnboarding() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState({
    name: '',
    school: '',
    subject: '',
    experience: '',
    sampleText: '',
    generatedQuestions: [] as string[],
  });

  const steps: OnboardingStep[] = [
    {
      id: 0,
      title: '환영합니다!',
      description: '질문 교환 플랫폼과 함께 더 나은 교육을 만들어가요',
      component: <WelcomeStep />,
    },
    {
      id: 1,
      title: '기본 정보',
      description: '선생님에 대해 알려주세요',
      component: (
        <BasicInfoStep
          data={onboardingData}
          onChange={(data) => setOnboardingData({ ...onboardingData, ...data })}
        />
      ),
    },
    {
      id: 2,
      title: '첫 질문 만들기',
      description: '간단한 텍스트로 질문을 생성해보세요',
      component: (
        <FirstQuestionStep
          data={onboardingData}
          onChange={(data) => setOnboardingData({ ...onboardingData, ...data })}
        />
      ),
    },
    {
      id: 3,
      title: '완료!',
      description: '이제 시작할 준비가 되었습니다',
      component: <CompletionStep name={onboardingData.name} />,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save onboarding completion
      localStorage.setItem('onboardingCompleted', 'true');
      router.push('/dashboard');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-8">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'w-full h-2 rounded-full mx-1',
                  index <= currentStep ? 'bg-primary-600' : 'bg-gray-200'
                )}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center mt-2">
            {currentStep + 1} / {steps.length} 단계
          </p>
        </div>

        {/* Step content */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-gray-600">{currentStepData.description}</p>
        </div>

        <div className="mb-8">{currentStepData.component}</div>

        {/* Navigation buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            className={cn(
              'px-6 py-2 rounded-lg transition',
              currentStep === 0
                ? 'invisible'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            )}
          >
            이전
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            {currentStep === steps.length - 1 ? '시작하기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center py-8">
      <div className="w-32 h-32 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-16 h-16 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-4">
        질문 교환 플랫폼에 오신 것을 환영합니다!
      </h3>
      <p className="text-gray-600 mb-6">
        이 플랫폼은 AI를 활용해 더 나은 질문을 만들고,
        <br />
        학생들과 함께 깊이 있는 학습을 할 수 있도록 도와드립니다.
      </p>
      <div className="bg-blue-50 p-4 rounded-lg text-left">
        <h4 className="font-semibold text-blue-900 mb-2">주요 기능:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• AI 기반 질문 생성 및 평가</li>
          <li>• 실시간 협업 도구</li>
          <li>• 오프라인 모드 지원</li>
          <li>• 학습 분석 대시보드</li>
        </ul>
      </div>
    </div>
  );
}

function BasicInfoStep({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          성함
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="예: 김선생"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          학교
        </label>
        <input
          type="text"
          value={data.school}
          onChange={(e) => onChange({ school: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="예: 한국중학교"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          담당 과목
        </label>
        <select
          value={data.subject}
          onChange={(e) => onChange({ subject: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">선택하세요</option>
          <option value="korean">국어</option>
          <option value="math">수학</option>
          <option value="english">영어</option>
          <option value="science">과학</option>
          <option value="social">사회</option>
          <option value="other">기타</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          디지털 도구 사용 경험
        </label>
        <select
          value={data.experience}
          onChange={(e) => onChange({ experience: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">선택하세요</option>
          <option value="beginner">처음 사용</option>
          <option value="intermediate">가끔 사용</option>
          <option value="advanced">자주 사용</option>
        </select>
      </div>
    </div>
  );
}

function FirstQuestionStep({
  data,
  onChange,
}: {
  data: any;
  onChange: (data: any) => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateQuestions = async () => {
    if (!data.sampleText) return;

    setIsGenerating(true);
    // Simulate question generation
    setTimeout(() => {
      const questions = [
        '이 텍스트의 핵심 주제는 무엇인가요?',
        '저자가 전달하고자 하는 주요 메시지는 무엇일까요?',
        '이 내용을 실생활에 어떻게 적용할 수 있을까요?',
      ];
      onChange({ generatedQuestions: questions });
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          수업 자료 텍스트
        </label>
        <textarea
          value={data.sampleText}
          onChange={(e) => onChange({ sampleText: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-32"
          placeholder="수업에 사용할 텍스트를 입력하세요. (예: 교과서 본문, 신문 기사 등)"
        />
      </div>

      <button
        onClick={handleGenerateQuestions}
        disabled={!data.sampleText || isGenerating}
        className={cn(
          'w-full py-2 rounded-lg transition',
          data.sampleText && !isGenerating
            ? 'bg-primary-600 text-white hover:bg-primary-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        )}
      >
        {isGenerating ? '질문 생성 중...' : '질문 생성하기'}
      </button>

      {data.generatedQuestions.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">
            생성된 질문:
          </h4>
          <ul className="space-y-2">
            {data.generatedQuestions.map((question: string, index: number) => (
              <li
                key={index}
                className="flex items-start text-sm text-green-800"
              >
                <span className="font-medium mr-2">{index + 1}.</span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-green-600 mt-3">
            💡 이런 식으로 AI가 학습에 도움이 되는 질문을 생성합니다!
          </p>
        </div>
      )}
    </div>
  );
}

function CompletionStep({ name }: { name: string }) {
  return (
    <div className="text-center py-8">
      <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg
          className="w-16 h-16 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold mb-4">
        {name} 선생님, 준비가 완료되었습니다!
      </h3>
      <p className="text-gray-600 mb-6">
        이제 질문 교환 플랫폼의 모든 기능을 사용하실 수 있습니다.
      </p>
      <div className="bg-gray-50 p-4 rounded-lg text-left max-w-md mx-auto">
        <h4 className="font-semibold text-gray-900 mb-2">다음 단계:</h4>
        <ul className="text-sm text-gray-700 space-y-2">
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">1.</span>
            <span>대시보드에서 전체 기능 둘러보기</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">2.</span>
            <span>첫 수업 자료로 질문 생성해보기</span>
          </li>
          <li className="flex items-start">
            <span className="text-primary-600 mr-2">3.</span>
            <span>학생들과 공유하고 협업 시작하기</span>
          </li>
        </ul>
      </div>
    </div>
  );
}