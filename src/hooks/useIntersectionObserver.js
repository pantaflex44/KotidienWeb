import { useEffect, useRef, useState } from "react";

function useIntersectionObserver(options = { root: null, rootMargin: "0px", threshold: 1.0 }) {
    const containerRef = useRef();
    const [isVisible, setIsVisible] = useState(false);

    const callback = (entries, observer) => {
        entries.map((entry) => {
            if (entry.target === containerRef.current) setIsVisible(entry.isIntersecting);
        });
    };

    useEffect(() => {
        const observer = new IntersectionObserver(callback, options);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            if (containerRef.current) observer.unobserve(containerRef.current);
        };
    }, [window, containerRef, options]);

    return [containerRef, isVisible];
}

export default useIntersectionObserver;
