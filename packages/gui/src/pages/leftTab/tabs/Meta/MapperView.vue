<script lang='ts' setup>
import { shallowReactive } from 'vue';
import mapperSvg from '@/asset/icons/mapper.svg?raw'
import { useCtxMenu } from '@/states/ctxMenu';
import { addPanel, PanelParam, PanelType } from '@/states/panelList';
import { addMapper, packageNames, saveMapper } from '@/stores/projectStore';
import { cloneTyped, MapperRo } from '@ra2inier/core';

import { isReadonly } from './metaState';
import { reactiveComputed } from '@vueuse/core';

defineOptions({ name: 'MapperView' })

const props = defineProps<{ mappers: Record<string, MapperRo> }>()
const mapperView: Record<string, MapperRo> = reactiveComputed(() => props.mappers)

function onSave(data: MapperRo) {
   const newOne = cloneTyped(data, MapperRo)
   saveMapper(newOne)
   mapperView[newOne.key] = newOne
}

function openMapperPanel(mapper: MapperRo) {
   const newOne = cloneTyped(mapper, MapperRo)
   const readonly = isReadonly(mapper)
   const p = new PanelParam({
      label: mapper.name,
      type: PanelType.Mappers,
      data: newOne,
      readonly
   })
   if (!readonly) p.on('save', onSave)
   addPanel(p)
}

function onOpenMapper(mapper: MapperRo) {
   openMapperPanel(mapper)
}

const vCtxmenu = useCtxMenu({
   '新建输出器'() {
      openMapperPanel(addMapper('NEW_MAPPER'))
   }
})

</script>


<template>
   <div :class="$style.mapper" v-ctxmenu>
      <h2 class="list-item">
         <p v-svgicon="mapperSvg" padding="15%"></p>
         <span>输出器</span>
      </h2>
      <ul>
         <li class="list-item" v-for="(mapper, key) in mapperView" @dblclick="onOpenMapper(mapper)" :key="key">
            <span>{{ packageNames[mapper.package] }}</span><span>/</span><span>{{ mapper.name }}</span>
         </li>
      </ul>
   </div>
</template>

<style scoped lang='scss' module>
.mapper {
   @import './meta.scss';
}
</style>
