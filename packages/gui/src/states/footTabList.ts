import { reactive } from 'vue';

import bellSvg from '@/asset/icons/bell.svg?raw';
import compileSvg from '@/asset/icons/compile.svg?raw';
import consoleSvg from '@/asset/icons/console.svg?raw';
import recycleSvg from '@/asset/icons/recycle.svg?raw';
import { messageList, onMessage } from '@/stores/messageStore';

export interface FootTab {
   id: number,
   order: number,
   label: string,
   type: string,
   name: string,
   badge: string,
   toolButtons: string[]
}

export enum FootTabType {
   Dialog = 'Dialog',
   Recycle = 'Recycle',
   Output = 'Output',
   Message = 'Message'
}


export const footTabList = reactive<FootTab[]>([
   {
      id: 0,
      order: 0,
      label: consoleSvg,
      type: FootTabType.Dialog,
      name: '控制台',
      badge: '12',
      toolButtons: []
   },
   {
      id: 1,
      order: 1,
      label: recycleSvg,
      type: FootTabType.Recycle,
      name: '回收站',
      badge: '',
      toolButtons: []
   },
   {
      id: 2,
      order: 2,
      label: compileSvg,
      type: FootTabType.Output,
      name: '构建',
      badge: '',
      toolButtons: []
   },
   {
      id: 3,
      order: 3,
      label: bellSvg,
      type: FootTabType.Message,
      name: '通知',
      badge: '',
      toolButtons: []
   }
])


/**
 * 使用message tab
 */
export function useMessageTab() {
   const messageTab = footTabList.find(x => x.type === FootTabType.Message)!
   function setMessageBadge(n: string | number) {
      messageTab.badge = n ? n.toString() : ''
   }
   onMessage(() => { setMessageBadge(messageList.length) })
   setMessageBadge(messageList.length)

   return {
      setMessageBadge
   }
}
useMessageTab().setMessageBadge(footTabList.length)

/**
 * tab选择逻辑
 */
const selected = reactive({
   id: footTabList[0].id,
   type: footTabList[0].type
})

function selectFootTabByType(type: FootTabType) {
   for (const tab of footTabList) {
      if (tab.type = type)
         return selectFootTab(tab)
   }
}

function selectFootTab(tab: FootTab) {
   selected.id = tab.id
   selected.type = tab.type
}

export function useFootSelect() {
   return {
      selected,
      select: selectFootTab,
      selectByType: selectFootTabByType
   }
}

export function exchangeFootTab(id1: number, id2: number) {

}
