import { Link } from "react-router";
import { Home } from "lucide-react";
import { Button } from "@heroui/react";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <h1 className="text-[64px] text-default-200 mb-2 font-bold">404</h1>
      <h2 className="text-default-900 mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-default-500 mb-6">요청하신 페이지가 존재하지 않습니다</p>
      <Link to="/" className="no-underline">
        <Button
          color="primary"
          variant="solid"
          startContent={<Home className="w-5 h-5" />}
          size="lg"
        >
          홈으로 돌아가기
        </Button>
      </Link>
    </div>
  );
}
