

import { Package } from "../entity/Package"
import { IniObjectVo, MapperVo, ResourceVo, ScopeVo, WordVo } from "./ObjectVo"



export interface PackageVo extends Package {
   // 辅助属性，在加载时确定
   // 包的路径，

   // 数据信息
   objects: Record<string, IniObjectVo>
   resources: Record<string, ResourceVo>          // 后加载
   extras: Record<string, ResourceVo>             // 后加载

   // 元数据
   scopes: Record<string, ScopeVo>
   mappers: Record<string, MapperVo>              // 后加载
   dictionary: Record<string, WordVo>             // 后加载

   /**
    * 包的本地路径
    */
   path: string
}

export class EMPTY_PACKAGEVO implements Partial<PackageVo>{
   objects = {}
   resources = {}
   extras = {}

   // 元数据
   scopes = {}
   mappers = {}
   dictionary = {}

   /**
    * 包的本地路径
    */
   path: string = ''
}

