import { controller, inject, mapping, param } from "../ioc.config";
import { GithubApi } from "../components/GithubApi";
import { escapePath } from "@ra2inier/core/node";
import { Config, Reference } from "@ra2inier/core";
import { FrontLogger } from "~/ioc/frontEnd";

@controller('download')
export class DownloadServ {

   @inject('api::github') declare api: GithubApi
   @inject('app-config') declare appConfig: Config
   @inject('front-logger') declare private frontLogger: FrontLogger

   /**
    * 传入一组Reference对象，下载这些包
    */
   @mapping('remote-package')
   async downloadRemotePackage(@param('data') refers: Reference[]) {
      refers = refers.filter(x => !!x.url)
      const ret: Reference[] = []
      const dir = escapePath(this.appConfig.GLOBAL_PACKAGE_CACHE)
      for (const refer of refers) {
         const path = escapePath(this.appConfig.GLOBAL_PACKAGE_CACHE, refer.name || Math.random().toString())
         let tmp
         tmp = await this.api.downloadPackage(refer.url, path, (e) => {
            console.log(e)
            this.frontLogger.info(e.progress + '')
         })
         if (tmp) ret.push(refer)
      }
      return ret
   }

   @mapping('')
   async download() {

   }
}
