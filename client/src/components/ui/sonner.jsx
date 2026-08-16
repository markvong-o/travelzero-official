import { Toaster as Sonner } from "sonner";
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const iconStyle = { width: "1rem", height: "1rem" };

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      theme="light"
      icons={{
        success: <CircleCheckIcon style={iconStyle} />,
        info: <InfoIcon style={iconStyle} />,
        warning: <TriangleAlertIcon style={iconStyle} />,
        error: <OctagonXIcon style={iconStyle} />,
        loading: <Loader2Icon className="spin" style={iconStyle} />,
      }}
      style={{
        "--normal-bg": "var(--popover)",
        "--normal-text": "var(--popover-foreground)",
        "--normal-border": "var(--border)",
        "--border-radius": "var(--radius-lg)",
      }}
      toastOptions={{
        style: { boxShadow: "var(--elevation-lg)" },
      }}
      {...props} />
  );
}

export { Toaster }
