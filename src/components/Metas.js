import React, { createContext } from "react";
import { Helmet } from "react-helmet";

import packagejson from "../../package.json";

export const MetasContext = createContext();

export const MetasProvider = ({ children }) => {
    return (
        <MetasContext.Provider
            value={{
                title: packagejson.name.trim().capitalize(),
                description: packagejson.description.trim(),
                lang: packagejson.i18n.defaultLocale.trim()
            }}
        >
            {children}
        </MetasContext.Provider>
    );
};

const Metas = ({ title = null, description = null, lang = null, children }) => {
    return (
        <MetasContext.Consumer>
            {(value) => (
                <>
                    <Helmet htmlAttributes={{ lang: lang ?? value.lang }}>
                        <title>{(title ? title + " - " : "") + value.title}</title>
                        <meta name="description" content={description ?? value.description} />
                        <meta name="keywords" content={packagejson.keywords.join(", ")} />
                        <meta httpEquiv="content-language" content={lang ?? value.lang} />
                        <meta name="author" content={packagejson.author.name.trim()} />
                        <meta name="generator" content={packagejson.name.trim().capitalize()} />
                        <meta name="publisher" content={packagejson.author.name.trim()} />
                    </Helmet>
                    {children}
                </>
            )}
        </MetasContext.Consumer>
    );
};

export default Metas;
