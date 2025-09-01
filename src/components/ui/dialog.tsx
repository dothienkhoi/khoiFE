"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Overlay>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            "fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            className
        )}
        style={{ zIndex: 9998 }}
        {...props}
    />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
    // Use useLayoutEffect to ensure stable positioning
    React.useLayoutEffect(() => {
        const content = document.querySelector('[data-radix-dialog-content]');
        if (content) {
            // Force stable positioning
            (content as HTMLElement).style.position = 'fixed';
            (content as HTMLElement).style.left = '50%';
            (content as HTMLElement).style.top = '50%';
            (content as HTMLElement).style.transform = 'translate(-50%, -50%)';
            (content as HTMLElement).style.zIndex = '9999';
            (content as HTMLElement).style.animation = 'none';
            (content as HTMLElement).style.transition = 'none';
        }

        // Set up MutationObserver to monitor for positioning changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const content = document.querySelector('[data-radix-dialog-content]');
                    if (content) {
                        // Re-apply stable positioning if it was changed
                        (content as HTMLElement).style.position = 'fixed';
                        (content as HTMLElement).style.left = '50%';
                        (content as HTMLElement).style.top = '50%';
                        (content as HTMLElement).style.transform = 'translate(-50%, -50%)';
                        (content as HTMLElement).style.zIndex = '9999';
                        (content as HTMLElement).style.animation = 'none';
                        (content as HTMLElement).style.transition = 'none';
                    }
                }
            });
        });

        // Start observing
        if (content) {
            observer.observe(content, {
                attributes: true,
                attributeFilter: ['style'],
                subtree: false
            });
        }

        // Cleanup
        return () => {
            observer.disconnect();
        };
    });

    // Additional effect to continuously ensure positioning
    React.useEffect(() => {
        const interval = setInterval(() => {
            const content = document.querySelector('[data-radix-dialog-content]');
            if (content && (content as HTMLElement).style.position !== 'fixed') {
                // Re-apply stable positioning every 100ms if needed
                (content as HTMLElement).style.position = 'fixed';
                (content as HTMLElement).style.left = '50%';
                (content as HTMLElement).style.top = '50%';
                (content as HTMLElement).style.transform = 'translate(-50%, -50%)';
                (content as HTMLElement).style.zIndex = '9999';
                (content as HTMLElement).style.animation = 'none';
                (content as HTMLElement).style.transition = 'none';
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                ref={ref}
                className={cn(
                    "fixed left-[50%] top-[50%] z-[9999] grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
                    className
                )}
                style={{
                    zIndex: 9999,
                    transform: 'translate(-50%, -50%)',
                    position: 'fixed',
                    left: '50%',
                    top: '50%',
                    animation: 'none',
                    transition: 'none',
                    willChange: 'auto'
                }}
                {...props}
            >
                {children}
                <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
});
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col space-y-1.5 text-center sm:text-left",
            className
        )}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn(
            "text-lg font-semibold leading-none tracking-tight",
            className
        )}
        {...props}
    />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
    Dialog,
    DialogPortal,
    DialogOverlay,
    DialogClose,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}


