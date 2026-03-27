import { HtmlDictPlugin } from '../../interface/IPlugin'
import { NetworktestView } from './View'
import { DictSearchResult } from '../helpers'

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
}
