import {
  Sun,
  CloudSun,
  Cloud,
  Cloudy,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Thermometer,
  type LucideIcon,
} from "lucide-react";

/** WMO hava koduna uygun renkli ikon. */
export function WeatherIcon({ code, className = "h-5 w-5" }: { code: number; className?: string }) {
  let Icon: LucideIcon = Thermometer;
  let color = "text-ink-500";

  if (code === 0) {
    Icon = Sun;
    color = "text-amber-500";
  } else if (code === 1) {
    Icon = CloudSun;
    color = "text-amber-500";
  } else if (code === 2) {
    Icon = CloudSun;
    color = "text-ink-400";
  } else if (code === 3) {
    Icon = Cloudy;
    color = "text-ink-400";
  } else if (code === 45 || code === 48) {
    Icon = CloudFog;
    color = "text-ink-400";
  } else if (code >= 51 && code <= 57) {
    Icon = CloudDrizzle;
    color = "text-sky-500";
  } else if (code >= 61 && code <= 67) {
    Icon = CloudRain;
    color = "text-sky-600";
  } else if (code >= 71 && code <= 77) {
    Icon = CloudSnow;
    color = "text-sky-400";
  } else if (code >= 80 && code <= 86) {
    Icon = code >= 85 ? CloudSnow : CloudRain;
    color = "text-sky-600";
  } else if (code >= 95) {
    Icon = CloudLightning;
    color = "text-violet-500";
  } else {
    Icon = Cloud;
    color = "text-ink-400";
  }

  return <Icon className={`${className} ${color}`} strokeWidth={2} aria-hidden="true" />;
}
