import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useNavigate } from "react-router";
import { cn } from "./ui/utils";
import { getActiveBanners } from "@/lib/api/banners";
import type { Banner } from "@/lib/database.types";
import { ImageWithFallback } from "./figma/ImageWithFallback";

const AUTOPLAY_DELAY = 3000;

const BannerCarousel = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: AUTOPLAY_DELAY, stopOnInteraction: false }),
  ]);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const data = await getActiveBanners();
        setBanners(data);
      } catch {
        // API failure: use empty state
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  // Track selected slide
  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  // Handle banner tap navigation
  const handleBannerClick = (banner: Banner) => {
    switch (banner.link_type) {
      case "routine":
        navigate(`/product/${banner.link_target}`);
        break;
      case "category":
        navigate(`/search?category=${encodeURIComponent(banner.link_target)}`);
        break;
      case "challenge":
        navigate(`/challenge/${banner.link_target}`);
        break;
      case "external":
        window.open(banner.link_target, "_blank", "noopener,noreferrer");
        break;
    }
  };

  // Handle indicator tap
  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  if (loading) {
    return (
      <div className="w-full aspect-[2/1] rounded-2xl bg-white/5 animate-pulse mb-6" />
    );
  }

  if (banners.length === 0) return null;

  return (
    <div className="relative mb-6">
      {/* Carousel viewport */}
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className="flex-[0_0_100%] min-w-0"
            >
              <button
                type="button"
                className="relative w-full aspect-[2/1] overflow-hidden cursor-pointer bg-transparent border-none p-0 block"
                onClick={() => handleBannerClick(banner)}
                aria-label={`${banner.title} - ${banner.subtitle}`}
              >
                <ImageWithFallback
                  src={banner.image_url}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                />
                {/* Gradient overlay + text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <h3 className="text-white text-lg font-bold leading-tight mb-1">
                    {banner.title}
                  </h3>
                  {banner.subtitle && (
                    <p className="text-white/70 text-sm">{banner.subtitle}</p>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-3">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300 border-none cursor-pointer p-0",
                index === selectedIndex
                  ? "bg-[#13d680] w-5 shadow-[0_0_8px_rgba(19,214,128,0.60)]"
                  : "bg-white/25 hover:bg-white/40"
              )}
              onClick={() => scrollTo(index)}
              aria-label={`${index + 1}/${banners.length} 배너로 이동`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BannerCarousel;
