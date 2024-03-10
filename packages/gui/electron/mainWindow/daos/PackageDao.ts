import fs from 'node:fs';
import { join } from 'node:path';

import { component, final, inject, task } from '~/mainWindow/ioc.config';

import {
  Config, enhance, forIn, fromRaw, IniObject,
  isEmptyObject, Mapper, MapperDto, Markdown, Package,
  PackageVo, Scope, WordDto, WordRo, WordVo,
} from '@ra2inier/core';
import { escapePath, forDir, readJson, writeJson } from '@ra2inier/core/node';

import { DaoConfig } from './DaoConfig';
import { MapperDao } from './MapperDao';
import { MarkdownDao } from './MarkdownDao';
import { ObjectDao } from './ObjectDao';
import { ScopeDao } from './ScopeDao';
import { WordDao } from './WordDao';

@component("package-dao")
export class PackageDao {
   @inject('dao-config') declare config: DaoConfig
   @inject('app-config') declare appConfig: Config
   @inject('scope-dao') declare scopeDao: ScopeDao
   @inject('word-dao') declare wordDao: WordDao
   @inject('markdown-dao') declare markdownDao: MarkdownDao
   @inject('mapper-dao') declare mapperDao: MapperDao
   @inject('object-dao') declare objectDao: ObjectDao

   /**
    * 读取一个项目文件夹的Info文件，返回一个package的基础信息
    * 如果是一相对链接，则读取相对链接处的包
    */
   readPackageInfoByPath(pkgPath: string) {
      const info = readJson(join(pkgPath, this.config.PACKAGE_INFO_FILE))
      if (isEmptyObject(info)) return undefined
      let pkg = fromRaw(info, Package)
      if ((pkg.path += '').startsWith('~')) {
         let path = pkg.path.replace('~', this.appConfig.GLOBAL_PACKAGE_DIR)
         path = escapePath(this.appConfig.CWD, path)
         const info = readJson(escapePath(path, this.config.PACKAGE_INFO_FILE))
         if (isEmptyObject(info)) return undefined
         pkg = fromRaw(info, Package)
         pkg.path = path
      } else {
         pkg.path = pkgPath
      }
      return pkg
   }

   /**
    * 读取一个package文件夹下的全部引用
    */
   resolveReferences(pkgPath: string) {
      // 读取packages目录
      const referPath = escapePath(pkgPath, this.config.REFERENCE_DIR)
      // 读取引用的包
      const references: Record<string, Package> = {}
      forDir(referPath, (path) => {
         const pkg = this.readPackageInfoByPath(path)
         pkg && (references[pkg.key] = pkg)
      }, false)
      return references
   }

   /**
    * 直接读取一个项目文件夹，将其变为PackageVo对象，不涉及引用的读取
    */
   readPackageByPath(pkgPath: string) {
      const pkg = this.readPackageInfoByPath(pkgPath)
      if (!pkg) return undefined
      const tmp: PackageVo = enhance(pkg, {
         objects: this.readObjectsByPath(pkgPath),
         scopes: this.readScopesByPath(pkgPath),
         dictionary: this.readWordsByPath(pkgPath),
         mappers: this.readMappersByPath(pkgPath),
      })
      return tmp
   }

   writePackageInfoByPath(pkg: Package, pkgPath: string) {
      const infoPath = escapePath(pkgPath, this.config.PACKAGE_INFO_FILE)
      writeJson(infoPath, pkg)
   }

   writePackageByPath(pkg: Package, pkgPath: string,) {
      this.writePackageInfoByPath(pkg, pkgPath)

   }

   // 读写object逻辑
   // object的key值：object的文件路径
   objectsPathMap: Record<string, string> = {}
   readObjectsByPath(pkgPath: string) {
      const objects: Record<string, IniObject> = {}
      const objectDir = escapePath(pkgPath, this.config.OBJECT_DIR)
      forDir(objectDir, (objPath) => {
         const tmp = this.objectDao.readObjectByPath(objPath)
         tmp && (objects[tmp.key] = tmp)
      })
      return objects
   }

   writeObjectByPath(pkgPath: string, object: IniObject) {
      const objectPath = this.objectsPathMap[object.key] ||
         escapePath(pkgPath, this.config.OBJECT_DIR, object.key)
      return this.objectDao.writeObjectByPath(objectPath, object)
   }

   deleteObjectByPath(pkgPath: string, key: string) {
      const path = this.objectsPathMap[key]
      if (path && path.startsWith(escapePath(pkgPath))) {
         fs.rmSync(path)
         delete this.objectsPathMap[key]
         return true
      }
      return false
   }

   // scope的读写逻辑
   // scope的缓存机制，每改6次，只写一次盘
   // 路径：
   scopesPathMap: Record<string, Record<string, Scope>> = {}
   scopeCount = 0
   readScopesByPath(pkgPath: string) {
      const file = escapePath(pkgPath, this.config.SCOPE_FILE)
      if (this.scopesPathMap[file])
         return this.scopesPathMap[file]
      const res = this.scopeDao.readScopesByPath(file)
      return this.scopesPathMap[file] = res
   }

   writeScopeByPath(pkgPath: string, scope: Scope) {
      const file = escapePath(pkgPath, this.config.SCOPE_FILE)
      const scopes = this.scopesPathMap[file]
      scopes[scope.key] = scope
      if (this.scopeCount++ > 6) {
         this.scopeDao.writeScopesByPath(file, scopes)
         this.scopeCount = 0
      }
   }

   @task(60 * 3)
   @final
   writeScopesCache() {
      forIn(this.scopesPathMap, (key, val) => {
         this.scopeDao.writeScopesByPath(key, val)
      })
   }

   // word和字典相关的逻辑
   readWordsByPath(pkgPath: string) {
      const dictPath = escapePath(pkgPath, this.config.DICT_DIR)
      const words: Record<string, WordVo> = {}
      // 遍历字典
      forDir(dictPath, (dictPath, dirent) => {
         // 遍历字典里的每一个word文件夹
         forDir(dictPath, (wordDir) => {
            const word = <WordRo>this.wordDao.readWordByPath(wordDir)
            if (!word) return
            word.detail = this.markdownDao.touch(escapePath(wordDir, this.config.WORD_DETAIL_FILE))
            words[word.key] = word
         }, false)
      }, false)
      return words
   }

   private wordDir(pkgPath: string, word: WordDto) {
      return escapePath(
         pkgPath,
         this.config.DICT_DIR,
         word.dictionary ?? 'custom',
         word.key
      )
   }

   writeWordByPath(pkgPath: string, word: WordDto) {
      // 保存markdown文件
      const dir = this.wordDir(pkgPath, word)
      if (word.markdown) {
         const md = fromRaw(word.markdown, Markdown), mdKey = md.key
         const mdPath = dir + '/' + this.config.WORD_DETAIL_FILE
         if (!this.markdownDao.hasKey(mdKey)) this.markdownDao.add(mdPath, md)
         this.markdownDao.writeMarkdownByPath(mdPath, md)
      }
      // 保存word本身
      this.wordDao.writeWordByPath(dir, word)
      return true
   }


   // Mapper相关的逻辑
   // 包路径：结果
   mappersPathMap: Record<string, Record<string, Mapper>> = {}
   mapperCacheCount = 0
   readMappersByPath(pkgPath: string) {
      const path = escapePath(pkgPath, this.config.MAPPER_DIR)
      if (path in this.mappersPathMap) return this.mappersPathMap[path]
      return this.mappersPathMap[path] = this.mapperDao.readMappersByPath(path)
   }

   writeMappersByPath(pkgPath: string, mapper: MapperDto) {
      pkgPath = escapePath(pkgPath, this.config.MAPPER_DIR)
      this.mappersPathMap[pkgPath][mapper.key] = fromRaw(mapper, Mapper)
      if (this.mapperCacheCount++ > 6) {
         this.writeMapperCache()
         this.mapperCacheCount = 0
      }
   }

   @task(60 * 3)
   @final
   writeMapperCache() {
      forIn(this.mappersPathMap, (path, mappers) => {
         this.mapperDao.writeMappersByPath(path, mappers)
      })
   }
}
