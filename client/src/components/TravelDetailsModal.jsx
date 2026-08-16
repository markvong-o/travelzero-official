import React, { useEffect } from 'react';
import { Plane, Building2, DollarSign, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '../context/AuthContext';
import { useBanner } from '../context/BannerContext';
import { trackView, meetsViewThreshold, hasSeenBanner, markBannerSeen } from '../lib/view-tracking';
import s from './TravelDetailsModal.module.css';

// Shared modal for both flight and hotel details — the "photo + details +
// close" chrome is identical between the two, only the field set differs.
// Opening it is also the trigger point for the anonymous-conversion view
// counter: every open counts as a "view" of that item's destination, and
// once the threshold is crossed (and the banner hasn't already been shown
// this session), the signup incentive banner appears.
export function TravelDetailsModal({ item, kind, open, onOpenChange }) {
  const { isAnonymous, sessionId } = useAuth();
  const { showBanner } = useBanner();

  useEffect(() => {
    if (!open || !item) return;
    trackView(item.destination, sessionId);
    if (isAnonymous && meetsViewThreshold(item.destination) && !hasSeenBanner()) {
      showBanner();
      markBannerSeen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.id]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={s.content}>
        <div className={s.media} style={{ backgroundImage: `url('${item.imageUrl}')` }} />
        <DialogHeader className={s.header}>
          <DialogTitle>{kind === 'flight' ? `${item.airline} ${item.flightNumber}` : item.name}</DialogTitle>
          <DialogDescription>{item.desc}</DialogDescription>
        </DialogHeader>

        <div className={s.details}>
          {kind === 'flight' ? (
            <>
              <div className={s.row}>
                <Plane size={15} />
                <span>{item.route}</span>
              </div>
              <div className={s.row}>
                <Calendar size={15} />
                <span>{item.outbound} – {item.inbound}</span>
              </div>
              <div className={s.row}>
                <DollarSign size={15} />
                <span>${item.priceUSD} round trip</span>
              </div>
            </>
          ) : (
            <>
              <div className={s.row}>
                <Building2 size={15} />
                <span>{item.location}</span>
              </div>
              <div className={s.row}>
                <Calendar size={15} />
                <span>{item.checkIn} – {item.checkOut}</span>
              </div>
              <div className={s.row}>
                <DollarSign size={15} />
                <span>${item.pricePerNightUSD}/night</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
