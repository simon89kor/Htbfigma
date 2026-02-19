import { Link } from "react-router";
import { Home } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-[64px] text-violet-200 mb-2">404</h1>
      <h2 className="text-[#1a1a2e] mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-gray-400 mb-6">요청하신 페이지가 존재하지 않습니다</p>
      <Link
        to="/"
        className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl no-underline hover:bg-violet-700 transition-colors"
      >
        <Home className="w-5 h-5" />
        홈으로 돌아가기
      </Link>
    </div>
  );
}
