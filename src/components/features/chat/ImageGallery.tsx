"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, Download, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageGalleryProps {
    images: Array<{
        url: string;
        name: string;
        type?: string;
    }>;
    className?: string;
}

export function ImageGallery({ images, className }: ImageGalleryProps) {
    const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const openLightbox = (index: number) => {
        setSelectedImageIndex(index);
        setIsLightboxOpen(true);
    };

    const closeLightbox = () => {
        setIsLightboxOpen(false);
        setSelectedImageIndex(null);
    };

    const nextImage = () => {
        if (selectedImageIndex !== null) {
            setSelectedImageIndex((selectedImageIndex + 1) % images.length);
        }
    };

    const prevImage = () => {
        if (selectedImageIndex !== null) {
            setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowRight') {
            nextImage();
        } else if (e.key === 'ArrowLeft') {
            prevImage();
        }
    };

    // Render different layouts based on number of images
    const renderImageGrid = () => {
        if (images.length === 1) {
            return (
                <div className="relative group cursor-pointer">
                    <img
                        src={images[0].url}
                        alt={images[0].name}
                        className="max-w-xs max-h-64 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        onClick={() => openLightbox(0)}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                </div>
            );
        }

        if (images.length === 2) {
            return (
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative group cursor-pointer">
                        <img
                            src={images[0].url}
                            alt={images[0].name}
                            className="max-w-xs max-h-32 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(0)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="relative group cursor-pointer">
                        <img
                            src={images[1].url}
                            alt={images[1].name}
                            className="max-w-xs max-h-32 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(1)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            );
        }

        if (images.length === 3) {
            return (
                <div className="grid grid-cols-3 gap-2">
                    <div className="relative group cursor-pointer">
                        <img
                            src={images[0].url}
                            alt={images[0].name}
                            className="max-w-xs max-h-24 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(0)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="relative group cursor-pointer">
                        <img
                            src={images[1].url}
                            alt={images[1].name}
                            className="max-w-xs max-h-24 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(1)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <div className="relative group cursor-pointer">
                        <img
                            src={images[2].url}
                            alt={images[2].name}
                            className="max-w-xs max-h-24 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(2)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                    </div>
                </div>
            );
        }

        if (images.length === 4) {
            return (
                <div className="grid grid-cols-2 gap-2">
                    <div className="relative group cursor-pointer">
                        <img
                            src={images[0].url}
                            alt={images[0].name}
                            className="max-w-xs max-h-32 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(0)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="relative group cursor-pointer">
                        <img
                            src={images[1].url}
                            alt={images[1].name}
                            className="max-w-xs max-h-32 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(1)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="relative group cursor-pointer">
                        <img
                            src={images[2].url}
                            alt={images[2].name}
                            className="max-w-xs max-h-32 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(2)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <div className="relative group cursor-pointer">
                        <img
                            src={images[3].url}
                            alt={images[3].name}
                            className="max-w-xs max-h-32 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(3)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            );
        }

        // For 5+ images, show first 4 with overlay for remaining
        return (
            <div className="grid grid-cols-2 gap-2">
                {images.slice(0, 4).map((image, index) => (
                    <div key={index} className="relative group cursor-pointer">
                        <img
                            src={image.url}
                            alt={image.name}
                            className="max-w-xs max-h-32 object-contain rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            onClick={() => openLightbox(index)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                        {index === 3 && images.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">+{images.length - 4}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <div className={cn("w-full max-w-md", className)}>
                {renderImageGrid()}
            </div>

            {/* Lightbox */}
            <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-black/95 border-0">
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        onKeyDown={handleKeyDown}
                        tabIndex={0}
                    >
                        {/* Close button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={closeLightbox}
                            className="absolute top-4 right-4 z-50 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                        >
                            <X className="h-5 w-5" />
                        </Button>

                        {/* Navigation buttons */}
                        {images.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-50 h-12 w-12 p-0 bg-black/50 hover:bg-black/70 text-white border-0"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </Button>
                            </>
                        )}

                        {/* Image */}
                        {selectedImageIndex !== null && (
                            <div className="relative w-full h-full flex items-center justify-center p-4">
                                <img
                                    src={images[selectedImageIndex].url}
                                    alt={images[selectedImageIndex].name}
                                    className="max-w-full max-h-full object-contain"
                                />

                                {/* Image info */}
                                <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-3 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium truncate">
                                            {images[selectedImageIndex].name}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-300">
                                                {selectedImageIndex + 1} / {images.length}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => window.open(images[selectedImageIndex].url, '_blank')}
                                                className="h-8 w-8 p-0 bg-white/20 hover:bg-white/30 text-white border-0"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Thumbnail navigation */}
                        {images.length > 1 && (
                            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2">
                                {images.map((image, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={cn(
                                            "w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200",
                                            selectedImageIndex === index
                                                ? "border-white scale-110"
                                                : "border-white/30 hover:border-white/60"
                                        )}
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

