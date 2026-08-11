import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PhoneFrame } from '../components/PhoneFrame';

// Explicit allow-list of routes the picker can preview. This is also the
// guard against iframe recursion — '/mobile' itself is deliberately not
// in this list, so a malformed or malicious `?preview=` value always
// falls back to '/' instead of nesting the mobile view inside itself.
const PREVIEWABLE_ROUTES = [
  { path: '/', label: 'Browse' },
  { path: '/dashboard', label: 'Dashboard' },
  { path: '/assistant', label: 'Assistant' },
  { path: '/admin/experiments', label: 'Experiments' },
];
const PREVIEWABLE_PATHS = PREVIEWABLE_ROUTES.map((r) => r.path);

export default function MobileApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedPreview = searchParams.get('preview');
  const preview = PREVIEWABLE_PATHS.includes(requestedPreview) ? requestedPreview : '/';

  useEffect(() => {
    if (requestedPreview !== preview) {
      setSearchParams({ preview }, { replace: true });
    }
  }, [requestedPreview, preview, setSearchParams]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to desktop
        </button>
        <span className="text-sm font-medium text-foreground">TravelZero Mobile Preview</span>
      </header>

      <div className="flex justify-center border-b border-border bg-muted/40 py-3">
        <Tabs value={preview} onValueChange={(value) => setSearchParams({ preview: value })}>
          <TabsList>
            {PREVIEWABLE_ROUTES.map(({ path, label }) => (
              <TabsTrigger key={path} value={path}>
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 items-center justify-center bg-neutral-900 p-6">
        <PhoneFrame src={`${window.location.origin}${preview}`} />
      </div>
    </div>
  );
}
