import { QuestionList } from '@/components/QuestionList';

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          가치 있는 질문들
        </h1>
        <p className="text-gray-600">
          맥락이 풍부하고 재사용 가능한 질문들을 탐색하세요
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <QuestionList />
        </div>
        
        <div className="space-y-6">
          <div className="card">
            <h3 className="font-semibold text-lg mb-4">인기 태그</h3>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Node.js', 'Database', 'Architecture'].map((tag) => (
                <a
                  key={tag}
                  href={`/tags/${tag}`}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition"
                >
                  {tag}
                </a>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-lg mb-4">통계</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">총 질문</span>
                <span className="font-medium">1,234</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">활성 사용자</span>
                <span className="font-medium">567</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평균 가치 점수</span>
                <span className="font-medium">8.2</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}