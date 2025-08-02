import Link from 'next/link';
// Temporary inline types until shared package is properly configured
interface User {
  id: string;
  email: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
}

interface Evaluation {
  totalScore: number;
}

interface Context {
  background: string;
}

interface QuestionWithRelations {
  id: string;
  coreQuestion: string;
  context?: Context;
  tags: { tag: Tag }[];
  user: User;
  evaluations?: Evaluation[];
  createdAt: string;
}

const formatDate = (date: string) => new Date(date).toLocaleDateString('ko-KR');

interface QuestionCardProps {
  question: QuestionWithRelations;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const latestEvaluation = question.evaluations?.[0];

  return (
    <div className="card hover:shadow-lg transition-shadow">
      <Link href={`/questions/${question.id}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary-600">
          {question.coreQuestion}
        </h3>
      </Link>
      
      {question.context && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {question.context.background}
        </p>
      )}
      
      <div className="flex flex-wrap gap-2 mb-3">
        {question.tags.map(({ tag }) => (
          <span
            key={tag.id}
            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
          >
            {tag.name}
          </span>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>{question.user.name || question.user.email}</span>
          <span>{formatDate(question.createdAt)}</span>
        </div>
        
        {latestEvaluation && (
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">★</span>
            <span className="font-medium">{latestEvaluation.totalScore.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}