import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, QrCode, ScanLine, Download, Share2, Image as ImageIcon, RefreshCw, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { cn } from './ui/utils';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '../auth-context';
import { getUserRoutines, type UserRoutineWithItems } from '@/lib/api/user-routines';
import { toast } from 'sonner';

// ============================================================================
// Constants
// ============================================================================

const QR_TABS = [
  { key: 'my-qr', label: '내 QR', icon: QrCode },
  { key: 'scan', label: '스캔', icon: ScanLine },
] as const;

type QRTab = (typeof QR_TABS)[number]['key'];

/** QR 코드에 인코딩할 URL base (루틴 상세 딥링크) */
const QR_BASE_URL = `${window.location.origin}/product/`;

// ============================================================================
// Types
// ============================================================================

interface ShareHistoryItem {
  id: string;
  targetName: string;
  date: string;
}

// ============================================================================
// Component
// ============================================================================

const QRCodeCenterPage = () => {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<QRTab>('my-qr');

  // My QR state
  const [routines, setRoutines] = useState<UserRoutineWithItems[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareHistory] = useState<ShareHistoryItem[]>([]);
  const qrRef = useRef<HTMLDivElement>(null);

  // Scanner state
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any | null>(null);
  const scannerContainerId = 'qr-scanner-container';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ========================================================================
  // Load Routines
  // ========================================================================

  useEffect(() => {
    if (!user) return;

    const loadRoutines = async () => {
      setLoading(true);
      try {
        const result = await getUserRoutines(user.id, { status: 'active' });
        setRoutines(result.data);
        if (result.data.length > 0) {
          setSelectedRoutineId(result.data[0].id);
        }
      } catch {
        toast.error('루틴을 불러오지 못했습니다');
      } finally {
        setLoading(false);
      }
    };

    loadRoutines();
  }, [user]);

  // ========================================================================
  // Scanner Lifecycle
  // ========================================================================

  const startScanner = useCallback(async () => {
    if (scannerRef.current) return;

    setCameraError(null);

    try {
      // Dynamic import: html5-qrcode is only loaded when the scan tab is activated
      const { Html5Qrcode } = await import('html5-qrcode');

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;
      setScanning(true);
      setScanResult(null);

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText: string) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // QR code not found in frame - ignore
        }
      );
    } catch (err) {
      setScanning(false);

      // Clear potentially half-initialised scanner
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch {
          // Ignore clear errors
        }
        scannerRef.current = null;
      }

      const errorName = (err as DOMException)?.name ?? '';

      if (errorName === 'NotAllowedError') {
        setCameraError('카메라 접근이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
      } else if (errorName === 'NotFoundError') {
        setCameraError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
      } else {
        setCameraError('카메라를 시작할 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인해주세요.');
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          // Html5QrcodeScannerState.SCANNING
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch {
        // Ignore stop errors
      }
      scannerRef.current = null;
      setScanning(false);
    }
  }, []);

  // Start scanner when switching to scan tab
  useEffect(() => {
    if (activeTab === 'scan') {
      // Small delay to ensure DOM element is rendered
      const timer = setTimeout(() => {
        startScanner();
      }, 300);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      setScanResult(decodedText);
      stopScanner();

      // If it is a routine URL, navigate to it
      if (decodedText.includes('/product/')) {
        const routineId = decodedText.split('/product/').pop();
        if (routineId) {
          toast.success('QR 코드를 인식했습니다');
          navigate(`/product/${routineId}`);
          return;
        }
      }
      toast.success('QR 코드를 인식했습니다');
    },
    [navigate, stopScanner]
  );

  const handleGallerySelect = useCallback(async () => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        // Stop existing scanner before scanning file
        await stopScanner();

        const { Html5Qrcode } = await import('html5-qrcode');
        const html5QrCode = new Html5Qrcode(scannerContainerId);
        const result = await html5QrCode.scanFile(file, true);
        html5QrCode.clear();
        handleScanSuccess(result);
      } catch {
        toast.error('QR 코드를 인식할 수 없습니다');
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleScanSuccess, stopScanner]
  );

  const handleDownloadQR = useCallback(() => {
    if (!qrRef.current) return;

    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `htb-qr-${selectedRoutineId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      toast.success('QR 코드가 저장되었습니다');
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  }, [selectedRoutineId]);

  const handleShareQR = useCallback(async () => {
    if (!qrRef.current) return;

    const svgElement = qrRef.current.querySelector('svg');
    if (!svgElement) return;

    // Try Web Share API first
    if (navigator.share) {
      try {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            resolve();
          };
          img.onerror = reject;
          img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
        });

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png');
        });

        const file = new File([blob], 'htb-qr.png', { type: 'image/png' });

        await navigator.share({
          title: 'HTB 루틴 QR 코드',
          text: '이 루틴을 확인해보세요!',
          files: [file],
        });
        toast.success('공유되었습니다');
      } catch (err) {
        // User cancelled share or share not supported for files
        if ((err as Error)?.name !== 'AbortError') {
          // Fallback: copy URL
          const routineUrl = `${QR_BASE_URL}${selectedRoutine?.routine_id ?? selectedRoutineId}`;
          await navigator.clipboard.writeText(routineUrl);
          toast.success('링크가 클립보드에 복사되었습니다');
        }
      }
    } else {
      // Fallback: copy URL
      const routineUrl = `${QR_BASE_URL}${selectedRoutine?.routine_id ?? selectedRoutineId}`;
      try {
        await navigator.clipboard.writeText(routineUrl);
        toast.success('링크가 클립보드에 복사되었습니다');
      } catch {
        toast.error('링크 복사에 실패했습니다');
      }
    }
  }, [selectedRoutineId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ========================================================================
  // Derived Data
  // ========================================================================

  const selectedRoutine = routines.find((r) => r.id === selectedRoutineId) ?? null;

  const qrValue = selectedRoutine
    ? `${QR_BASE_URL}${selectedRoutine.routine_id ?? selectedRoutine.id}`
    : '';

  // ========================================================================
  // Auth Guard
  // ========================================================================

  if (!isLoggedIn || !user) {
    navigate('/login?redirect=/qr', { replace: true });
    return null;
  }

  // ========================================================================
  // Render
  // ========================================================================

  return (
    <div className="min-h-screen bg-white -mx-4 sm:-mx-6 lg:-mx-8 -mt-8 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="뒤로가기"
          >
            <ArrowLeft size={22} className="text-[#1a1a2e]" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-[#1a1a2e]">QR 코드</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 gap-2">
        {QR_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors',
              activeTab === tab.key
                ? 'bg-[#65D9AC] text-white'
                : 'bg-[#F5F5F5] text-[#6B7280]'
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'my-qr' ? (
        <div className="px-4 pt-6 space-y-6">
          {/* Routine Selector */}
          <div>
            <p className="text-sm font-semibold text-[#1a1a2e] mb-3">루틴을 선택하세요</p>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : routines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[#6B7280]">
                <QrCode size={48} className="mb-4 text-gray-300" />
                <p className="text-sm">진행 중인 루틴이 없습니다</p>
                <p className="text-xs text-[#9CA3AF] mt-1">루틴을 시작하면 QR 코드를 생성할 수 있습니다</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {routines.map((routine) => (
                  <button
                    key={routine.id}
                    onClick={() => setSelectedRoutineId(routine.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors',
                      selectedRoutineId === routine.id
                        ? 'bg-[#65D9AC]/10 border-2 border-[#65D9AC]'
                        : 'bg-[#F5F5F5] border-2 border-transparent'
                    )}
                  >
                    <div
                      className={cn(
                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                        selectedRoutineId === routine.id
                          ? 'border-[#65D9AC]'
                          : 'border-[#E5E7EB]'
                      )}
                    >
                      {selectedRoutineId === routine.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#65D9AC]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1a1a2e] truncate">{routine.title}</p>
                      {routine.category && (
                        <p className="text-xs text-[#9CA3AF]">{routine.category}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* QR Code Display */}
          {selectedRoutine && (
            <div className="flex flex-col items-center">
              <div
                ref={qrRef}
                className="bg-white p-6 rounded-2xl shadow-lg border border-[#E5E7EB] flex flex-col items-center"
              >
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  bgColor="#FFFFFF"
                  fgColor="#1a1a2e"
                  level="M"
                  includeMargin={false}
                />
                <p className="mt-4 text-base font-semibold text-[#1a1a2e]">
                  {selectedRoutine.title}
                </p>
                <p className="text-xs text-[#9CA3AF] mt-1">by HTB</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 w-full max-w-xs">
                <button
                  onClick={handleDownloadQR}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#F5F5F5] text-[#1a1a2e] text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  <Download size={18} />
                  이미지 저장
                </button>
                <button
                  onClick={handleShareQR}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#65D9AC] text-white text-sm font-semibold hover:bg-[#56c99b] transition-colors"
                >
                  <Share2 size={18} />
                  공유하기
                </button>
              </div>
            </div>
          )}

          {/* Share History */}
          {shareHistory.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-[#1a1a2e] mb-3">공유 이력</p>
              <div className="space-y-2">
                {shareHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 px-3 bg-[#F5F5F5] rounded-xl"
                  >
                    <span className="text-sm text-[#1a1a2e]">
                      {item.targetName}에게 공유
                    </span>
                    <span className="text-xs text-[#9CA3AF]">{item.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Scan Tab */
        <div className="px-4 pt-6 space-y-4">
          {/* Scanner View */}
          <div className="rounded-2xl overflow-hidden border border-[#E5E7EB] bg-black relative">
            <div
              id={scannerContainerId}
              className="w-full aspect-square"
            />
            {/* Camera preparing state */}
            {!scanning && !scanResult && !cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white">
                <ScanLine size={48} className="mb-3 text-[#65D9AC]" />
                <p className="text-sm">카메라를 준비하고 있습니다...</p>
              </div>
            )}
            {/* Camera error state - inline message */}
            {cameraError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 text-white px-6">
                <AlertTriangle size={48} className="mb-4 text-amber-400" />
                <p className="text-sm text-center leading-relaxed mb-5">{cameraError}</p>
                <button
                  onClick={() => {
                    setCameraError(null);
                    startScanner();
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#65D9AC] text-white text-sm font-semibold hover:bg-[#56c99b] transition-colors"
                >
                  <RefreshCw size={16} />
                  다시 시도
                </button>
              </div>
            )}
          </div>

          {scanning && (
            <p className="text-center text-sm text-[#6B7280]">QR 코드를 스캔하세요</p>
          )}

          {scanResult && (
            <div className="p-4 bg-[#65D9AC]/10 rounded-xl border border-[#65D9AC]">
              <p className="text-sm font-semibold text-[#1a1a2e] mb-1">스캔 결과</p>
              <p className="text-sm text-[#6B7280] break-all">{scanResult}</p>
              <button
                onClick={() => {
                  setScanResult(null);
                  startScanner();
                }}
                className="mt-3 px-4 py-2 rounded-lg bg-[#65D9AC] text-white text-sm font-semibold"
              >
                다시 스캔하기
              </button>
            </div>
          )}

          {/* Gallery Selection */}
          <button
            onClick={handleGallerySelect}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#F5F5F5] text-[#1a1a2e] text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            <ImageIcon size={18} />
            갤러리에서 선택
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            aria-label="갤러리에서 QR 이미지 선택"
          />
        </div>
      )}
    </div>
  );
};

export default QRCodeCenterPage;
