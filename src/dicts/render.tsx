import { ViewPorps } from '../interface/IDictResult'
import React from 'react'
import ReactDOMServer from 'react-dom/server'

export interface HydrateOptions {
    pluginName: string
}

export function renderReactToString<T>(ViewItem: React.FC<ViewPorps<T>>, doc: T, uuid: string, hydrateOptions?: HydrateOptions) {
    const element: JSX.Element = <ViewItem result={doc} />
    const htmlResult = ReactDOMServer.renderToStaticMarkup(element)
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = htmlResult
    //替换全部a链接
    const allATagList = tempDiv.getElementsByTagName('a')
    for (const tagItem of allATagList) {
        if (tagItem.className === 'eudic-onlinedict-Speaker') {
            tagItem.href = `audio:${tagItem.href}`
        } else {
            tagItem.href = `dic://${tagItem.textContent}`
        }
    }
    const elementInnerHtml = tempDiv.innerHTML

    if (hydrateOptions) {
        const escapedJson = JSON.stringify(doc).replace(/</g, '\\u003c').replace(/<\/script/g, '\\u003c/script')
        return `
    <div id="eudic-onlinedict-section-${uuid}">
        <link rel="stylesheet" href="file://index.css" />
        <script defer src="file://index.js" charset="utf-8" type="text/javascript"></script>
        <script defer src="file://dict.js?id=${uuid}" charset="utf-8" type="text/javascript"></script>
        <div id="eudic-hydrate-root-${uuid}">
        ${elementInnerHtml}
        </div>
        <script id="eudic-hydrate-data-${uuid}" type="application/json">${escapedJson}</script>
        <script defer src="file://client.js?id=${uuid}" charset="utf-8" type="text/javascript"></script>
    </div>
    `
    }

    return `
    <div id="eudic-onlinedict-section-${uuid}">
        <link rel="stylesheet" href="file://index.css" />
        <script defer src="file://index.js" charset="utf-8" type="text/javascript"></script>
        <script defer src="file://dict.js?id=${uuid}" charset="utf-8" type="text/javascript"></script>
        ${elementInnerHtml}
    </div>
    `
}
