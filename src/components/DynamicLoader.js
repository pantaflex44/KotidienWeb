import React, { useEffect, useMemo, lazy } from "react";

const componentsMap = new Map();

function useCachedComponents(component) {
    if (componentsMap.has(component)) return componentsMap.get(component);

    const LazyComponent = lazy(() => import(`./${component}.js`));
    componentsMap.set(component, LazyComponent);

    return LazyComponent;
}

function DynamicLoader({ component, ...props }) {
    if (!component) return null;

    useEffect(() => () => {
        if (component) componentsMap.delete(component);
    }, []);

    try {
        const LazyComponent = useMemo(() => useCachedComponents(component), [component, props]);

        return <LazyComponent {...props} />;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export default DynamicLoader;
