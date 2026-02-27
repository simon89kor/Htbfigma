import { Target } from 'lucide-react';

// ============================================================================
// AdminChallengeManagement — Placeholder
// ============================================================================

const AdminChallengeManagement = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)]">
          <div className="w-16 h-16 rounded-2xl bg-[var(--secondary)] flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-[var(--accent)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--primary)] mb-2">챌린지 관리</h1>
          <p className="text-sm text-[var(--text-muted)]">준비 중입니다</p>
        </div>
      </div>
    </div>
  );
};

export default AdminChallengeManagement;
