import { shallowReactive } from 'vue';
import { exec, useLogger } from '@/boot/apis';
import { fromRaw, MarkdownDto, MarkdownRo, MarkdownVo, useToRaw } from '@ra2inier/core';


const logger = useLogger('markdown-store')
const markdowns: Record<string, MarkdownRo> = shallowReactive({})


async function openMarkdownByKey(key: string) {
	const { status, data } = await exec<MarkdownVo>('markdown/get/' + key)
	if (status) {
		const tmp = fromRaw(data, MarkdownRo)
		return markdowns[tmp.key] = tmp
	} else {
		logger.warn('加载markdown文件失败', key)
		return undefined
	}
}

export async function useMarkdown(key: string) {
	if (markdowns[key]) return markdowns[key]
	return await openMarkdownByKey(key)
}

const toRaw = useToRaw(new MarkdownDto, true)
export async function saveMarkdown(markdown: MarkdownRo) {
	const { status, data } = await exec('markdown/save', { data: toRaw(markdown) })
	if (status) {
		logger.debug('保存markdown文件成功', markdown.fullname)
	} else {
		logger.warn('保存markdown文件失败', data)
	}
}

export function addMarkdown() {
	const newOne = new MarkdownRo
	return markdowns[newOne.key] = newOne
}
