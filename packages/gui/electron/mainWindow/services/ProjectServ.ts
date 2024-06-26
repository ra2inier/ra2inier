import { existsSync, readdirSync } from 'node:fs';

import config from '~/boot/config';
import {
	controller, inject, mapping, param, pathVar,
	task,
} from '~/mainWindow/ioc.config';

import {
	Config, fromRaw, IniObject, isUniqueObject, MapperDto,
	Package, PackageVo, Project, ProjectDto, ProjectInfoDto, ProjectVo,
	Reference,
	ReferenceWithPath,
	Scope, ScopeDto, UniqueObject, WordDto,
} from '@ra2inier/core';
import { escapePath } from '@ra2inier/core/node';

import { PackageDao } from '../daos/PackageDao';
import { ProjectDao } from '../daos/ProjectDao';
import { StaticDao } from '../daos/StaticDao';

/**
 * project service
 * 处理关于项目处理相关的业务逻辑
 */
@controller('project')
export class ProjServ {
	@inject('project-dao') declare projectDao: ProjectDao
	@inject('package-dao') declare packageDao: PackageDao
	@inject('app-config') declare appConfig: Config
	@inject('static-dao') declare private staticDao: StaticDao

	// 项目的文件路径
	#path = ''
	get path() { return this.#path }

	@mapping('check-path')
	checkPath(@param('data') path: string) {
		return this.projectDao.checkPath(path)
	}

	/**
	 * 项目缓存逻辑，减少重复读盘的次数
	 * ProjectPath : Project
	 */
	#projectCacheMap: Record<string, ProjectVo> = {}

	/**
	 * 返回当前项目的主包
	 */
	get main(): PackageVo | undefined {
		const current = this.#projectCacheMap[this.path]
		return current && current.packages[current.main]
	}

	/**
	 * 每隔3分钟清理一次项目缓存
	 */
	@task(config.IS_DEV ? 3 : 60 * 3)
	@mapping('clear-cache')
	clearCache() {
		for (const path in this.#projectCacheMap) {
			delete this.#projectCacheMap[path]
		}
	}

	/**
	 * @param projectPath 项目文件夹的路径
	 * @returns 返回项目文件所有数据
	 */
	@mapping('open')
	openProject(@param('path') projectPath: string) {
		const path = escapePath(projectPath || this.appConfig.PROJECT_PATH)
		if (!this.projectDao.checkPath(path)) throw Error('该项目路径可能是错误的：' + path)
		this.#path = path
		if (path in this.#projectCacheMap) return this.#projectCacheMap[path]
		this.appConfig.setByKey('PROJECT_PATH', path)
		const project = this.projectDao.readProjectInfo(path)
		this.appConfig.addProjectHistory(projectPath)
		return this.#projectCacheMap[path] = this.projectDao.resolveProjectVo(project, path)
	}

	@mapping('new')
	newProject(@param('info') info: ProjectInfoDto) {
		const newProjectPath = escapePath(info.path)
		const isExist = existsSync(newProjectPath)
		if (isExist) {
			const dirent = readdirSync(newProjectPath)
			if (dirent.length != 0) throw Error('新项目文件夹应当为空文件夹')
		}

		this.appConfig.addProjectHistory(newProjectPath)
		const project = fromRaw(info, Project)
		const pkg = fromRaw(info.main, Package)

		// TODO: 为pkg添加更多属性


		this.projectDao.writeProjectInfoByPath(project, newProjectPath)
		this.packageDao.writePackageInfoByPath(pkg, newProjectPath)
		return this.openProject(newProjectPath)
	}

	@mapping('save')
	saveProject(@param('data') project: ProjectDto) {
		this.projectDao.writeProjectInfoByPath(fromRaw(project, Project), this.path)
		this.packageDao.writePackageInfoByPath(fromRaw(project.main, Package), this.path)
		// TODO: 更多的保存任务

		return true
	}

	@mapping('save-pkginfo')
	saveProjectInfo(@param('pkg') pkgInfo: Package, @param('project') projectInfo: Project) {
		this.projectDao.writeProjectInfoByPath(fromRaw(projectInfo, Project), this.path)
		this.packageDao.writePackageInfoByPath(fromRaw(pkgInfo, Package), this.path)

		return true
	}

	@mapping('add-refer')
	addReference(@param('data') refer: Reference[]) {
		if (refer.length <= 0) return


		// TODO: 远程添加
	}

	@mapping('load-package')
	loadPackages(@param('data') refers: ReferenceWithPath[]) {
		const packages: Record<string, PackageVo> = {}
		const locals = this.staticDao.readGlobalPackages()
		for (const refer of refers || []) {
			let path = refer.path
			if (refer.key in locals) {
				path = locals[refer.key].path
			}
			const pkg = this.packageDao.readPackageByPath(path)
			if (pkg) packages[UniqueObject.getKey(pkg)] = pkg
		}
		return packages
	}

	@mapping('output')
	output(@param('outputPath') path: string, @param('data') data: any) {
		console.log(data)
		path = escapePath(config.OUTPUT_DIR, path)
		this.projectDao.writeBuildResult(path, data)
	}

	// object相关的内容
	/**
	 * @param key 需要更新的对象的key值
	 * @param object 新值
	 */
	@mapping('save-object')
	saveObject(@pathVar key: string, @param('data') object: Record<string, string>) {
		if (!isUniqueObject(object)) throw Error('保存失败：对象不合法')
		const newOne = fromRaw(object, IniObject)
		this.updateObject(key, newOne)
	}

	updateObject(key: string, object: IniObject) {
		if (!this.path) throw Error('请打开一个项目')
		this.packageDao.deleteObjectByPath(this.path, key)
		if (this.main) {
			const objects = this.main.objects
			delete objects[key]
			objects[object.key] = object
		}
		this.packageDao.writeObjectByPath(this.path, object)
	}

	@mapping('delete-object')
	delObject(@pathVar key: string) {
		if (!this.packageDao.deleteObjectByPath(this.path, key))
			throw Error('删除失败')
	}

	// scope相关的内容
	@mapping('save-scope')
	saveScope(@param('data') object: ScopeDto) {
		if (!isUniqueObject(object)) throw Error('保存失败：对象类型不合法')
		const newOne = fromRaw(object, Scope)
		this.packageDao.writeScopeByPath(this.path, newOne)
	}

	// word相关的内容
	@mapping('save-word')
	saveWord(@param('data') object: WordDto) {
		if (!isUniqueObject(object)) throw Error('保存失败：词条不合法')
		const newOne = fromRaw(object, WordDto)
		this.packageDao.writeWordByPath(this.path, newOne)
	}

	@mapping('save-mapper')
	saveMapper(@param('data') mapper: MapperDto) {
		if (!isUniqueObject(mapper)) throw Error('保存失败：输出器不合法')
		const newOne = fromRaw(mapper, MapperDto)
		this.packageDao.writeMappersByPath(this.path, newOne)
	}

}
