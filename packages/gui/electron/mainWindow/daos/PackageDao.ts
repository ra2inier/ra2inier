import fs from 'node:fs';
import { join } from 'node:path';

import { component, final, inject, task } from '~/mainWindow/ioc.config';

import {
  Config, enhance, forIn, fromRaw, IniObject,
  Mapper, MapperDto, Markdown, Package, PackageVo,
  Scope, WordDto, WordRo, WordVo,
} from '@ra2inier/core';
import { escapePath, forDir, readJson } from '@ra2inier/core/node';

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

   readPackageInfoByPath(pkgPath: string) {
      let pkg = fromRaw(readJson(join(pkgPath, this.config.PACKAGE_INFO_FILE)), Package)
      if ((pkg.path += '').startsWith('~')) {
         let path = pkg.path.replace('~', this.config.PACKAGE_LINK_BASEURL)
         path = escapePath(this.appConfig.CWD, path)
         pkg = fromRaw(readJson(path), Package)
         pkg.path = path
      } else {
         pkg.path = pkgPath
      }
      return pkg
   }

   readPackageByPath(pkgPath: string) {
      const pkg = this.readPackageInfoByPath(pkgPath)
      const tmp: PackageVo = enhance(pkg, {
         objects: this.readObjectsByPath(pkgPath),
         scopes: this.readScopesByPath(pkgPath),
         dictionary: this.readWordsByPath(pkgPath),
         mappers: this.readMappersByPath(pkgPath),
      })
      return tmp
   }

   writePackageByPath(pkgPath: string,) {
      throw Error('没有实现')
   }

   // 读写object逻辑
   // object的key值：object的文件路径
   objectsPathMap: Record<string, string> = {}
   readObjectsByPath(pkgPath: string) {
      const objects: Record<string, IniObject> = {}
      const objectDir = escapePath(pkgPath, this.config.OBJECT_DIR)
      forDir(objectDir, (objPath) => {
         // const tmp = fromRaw(readJson(objPath), IniObject)
         // this.objectsPathMap[tmp.key] = objPath
         // objects[tmp.key] = tmp
         const tmp = this.objectDao.readObjectByPath(objPath)
         tmp && (objects[tmp.key] = tmp)
      })
      return objects
   }

   writeObjectByPath(pkgPath: string, object: IniObject) {
      const objectPath = this.objectsPathMap[object.key] ||
         escapePath(pkgPath, this.config.OBJECT_DIR, object.key)
      // writeJson(objectPath, object)
      this.objectDao.writeObjectByPath(objectPath, object)
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
