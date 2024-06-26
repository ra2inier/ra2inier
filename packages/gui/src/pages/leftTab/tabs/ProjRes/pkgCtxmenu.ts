import { useMemo, useSingleton } from "@ra2inier/core"
import { PkgViewState } from "./pkgViewState"
import { useCtxMenuState } from "@/states/ctxMenu"
import { FlexInput } from "@ra2inier/wc"
import { showInFileBroser } from "@/boot/file"


/**
 * 分组的右键菜单逻辑
 */
export const useGroupCtxmenu = useMemo((state: PkgViewState) => {
   const ctxmenu = useCtxMenuState()
   return ctxmenu.useCtxMenu({
      '新建对象'(groupKey: string) {
         state.onAddClick(groupKey)
      },
      '删除分组': state.deleteGroup,
      '重命名分组'(groupKey: string, el: HTMLElement) {
         const name = <FlexInput>el.querySelector('flex-input.group-name')
         name.setAttribute('disabled', 'false')
         name.focus()
      }
   })
}, s => s.key)[0]


/**
 * 包整体的右键菜单逻辑
 */
export const usePkgviewCtxmenu = useMemo((state: PkgViewState) => {
   const ctxmenu = useCtxMenuState()
   return ctxmenu.useCtxMenu({
      '新建分组'() {
         state.createGroup()
      },
      '打开所在位置'() {
         showInFileBroser(state.path)
      }
   })
}, s => s.key)[0]
