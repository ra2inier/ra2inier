<script lang='ts' setup>
import typeSvg from '@/asset/icons/type.svg?raw'
import { useCtxMenu } from '@/states/ctxMenu';
import { addPanel, PanelParam, PanelType } from '@/states/panelList';
import { addScope, packageNames, saveScope } from '@/stores/projectStore';
import { cloneTyped, ScopeRo } from '@ra2inier/core';
import { isReadonly } from './metaState';
import { reactiveComputed } from '@vueuse/core';

const props = defineProps<{ scopes: Record<string, ScopeRo> }>()
const scopeView: Record<string, ScopeRo> = reactiveComputed(() => props.scopes)


function onSave(scope: ScopeRo) {
   const newOne = cloneTyped(scope, ScopeRo)
   saveScope(newOne)
   scopeView[newOne.key] = newOne
}

function openScopePanel(scope: ScopeRo) {
   const newOne = cloneTyped(scope, ScopeRo)
   const p = new PanelParam({
      label: scope.name,
      type: PanelType.ScopeEditor,
      data: newOne,
      readonly: isReadonly(scope)
   })
   if (!isReadonly(scope)) p.on('save', onSave)
   addPanel(p)
}

function onOpenClick(scope: ScopeRo) {
   openScopePanel(scope)
}

const vCtxmenu = useCtxMenu({
   '新建类型'() {
      openScopePanel(addScope('NEW_SCOPE'))
   }
})

</script>


<template>
   <div :class="$style.scope" v-ctxmenu>
      <h2 class="list-item">
         <p v-svgicon="typeSvg" padding="15%"></p>
         <span>类型</span>
      </h2>
      <ul>
         <li class="list-item" v-for="(scope, key) of scopeView" :key="key" @dblclick="onOpenClick(scope)">
            <span>{{ packageNames[scope.package] }}</span><span>/</span><span>{{ scope.name }}</span>
         </li>
      </ul>
   </div>
</template>

<style scoped lang='scss' module>
.scope {
   @import './meta.scss';
}
</style>
