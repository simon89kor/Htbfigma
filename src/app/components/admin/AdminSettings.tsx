import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  RefreshCw,
  Database,
  Bell,
  Shield,
  Globe,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Checkbox } from '../ui/checkbox';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { toast } from 'sonner';
import {
  getAdminSettings,
  updateAdminSettingsBatch,
  getSystemInfo,
} from '@/lib/api/admin';
import type { AppSetting, SystemInfo } from '@/lib/api/admin';
import type { Json } from '@/lib/database.types';

// ============================================================================
// Helper: get setting value from array
// ============================================================================

function getSettingValue<T>(settings: AppSetting[], key: string, fallback: T): T {
  const found = settings.find((s) => s.key === key);
  if (!found) return fallback;
  return found.value as T;
}

// ============================================================================
// Component
// ============================================================================

const AdminSettings = () => {
  // Raw settings from API/localStorage
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(true);

  // System info
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemInfoLoading, setSystemInfoLoading] = useState(true);

  // Site settings form
  const [siteName, setSiteName] = useState('HOW TO BE');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [siteSaving, setSiteSaving] = useState(false);

  // Maintenance confirm dialog
  const [maintenanceConfirm, setMaintenanceConfirm] = useState(false);
  const [pendingMaintenanceValue, setPendingMaintenanceValue] = useState(false);

  // Notification settings form
  const [globalNotification, setGlobalNotification] = useState(true);
  const [marketingNotification, setMarketingNotification] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

  // Content policy form
  const [autoHideThreshold, setAutoHideThreshold] = useState('5');
  const [bannedWords, setBannedWords] = useState('');
  const [minReportReasonLength, setMinReportReasonLength] = useState('10');
  const [contentSaving, setContentSaving] = useState(false);

  // Content policy validation
  const [contentErrors, setContentErrors] = useState<{
    threshold?: string;
    minLength?: string;
  }>({});

  // Site validation
  const [siteErrors, setSiteErrors] = useState<{
    siteName?: string;
  }>({});

  // ---- Initial Data fetch ----

  const fetchSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const data = await getAdminSettings();
      setSettings(data);
      populateFormFromSettings(data);
    } catch {
      toast.error('설정을 불러오지 못했습니다.');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  const fetchSystemInfo = useCallback(async () => {
    try {
      setSystemInfoLoading(true);
      const info = await getSystemInfo();
      setSystemInfo(info);
    } catch {
      toast.error('시스템 정보를 불러오지 못했습니다.');
    } finally {
      setSystemInfoLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchSystemInfo();
  }, [fetchSettings, fetchSystemInfo]);

  // ---- Populate form from settings ----

  const populateFormFromSettings = (data: AppSetting[]) => {
    setSiteName(getSettingValue<string>(data, 'site_name', 'HOW TO BE'));
    setAnnouncementMessage(getSettingValue<string>(data, 'announcement_message', ''));
    setAnnouncementEnabled(getSettingValue<boolean>(data, 'announcement_enabled', false));
    setMaintenanceMode(getSettingValue<boolean>(data, 'maintenance_mode', false));
    setGlobalNotification(getSettingValue<boolean>(data, 'global_notification_enabled', true));
    setMarketingNotification(getSettingValue<boolean>(data, 'marketing_notification_enabled', true));
    setAutoHideThreshold(String(getSettingValue<number>(data, 'auto_hide_report_threshold', 5)));
    const words = getSettingValue<string[]>(data, 'banned_words', []);
    setBannedWords(Array.isArray(words) ? words.join(', ') : '');
    setMinReportReasonLength(String(getSettingValue<number>(data, 'min_report_reason_length', 10)));
  };

  // ---- Detect changes ----

  const hasSiteChanges = () => {
    const orig = settings;
    return (
      siteName !== getSettingValue<string>(orig, 'site_name', 'HOW TO BE') ||
      announcementMessage !== getSettingValue<string>(orig, 'announcement_message', '') ||
      announcementEnabled !== getSettingValue<boolean>(orig, 'announcement_enabled', false) ||
      maintenanceMode !== getSettingValue<boolean>(orig, 'maintenance_mode', false)
    );
  };

  const hasNotifChanges = () => {
    const orig = settings;
    return (
      globalNotification !== getSettingValue<boolean>(orig, 'global_notification_enabled', true) ||
      marketingNotification !== getSettingValue<boolean>(orig, 'marketing_notification_enabled', true)
    );
  };

  const hasContentChanges = () => {
    const orig = settings;
    const origWords = getSettingValue<string[]>(orig, 'banned_words', []);
    const origWordsStr = Array.isArray(origWords) ? origWords.join(', ') : '';
    return (
      autoHideThreshold !== String(getSettingValue<number>(orig, 'auto_hide_report_threshold', 5)) ||
      bannedWords !== origWordsStr ||
      minReportReasonLength !== String(getSettingValue<number>(orig, 'min_report_reason_length', 10))
    );
  };

  // ---- Maintenance mode toggle handler ----

  const handleMaintenanceToggle = (checked: boolean) => {
    if (checked) {
      // Show confirm dialog before enabling
      setPendingMaintenanceValue(true);
      setMaintenanceConfirm(true);
    } else {
      setMaintenanceMode(false);
    }
  };

  const confirmMaintenance = () => {
    setMaintenanceMode(pendingMaintenanceValue);
    setMaintenanceConfirm(false);
  };

  // ---- Save: Site Settings ----

  const saveSiteSettings = async () => {
    // Validate
    const errors: { siteName?: string } = {};
    if (!siteName.trim()) {
      errors.siteName = '앱 이름을 입력해주세요';
    }
    setSiteErrors(errors);
    if (errors.siteName) return;

    if (!hasSiteChanges()) {
      toast.info('변경사항이 없습니다');
      return;
    }

    setSiteSaving(true);
    try {
      const updates: { key: string; value: Json }[] = [
        { key: 'site_name', value: siteName.trim() },
        { key: 'announcement_message', value: announcementMessage.trim() },
        { key: 'announcement_enabled', value: announcementEnabled },
        { key: 'maintenance_mode', value: maintenanceMode },
      ];
      const newSettings = await updateAdminSettingsBatch(updates);
      setSettings(newSettings);
      toast.success('사이트 설정이 저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setSiteSaving(false);
    }
  };

  // ---- Save: Notification Settings ----

  const saveNotifSettings = async () => {
    if (!hasNotifChanges()) {
      toast.info('변경사항이 없습니다');
      return;
    }

    setNotifSaving(true);
    try {
      const updates: { key: string; value: Json }[] = [
        { key: 'global_notification_enabled', value: globalNotification },
        { key: 'marketing_notification_enabled', value: marketingNotification },
      ];
      const newSettings = await updateAdminSettingsBatch(updates);
      setSettings(newSettings);
      toast.success('알림 설정이 저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setNotifSaving(false);
    }
  };

  // ---- Save: Content Policy ----

  const saveContentPolicy = async () => {
    // Validate
    const errors: { threshold?: string; minLength?: string } = {};
    const thresholdNum = parseInt(autoHideThreshold, 10);
    if (isNaN(thresholdNum) || thresholdNum < 1) {
      errors.threshold = '1 이상의 숫자를 입력해주세요';
    }
    const minLenNum = parseInt(minReportReasonLength, 10);
    if (isNaN(minLenNum) || minLenNum < 1) {
      errors.minLength = '1 이상의 숫자를 입력해주세요';
    }
    setContentErrors(errors);
    if (errors.threshold || errors.minLength) return;

    if (!hasContentChanges()) {
      toast.info('변경사항이 없습니다');
      return;
    }

    setContentSaving(true);
    try {
      const wordsArray = bannedWords
        .split(',')
        .map((w) => w.trim())
        .filter(Boolean);

      const updates: { key: string; value: Json }[] = [
        { key: 'auto_hide_report_threshold', value: thresholdNum },
        { key: 'banned_words', value: wordsArray },
        { key: 'min_report_reason_length', value: minLenNum },
      ];
      const newSettings = await updateAdminSettingsBatch(updates);
      setSettings(newSettings);
      toast.success('콘텐츠 정책이 저장되었습니다.');
    } catch {
      toast.error('저장에 실패했습니다.');
    } finally {
      setContentSaving(false);
    }
  };

  // ---- Render ----

  if (settingsLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ---- Section 1: Site Settings ---- */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-lg font-bold text-[var(--primary)]">사이트 설정</h2>
        </div>

        <div className="space-y-4">
          {/* App name */}
          <div className="space-y-1.5">
            <Label>앱 이름</Label>
            <Input
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="앱 이름을 입력하세요"
            />
            {siteErrors.siteName && (
              <p className="text-xs text-[var(--destructive)]">{siteErrors.siteName}</p>
            )}
          </div>

          {/* Announcement */}
          <div className="space-y-1.5">
            <Label>공지사항 메시지</Label>
            <Textarea
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
              placeholder="공지사항 메시지를 입력하세요"
              rows={2}
            />
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                checked={announcementEnabled}
                onCheckedChange={(v) => setAnnouncementEnabled(!!v)}
                id="announcement-enabled"
              />
              <Label htmlFor="announcement-enabled" className="text-sm font-normal cursor-pointer">
                공지사항 활성화
              </Label>
            </div>
          </div>

          {/* Maintenance mode */}
          <div className="space-y-1.5">
            <Label>유지보수 모드</Label>
            <div className="flex items-center gap-3">
              <Switch
                checked={maintenanceMode}
                onCheckedChange={handleMaintenanceToggle}
              />
              <span className="text-sm text-[var(--text-secondary)]">
                {maintenanceMode ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              활성화 시 일반 유저 접근 차단, 관리자만 접근 가능
            </p>
          </div>

          <Button
            onClick={saveSiteSettings}
            disabled={siteSaving}
            className="bg-[var(--accent-color)] hover:bg-[#4dc99a] text-white"
          >
            {siteSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* ---- Section 2: Notification Settings ---- */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-lg font-bold text-[var(--primary)]">알림 설정</h2>
        </div>

        <div className="space-y-4">
          {/* Global notification */}
          <div className="flex items-center justify-between">
            <div>
              <Label>글로벌 알림</Label>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                OFF 시 전체 푸시 알림 발송 중지
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={globalNotification}
                onCheckedChange={setGlobalNotification}
              />
              <span className="text-sm text-[var(--text-secondary)] w-8">
                {globalNotification ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* Marketing notification */}
          <div className="flex items-center justify-between">
            <div>
              <Label>마케팅 알림</Label>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                OFF 시 마케팅/프로모션 알림 발송 중지
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={marketingNotification}
                onCheckedChange={setMarketingNotification}
              />
              <span className="text-sm text-[var(--text-secondary)] w-8">
                {marketingNotification ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          <Button
            onClick={saveNotifSettings}
            disabled={notifSaving}
            className="bg-[var(--accent-color)] hover:bg-[#4dc99a] text-white"
          >
            {notifSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* ---- Section 3: Content Policy ---- */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-lg font-bold text-[var(--primary)]">콘텐츠 정책</h2>
        </div>

        <div className="space-y-4">
          {/* Auto hide threshold */}
          <div className="space-y-1.5">
            <Label>자동 숨김 기준 (최소 신고 수)</Label>
            <Input
              type="number"
              min={1}
              value={autoHideThreshold}
              onChange={(e) => setAutoHideThreshold(e.target.value)}
            />
            <p className="text-xs text-[var(--text-muted)]">
              해당 수 이상 신고 접수 시 게시물 자동 숨김
            </p>
            {contentErrors.threshold && (
              <p className="text-xs text-[var(--destructive)]">{contentErrors.threshold}</p>
            )}
          </div>

          {/* Banned words */}
          <div className="space-y-1.5">
            <Label>금지어 목록 (쉼표로 구분)</Label>
            <Textarea
              value={bannedWords}
              onChange={(e) => setBannedWords(e.target.value)}
              placeholder="광고, 스팸, 도박, 사기, ..."
              rows={2}
            />
          </div>

          {/* Min report reason length */}
          <div className="space-y-1.5">
            <Label>최소 신고 사유 길이 (글자)</Label>
            <Input
              type="number"
              min={1}
              value={minReportReasonLength}
              onChange={(e) => setMinReportReasonLength(e.target.value)}
            />
            {contentErrors.minLength && (
              <p className="text-xs text-[var(--destructive)]">{contentErrors.minLength}</p>
            )}
          </div>

          <Button
            onClick={saveContentPolicy}
            disabled={contentSaving}
            className="bg-[var(--accent-color)] hover:bg-[#4dc99a] text-white"
          >
            {contentSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      {/* ---- Section 4: System Info (read-only) ---- */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="text-lg font-bold text-[var(--primary)]">시스템 정보</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSystemInfo}
            disabled={systemInfoLoading}
            className="h-8 text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1 ${systemInfoLoading ? 'animate-spin' : ''}`}
            />
            새로고침
          </Button>
        </div>

        {systemInfoLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ) : systemInfo ? (
          <div className="space-y-3">
            <InfoRow
              label="DB 상태"
              value={
                <Badge
                  className={
                    systemInfo.dbStatus === 'healthy'
                      ? 'bg-[#e8faf3] text-[#059669] border-transparent'
                      : systemInfo.dbStatus === 'degraded'
                        ? 'bg-[#fef3c7] text-[#d97706] border-transparent'
                        : 'bg-[#fee2e2] text-[#dc2626] border-transparent'
                  }
                >
                  {systemInfo.dbStatus === 'healthy'
                    ? '정상'
                    : systemInfo.dbStatus === 'degraded'
                      ? '저하'
                      : '중단'}
                </Badge>
              }
            />
            <InfoRow label="총 유저 수" value={`${systemInfo.totalUsers.toLocaleString()}명`} />
            <InfoRow label="총 루틴 수" value={`${systemInfo.totalRoutines.toLocaleString()}개`} />
            <InfoRow label="총 게시물 수" value={`${systemInfo.totalPosts.toLocaleString()}개`} />
            <InfoRow label="총 챌린지 수" value={`${systemInfo.totalChallenges.toLocaleString()}개`} />
            <InfoRow
              label="스토리지 사용량"
              value={`${systemInfo.storageUsed} / ${systemInfo.storageLimit}`}
            />
            <InfoRow
              label="Supabase 프로젝트 ID"
              value={
                <code className="text-xs bg-[var(--bg-secondary)] px-2 py-0.5 rounded">
                  {systemInfo.supabaseProjectId}
                </code>
              }
            />

            <div className="pt-2 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">
                마지막 갱신:{' '}
                {new Date(systemInfo.lastRefreshed).toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
            <Settings size={48} className="mb-4 opacity-40" />
            <p className="text-sm">시스템 정보를 불러올 수 없습니다</p>
          </div>
        )}
      </div>

      {/* ---- Maintenance Confirm Dialog ---- */}
      <Dialog
        open={maintenanceConfirm}
        onOpenChange={(open) => !open && setMaintenanceConfirm(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>유지보수 모드 활성화</DialogTitle>
            <DialogDescription>
              유지보수 모드를 활성화하면 일반 유저가 접근할 수 없습니다.
              관리자만 접근 가능합니다. 계속하시겠습니까?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMaintenanceConfirm(false)}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={confirmMaintenance}
            >
              활성화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// InfoRow sub-component
// ============================================================================

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

const InfoRow = ({ label, value }: InfoRowProps) => (
  <div className="flex items-center justify-between py-2">
    <span className="text-sm text-[var(--text-secondary)]">{label}</span>
    <span className="text-sm font-medium text-[var(--primary)]">{value}</span>
  </div>
);

export default AdminSettings;
