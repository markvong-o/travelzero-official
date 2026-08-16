import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { DestinationCard } from '../components/DestinationCard';
import { Button } from '@/components/ui/button';
import s from './Browse.module.css';

const DESTINATIONS = [
  {
    id: 'rome',
    name: 'Rome',
    region: 'Lazio',
    tagline: 'The Eternal City',
    climate: 'Warm & Sunny',
    color: 'rome',
    description:
      'Explore ancient history, iconic architecture, and world-class art in Italy\'s capital. From the Colosseum to the Vatican, Rome is a timeless masterpiece.',
  },
  {
    id: 'amalfi',
    name: 'Amalfi Coast',
    region: 'Campania',
    tagline: 'Cliff-Hanging Views',
    climate: 'Mediterranean',
    color: 'amalfi',
    description:
      'Experience dramatic coastal scenery, charming villages, and fresh seafood along one of Europe\'s most stunning coastlines.',
  },
  {
    id: 'tuscany',
    name: 'Tuscany',
    region: 'Toscana',
    tagline: 'Rolling Hills & Wine',
    climate: 'Warm & Breezy',
    color: 'tuscany',
    description:
      'Discover Renaissance art, rolling vineyards, medieval towns, and authentic Italian cuisine in the heart of Tuscany.',
  },
  {
    id: 'como',
    name: 'Lake Como',
    region: 'Lombardy',
    tagline: 'Alpine Elegance',
    climate: 'Cool & Serene',
    color: 'como',
    description:
      'Relax by Europe\'s deepest lake surrounded by Alpine mountains, charming waterfront towns, and luxury villas.',
  },
  {
    id: 'florence',
    name: 'Florence',
    region: 'Tuscany',
    tagline: 'Renaissance Masterpiece',
    climate: 'Warm & Breezy',
    color: 'rome',
    description:
      'Immerse yourself in Renaissance art at the Uffizi Gallery, cross the Ponte Vecchio, and witness the breathtaking Florence Cathedral.',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Cityscape%20view%20looking%20toward%20cathedral,%20Florence,%20Italy%20LOC%204711374873.jpg?width=800',
  },
  {
    id: 'milan',
    name: 'Milan',
    region: 'Lombardy',
    tagline: 'Fashion & Design',
    climate: 'Cool & Urban',
    color: 'como',
    description:
      'Discover world-class fashion, the iconic Duomo cathedral, and cutting-edge design galleries in Italy\'s vibrant fashion capital.',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Wide%20angle%20Milan%20skyline%20from%20Duomo%20roof.jpg?width=800',
  },
  {
    id: 'cinque-terre',
    name: 'Cinque Terre',
    region: 'Liguria',
    tagline: 'Cliffside Villages',
    climate: 'Temperate & Breezy',
    color: 'amalfi',
    description:
      'Hike between five pastel-colored villages perched on the Italian Riviera cliffs, with stunning views and fresh seafood.',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Coast%20village%20in%20Cinque%20Terre%20.jpg?width=800',
  },
  {
    id: 'capri',
    name: 'Capri',
    region: 'Campania',
    tagline: 'Luxury Island Escape',
    climate: 'Mediterranean',
    color: 'amalfi',
    description:
      'Escape to this exclusive island paradise known for dramatic sea stacks, upscale shopping, and pristine blue waters.',
    imageUrl:
      'https://commons.wikimedia.org/wiki/Special:FilePath/Capri,%20Italy,%20Coast%20of%20Capri%20island.jpg?width=800',
  },
];

export default function Browse() {
  const { user, isAnonymous, addFavorite, removeFavorite, anonFavorites } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const favoritedItems = isAnonymous
    ? (anonFavorites || [])
    : (user?.user_metadata?.favorites || []);
  const favoriteIds = new Set(favoritedItems.map((f) => f.id));

  const handleFavoriteToggle = async (destination, adding) => {
    try {
      if (adding) {
        await addFavorite(destination);
        showToast(`${destination.name} saved to favorites`, 'success');
      } else {
        await removeFavorite(destination.id);
        showToast(`${destination.name} removed from favorites`, 'info');
      }
    } catch {
      showToast('Failed to update favorites', 'error');
    }
  };
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  const touchStartX = useRef(null);
  const carouselRef = useRef(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e) => {
      setIsMobile(e.matches);
      setCarouselIndex(0);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Pointer-based drag handler — works for both mouse (DevTools sim + desktop)
  // and touch (real mobile). Non-passive touchmove lets us preventDefault when
  // the swipe is horizontal so the browser doesn't steal it as a page scroll.
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    let startX = null;
    let startY = null;
    let dragging = false;

    const navigate = (diff) => {
      if (Math.abs(diff) < 40) return;
      if (diff > 0) {
        setCarouselIndex((idx) => {
          const perPage = isMobile ? 1 : 3;
          const page = Math.floor(idx / perPage);
          const total = Math.ceil(DESTINATIONS.length / perPage);
          return page < total - 1 ? (page + 1) * perPage : idx;
        });
      } else {
        setCarouselIndex((idx) => {
          const perPage = isMobile ? 1 : 3;
          const page = Math.floor(idx / perPage);
          return page > 0 ? (page - 1) * perPage : idx;
        });
      }
    };

    // Touch
    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };
    const onTouchMove = (e) => {
      if (startX === null) return;
      const dx = Math.abs(e.touches[0].clientX - startX);
      const dy = Math.abs(e.touches[0].clientY - startY);
      if (dx > dy) e.preventDefault();
    };
    const onTouchEnd = (e) => {
      if (startX === null) return;
      navigate(startX - e.changedTouches[0].clientX);
      startX = null;
      startY = null;
    };

    // Mouse (DevTools simulation + desktop drag)
    const onMouseDown = (e) => {
      startX = e.clientX;
      startY = e.clientY;
      dragging = true;
      el.style.cursor = 'grabbing';
    };
    const onMouseMove = (e) => {
      if (!dragging) return;
      e.preventDefault();
    };
    const onMouseUp = (e) => {
      if (!dragging) return;
      dragging = false;
      el.style.cursor = '';
      navigate(startX - e.clientX);
      startX = null;
    };
    const onMouseLeave = () => {
      dragging = false;
      el.style.cursor = '';
      startX = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('mouseleave', onMouseLeave);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [isMobile]);

  const CARDS_PER_PAGE = isMobile ? 1 : 3;

  const handleBook = (destination) => {
    if (isAnonymous) {
      navigate(`/signup?destination=${destination.id}&returnTo=${encodeURIComponent('/')}`);
    } else {
      showToast('Booking feature coming soon!', 'info');
    }
  };

  const totalPages = Math.ceil(DESTINATIONS.length / CARDS_PER_PAGE);
  const currentPage = Math.floor(carouselIndex / CARDS_PER_PAGE);
  const canGoBack = currentPage > 0;
  const canGoForward = currentPage < totalPages - 1;

  const handleDotClick = (page) => {
    setCarouselIndex(page * CARDS_PER_PAGE);
  };

  const handlePrev = () => {
    if (canGoBack) setCarouselIndex((currentPage - 1) * CARDS_PER_PAGE);
  };

  const handleNext = () => {
    if (canGoForward) setCarouselIndex((currentPage + 1) * CARDS_PER_PAGE);
  };

  const visibleDests = DESTINATIONS.slice(carouselIndex, carouselIndex + CARDS_PER_PAGE);


  return (
    <div className={s.page}>

      <div className={s.hero}>
        <div className={s.heroGlow} />
        <div className={s.heroScrim} />
        <div className={s.heroInner}>
          <span className={s.heroPill}>
            <Sparkles size={14} />
            10,000 bonus points on signup
          </span>
          <h1 className={`font-display ${s.heroTitle}`}>Discover Your Next Italian Adventure</h1>
          <p className={s.heroSubtitle}>
            Explore Italy's most enchanting destinations. Sign up for a free account and unlock
            10,000 loyalty points!
          </p>
        </div>
      </div>

      <main className={s.main}>
        <h2 className={`font-display ${s.sectionTitle}`}>Featured Destinations</h2>
        <div className={s.carouselWrapper} ref={carouselRef}>
          <Button
            size="icon"
            variant="ghost"
            onClick={handlePrev}
            disabled={!canGoBack}
            className={s.carouselArrow}
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className={s.carousel}>
            {visibleDests.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onBook={handleBook}
                isFavorite={favoriteIds.has(dest.id)}
                onFavoriteToggle={handleFavoriteToggle}
              />
            ))}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNext}
            disabled={!canGoForward}
            className={s.carouselArrow}
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
        {totalPages > 1 && (
          <div className={s.dots}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                className={`${s.dot} ${currentPage === i ? s.dotActive : ''}`}
                onClick={() => handleDotClick(i)}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
