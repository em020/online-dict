import { HtmlDictPlugin } from '../../interface/IPlugin'
import { NetworktestView } from './View'
import { DictSearchResult } from '../helpers'
import { HydrateOptions } from '../../dicts/render'
import VConsole from 'vconsole'
import './style.scss'

declare global {
    interface Window {
        __eudicNetworkTestVConsole?: VConsole
    }
}

if (typeof window !== 'undefined' && !window.__eudicNetworkTestVConsole) {
    window.__eudicNetworkTestVConsole = new VConsole()
    // window.__eudicNetworkTestVConsole.hideSwitch()
}

export class NetworktestPlugin extends HtmlDictPlugin {
    async getPageResult(word: string): Promise<any> {
        return { word }
    }

    parsePageResult(pageResult: any, searchWord: string | undefined): DictSearchResult<any> {
        return {
            result: { word: searchWord }
        }
    }

    htmlTemplate() {
        return NetworktestView
    }

    hydrateOptions(): HydrateOptions {
        return { pluginName: 'networktest' }
    }
}
