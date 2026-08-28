"use client";

import Image from "next/image";
import { useState } from "react";

import styles from "./holiday-card.module.css";

interface HolidayImageProps {
  src?: string;
  alt: string;
}

export function HolidayImage({ src, alt }: HolidayImageProps) {
  const [hasError, setHasError] = useState(false);

  /**
   * If the fixture does not contain an image, or the fixture image
   * cannot be loaded, show the existing card fallback instead.
   */
  if (!src || hasError) {
    return (
      <div
        className={styles.imageFallback}
        role="img"
        aria-label={`${alt} image unavailable`}
      >
        <span aria-hidden="true">🏨</span>
      </div>
    );
  }

  /**
   * Keep using the image URL supplied by the fixture.
   *
   * `unoptimized` is intentional here because the fixture uses
   * example.test URLs which are not available to Next.js' image
   * optimization server.
   */
  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      sizes="(max-width: 800px) 100vw, 33vw"
      className={styles.image}
      onError={() => setHasError(true)}
    />
  );
}
