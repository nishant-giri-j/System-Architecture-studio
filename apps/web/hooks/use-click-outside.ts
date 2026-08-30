import { useEffect, useRef, type RefObject } from "react";

/**
 * Calls `onClose` when the user clicks outside the referenced element.
 * Ignores clicks on elements with data-click-outside-ignore.
 */
export function useClickOutside<T extends HTMLElement>(
    isOpen: boolean,
    onClose: () => void,
): RefObject<T | null> {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        const handler = (e: PointerEvent) => {
            if (
                ref.current &&
                !ref.current.contains(e.target as Node) &&
                !(e.target as HTMLElement)?.closest?.("[data-click-outside-ignore]")
            ) {
                onClose();
            }
        };

        // Use a short delay so the opening click doesn't immediately close it
        const timer = setTimeout(() => {
            document.addEventListener("pointerdown", handler);
        }, 0);

        return () => {
            clearTimeout(timer);
            document.removeEventListener("pointerdown", handler);
        };
    }, [isOpen, onClose]);

    return ref;
}
