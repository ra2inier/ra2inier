import { UniqueObject } from './Obejct';

export class Package extends UniqueObject {
	/**
	 * 目标平台，典型值；ra2、yr、mo3、inier
	 */
	target: string = ''
	/**
	 * 作者   名字 <email> (主页)
	 */
	author: string = ''
	/**
	 * 依赖包的key: reference
	 */
	references: Record<string, Reference> = {}
	/**
	 * 项目加载器版本
	 */
	loaderVersion: string = 'v1'
	/**
	 * 包级别的环境变量
	 */
	envVariable: Record<string, string> = {}
	/**
	 * 包发布的GitHub链接
	 */
	url: string = ''
}

export class Reference {
	/**
	 * 依赖的包名
	 */
	name = ''
	/**
	 * 依赖包的键值
	 */
	key = ''
	/**
	 * 依赖的github仓库
	 */
	url = ''
	/**
	 * 依赖的版本
	 */
	version = 0;

	constructor(r: Partial<Reference> = {}) {
		this.name = r.name || ''
		this.key = r.key || ""
		this.url = r.url || ''
		this.version = r.version || -1
	}

	static toJSON(r: Reference) {
		return [r.name, r.version, r.url].join('\n')
	}

	static parser(key: string, val: string) {
		const ret = val.split('\n')
		return <Reference>{
			name: ret[0],
			version: parseInt(ret[1]) || -1,
			url: ret[2],
			key
		}
	}

	static of(pkg: Package) {
		return new Reference({
			name: pkg.name,
			key: pkg.key,
			url: pkg.url,
			version: pkg.version
		})
	}
}

export type ReferenceWithPath = Reference & { path: string }