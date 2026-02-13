import { useNotifications } from "@/contexts/NotificationContext";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { formatTime } from "@/lib/utils";

export function CriticalBanner() {
  const { bannerAlert, dismissBanner } = useNotifications();
  const navigate = useNavigate();

  if (!bannerAlert) return null;

  return (
    <div className="flex items-center justify-between gap-4 bg-severity-critical px-4 py-2 text-white">
      <div className="flex items-center gap-3 text-sm">
        <span className="font-bold">⚠ CRITICAL</span>
        <span>{bannerAlert.incidentId}: {bannerAlert.description}</span>
        <span className="text-white/70">{formatTime(bannerAlert.timestamp)}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => navigate(`/incidents/${bannerAlert.incidentId}`)}>
          View Incident
        </Button>
        <button onClick={dismissBanner} className="text-white/70 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
