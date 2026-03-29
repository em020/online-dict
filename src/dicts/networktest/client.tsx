import React from 'react'
import ReactDOM from 'react-dom'
import { NetworktestView } from './View'

function getQueryParam(name: string): string | null {
    const script = document.currentScript as HTMLScriptElement
    if (!script || !script.src) return null
    const match = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)').exec(script.src)
    if (!match) return null
    if (!match[2]) return ''
    return decodeURIComponent(match[2].replace(/\+/g, ' '))
}

const uuid = getQueryParam('id')
if (uuid) {
    const dataEl = document.getElementById('eudic-hydrate-data-' + uuid)
    const rootEl = document.getElementById('eudic-hydrate-root-' + uuid)
    if (dataEl && rootEl) {
        const data = JSON.parse(dataEl.textContent || '{}')
        ReactDOM.hydrate(
            React.createElement(NetworktestView, { result: data }),
            rootEl
        )
    }
}
