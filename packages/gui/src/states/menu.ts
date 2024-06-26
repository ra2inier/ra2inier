import { exec, globalEvent, send } from '@/boot/apis';
import { PanelParam, PanelType, usePanelState } from './panelList';
import { openProjectFromBrowser, closeProject, useProjectStore } from '@/stores/projectStore';
import { defineStore } from 'pinia';
import { useSingleton } from '@ra2inier/core';

interface ListItem {
	id: number,
	label: string,
	sub: SubItem[]
}

interface SubItem {
	id: number,
	label?: string,
	component?: string,
	exec?: Function,
	value?: any
}

const createMenuList = () => {
	const panel = usePanelState()
	const store = useProjectStore()
	const menuList: ListItem[] = [
		{
			id: 0,
			label: '文件',
			sub: [
				{
					id: 0,
					label: '新建项目',
					exec() {
						panel.addPanel(new PanelParam({
							label: '新建项目',
							type: PanelType.NewProject,
							init: 'NewProject'
						}))
					}
				},
				{
					id: 1,
					label: '打开项目',
					exec: openProjectFromBrowser,
				},
				{
					id: 2,
					label: '保存项目',
					exec() {
						store.saveProjectInfo()
					}
				},
				{
					id: 3,
					label: '导出为包'
				},
				{
					id: 4,
					label: '导入包'
				},
				{
					id: 5,
					label: '项目设置',
					exec() {
						panel.addPanel(new PanelParam({
							label: '项目设置',
							type: PanelType.ProjectInfo,
							init: 'ProjectInfo'
						}))
					}
				},
				{
					id: 6,
					label: '',
					component: 'Space'
				},
				{
					id: 7,
					label: '关闭项目',
					exec() {
						store.saveProjectInfo()
						closeProject()
					}
				}
			]
		},
		{
			id: 1,
			label: '编辑',
			sub: [
				{
					id: 0,
					label: '复制'
				},
				{
					id: 1,
					label: '粘贴'
				},
				{
					id: 3,
					label: '撤销'
				}
			]
		},
		{
			id: 2,
			label: '对象',
			sub: [
				{
					id: 0,
					label: '添加'
				},
				{
					id: 1,
					label: '删除'
				},
				{
					id: 3,
					label: '编辑'
				},
				{
					id: 4,
					label: '查找'
				},
			]
		},
		{
			id: 3,
			label: '视图',
			sub: [
				{
					id: 0,
					label: '项目资源管理器'
				},
				{
					id: 1,
					label: '元对象管理器'
				},
				{
					id: 2,
					label: '素材管理器'
				},
				{
					id: 3,
					label: '内置启动器'
				},
				{
					id: 4,
					label: 'MOD工具箱'
				},
				{
					id: 5,
					label: '教程'
				},
			]
		},
		{
			id: 4,
			label: '关于',
			sub: [
				{
					id: 0,
					label: '设置',
					exec() {
						panel.addPanel(new PanelParam({
							label: '设置',
							type: PanelType.Setting,
							init: 'project-setting'
						}))
					}
				},
				{
					id: 1,
					label: '首页'
				},
				{
					id: 2,
					label: '帮助'
				},
				{
					id: 3,
					label: '更新'
				},
				{
					id: 4,
					label: '开发者工具',
					exec() {
						exec('debug/devtool')
					}
				},
				{
					id: 5,
					label: 'github',
					exec() { send('open-window', 'github') },
				},
				{
					id: 6,
					label: 'debug',
					exec() {
						panel.addPanel(new PanelParam({
							type: PanelType.DEBUG,
							label: 'DEBUG',
							init: 'debug-panel'
						}))
					},
				},
			]

		},
		{
			id: 5,
			label: '社区',
			sub: [
				{
					id: 0,
					label: 'Mental Omega',
					exec() { location.href = this.value },
					value: 'https://mentalomega.com/'
				},
				{
					id: 1,
					label: 'ModEnc',
					exec() { location.href = this.value },
					value: 'https://modenc.renegadeprojects.com/Main_Page'
				},
				{
					id: 2,
					label: 'Ares',
					exec() { location.href = this.value },
					value: 'https://ares-developers.github.io/Ares-docs/index.html',
				},
				{
					id: 3,
					label: 'Phobos',
					exec() { location.href = this.value },
					value: 'https://phobos.readthedocs.io/zh-cn/latest/New-or-Enhanced-Logics.html',
				},
				{
					id: 4,
					label: 'PPM',
					exec() { location.href = this.value },
					value: 'https://ppmforums.com/',
				}
			]

		},
	]

	function invokeMenuOption(menuId: number, subMenuId: number) {
		const item = menuList[menuId]?.sub[subMenuId]
		if (item && item.exec) item.exec()
	}


	return {
		menuList,
		invokeMenuOption
	}
}

export const useMenuState = defineStore('menu-state', { state: useSingleton(createMenuList) })
export type MenuState = ReturnType<typeof useMenuState>
